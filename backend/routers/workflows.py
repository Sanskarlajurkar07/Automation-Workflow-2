from fastapi import APIRouter, Depends, HTTPException, Request, status
from models.workflow import Workflow, WorkflowCreate, WorkflowExecutionRequest, WorkflowExecutionResponse, NodeResult
from models.user import User
from routers.auth import get_current_user
from database import get_workflow_collection
from bson import ObjectId
from datetime import datetime
from typing import List, Dict, Any
import time
import asyncio
import logging
from routers.nodes import (
    handle_openai_query, 
    handle_anthropic_query,
    handle_gemini_query,
    handle_cohere_query,
    handle_perplexity_query,
    handle_xai_query,
    handle_aws_query,
    handle_azure_query
)
import re

logger = logging.getLogger("workflow_api")

router = APIRouter()

@router.get("/", response_model=List[Workflow])
async def list_workflows(request: Request, current_user: User = Depends(get_current_user)):
    workflow_collection = await get_workflow_collection(request)
    workflows = await workflow_collection.find({"user_id": str(current_user.id)}).to_list(None)
    return [Workflow(**workflow, id=str(workflow["_id"])) for workflow in workflows]

@router.post("/", response_model=Workflow, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    request: Request,
    workflow: WorkflowCreate,
    current_user: User = Depends(get_current_user)
):
    workflow_collection = await get_workflow_collection(request)
    workflow_data = {
        **workflow.dict(),
        "user_id": str(current_user.id),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    result = await workflow_collection.insert_one(workflow_data)
    created_workflow = await workflow_collection.find_one({"_id": result.inserted_id})
    return Workflow(**created_workflow, id=str(created_workflow["_id"]))

@router.get("/{workflow_id}", response_model=Workflow)
async def get_workflow(
    workflow_id: str,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    workflow_collection = await get_workflow_collection(request)
    workflow = await workflow_collection.find_one({
        "_id": ObjectId(workflow_id),
        "user_id": str(current_user.id)
    })
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return Workflow(**workflow, id=str(workflow["_id"]))

@router.put("/{workflow_id}", response_model=Workflow)
async def update_workflow(
    workflow_id: str,
    workflow_update: WorkflowCreate,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    workflow_collection = await get_workflow_collection(request)
    workflow = await workflow_collection.find_one({
        "_id": ObjectId(workflow_id),
        "user_id": str(current_user.id)
    })
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    update_data = {
        **workflow_update.dict(),
        "updated_at": datetime.utcnow()
    }
    
    await workflow_collection.update_one(
        {"_id": ObjectId(workflow_id)},
        {"$set": update_data}
    )
    
    updated_workflow = await workflow_collection.find_one({"_id": ObjectId(workflow_id)})
    return Workflow(**updated_workflow, id=str(updated_workflow["_id"]))

@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    workflow_id: str,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    workflow_collection = await get_workflow_collection(request)
    result = await workflow_collection.delete_one({
        "_id": ObjectId(workflow_id),
        "user_id": str(current_user.id)
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Workflow not found")

@router.post("/{workflow_id}/clone", response_model=Workflow)
async def clone_workflow(
    workflow_id: str,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    workflow_collection = await get_workflow_collection(request)
    workflow = await workflow_collection.find_one({
        "_id": ObjectId(workflow_id),
        "user_id": str(current_user.id)
    })
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow_data = {
        **workflow,
        "_id": ObjectId(),
        "name": f"{workflow['name']} (Copy)",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await workflow_collection.insert_one(workflow_data)
    created_workflow = await workflow_collection.find_one({"_id": result.inserted_id})
    return Workflow(**created_workflow, id=str(created_workflow["_id"]))

@router.get("/{workflow_id}/export")
async def export_workflow(
    workflow_id: str,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    workflow_collection = await get_workflow_collection(request)
    workflow = await workflow_collection.find_one({
        "_id": ObjectId(workflow_id),
        "user_id": str(current_user.id)
    })
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Remove internal fields before export
    workflow.pop("_id", None)
    workflow.pop("user_id", None)
    return workflow

@router.post("/{workflow_id}/execute", response_model=WorkflowExecutionResponse)
async def execute_workflow(
    workflow_id: str,
    execution_request: WorkflowExecutionRequest,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Execute a workflow with the given inputs"""
    logger.info(f"Starting workflow execution: {workflow_id}")
    
    # Start execution timer
    start_time = time.time()
    
    # Find the workflow
    workflow_collection = await get_workflow_collection(request)
    workflow = await workflow_collection.find_one({
        "_id": ObjectId(workflow_id),
        "user_id": str(current_user.id)
    })
    
    if not workflow:
        logger.warning(f"Workflow not found: {workflow_id}")
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Extract nodes and edges
    nodes = workflow.get("nodes", [])
    edges = workflow.get("edges", [])
    
    # Log input node types for debugging
    input_nodes = [node for node in nodes if node.get("type") == "input"]
    for node in input_nodes:
        node_id = node.get("id", "unknown")
        node_type = node.get("data", {}).get("params", {}).get("type", "unknown")
        logger.info(f"Input node {node_id} has type: {node_type}")
        
    # Log incoming input values
    logger.info(f"Execution inputs: {execution_request.inputs}")
    
    # Record execution in the database
    execution_log = {
        "workflow_id": workflow_id,
        "user_id": str(current_user.id),
        "started_at": datetime.utcnow(),
        "inputs": execution_request.dict(),
        "status": "in_progress"
    }
    
    executions_collection = request.app.mongodb.workflow_executions
    execution_result = await executions_collection.insert_one(execution_log)
    execution_id = str(execution_result.inserted_id)
    logger.info(f"Created execution log: {execution_id}")
    
    try:
        # Calculate execution order (topological sort)
        if not nodes:
            logger.warning("No nodes found in workflow")
            execution_order = []
            execution_path = []
        else:
            execution_order = calculate_execution_order(nodes, edges)
            execution_path = [node["id"] for node in execution_order]
            
        # If execution_order is empty but we have nodes, add them all in a sensible order
        if not execution_order and nodes:
            logger.warning("No execution order determined, falling back to basic order")
            # Prioritize inputs first, then processing nodes, then outputs
            input_nodes = [node for node in nodes if node["type"] == "input"]
            output_nodes = [node for node in nodes if node["type"] == "output"]
            other_nodes = [node for node in nodes if node["type"] not in ["input", "output"]]
            
            execution_order = input_nodes + other_nodes + output_nodes
            execution_path = [node["id"] for node in execution_order]
        
        logger.info(f"Execution order: {execution_path}")
        
        # Initialize node outputs, results and detailed execution stats
        node_outputs = {}
        results = {}
        node_results = {}
        
        # Process each node in order
        for i, node in enumerate(execution_order):
            node_id = node["id"]
            node_type = node["type"]
            node_data = node.get("data", {})
            
            logger.info(f"Executing node {i+1}/{len(execution_order)}: {node_id} ({node_type})")
            
            # Get inputs for this node
            node_inputs = get_node_inputs(node_id, edges, node_outputs, execution_request.inputs, nodes)
            
            # Record node execution start
            node_start_time = time.time()
            
            try:
                # Execute the node based on its type
                output = await execute_node(node_type, node_data, node_inputs, execution_request.mode)
                node_execution_time = time.time() - node_start_time
                
                # Store the output and node result
                node_outputs[node_id] = output
                node_results[node_id] = {
                    "status": "success",
                    "execution_time": node_execution_time,
                    "output": output
                }
                
                # Log successful node execution
                logger.info(f"Node {node_id} executed successfully in {node_execution_time:.3f}s")
                
                # If this is an output node, add to results
                if node_type == "output":
                    output_key = f"output_{node_id.split('-')[1] if '-' in node_id else '0'}"
                    results[output_key] = NodeResult(
                        output=output.get("output", ""),
                        type=node_data.get("params", {}).get("type", "Text"),
                        execution_time=node_execution_time,
                        status="success",
                        node_id=node_id,
                        node_name=node_data.get("params", {}).get("nodeName", node_type)
                    )
            
            except Exception as e:
                # Log node execution error
                node_execution_time = time.time() - node_start_time
                error_message = str(e)
                logger.error(f"Error executing node {node_id}: {error_message}")
                
                # Record node error
                node_results[node_id] = {
                    "status": "error",
                    "execution_time": node_execution_time,
                    "error": error_message
                }
                
                # Add error to results if it's an output node
                if node_type == "output":
                    output_key = f"output_{node_id.split('-')[1] if '-' in node_id else '0'}"
                    results[output_key] = NodeResult(
                        output="",
                        type=node_data.get("params", {}).get("type", "Text"),
                        execution_time=node_execution_time,
                        status="error",
                        error=error_message,
                        node_id=node_id,
                        node_name=node_data.get("params", {}).get("nodeName", node_type)
                    )
                
                # If it's not the last node, we should consider stopping execution
                if i < len(execution_order) - 1:
                    # Check if this node's output is required for any downstream nodes
                    next_nodes = get_dependent_nodes(node_id, edges, execution_order[i+1:])
                    if next_nodes:
                        # If there are dependent nodes, we can't continue
                        logger.warning(f"Stopping execution after node {node_id} due to error")
                        raise Exception(f"Error in node {node_id}: {error_message}")
        
        # Calculate total execution time
        total_execution_time = time.time() - start_time
        logger.info(f"Workflow executed successfully in {total_execution_time:.3f}s")
        
        # Update execution log in database
        await executions_collection.update_one(
            {"_id": ObjectId(execution_id)},
            {"$set": {
                "completed_at": datetime.utcnow(),
                "execution_time": total_execution_time,
                "status": "completed",
                "outputs": {k: v.dict() for k, v in results.items()},
                "node_results": node_results
            }}
        )
        
        # Return the results
        return WorkflowExecutionResponse(
            execution_id=execution_id,
            outputs=results,
            execution_time=total_execution_time,
            status="success",
            execution_path=execution_path,
            node_results=node_results
        )
        
    except Exception as e:
        # Log the error
        logger.error(f"Error executing workflow: {str(e)}", exc_info=True)
        
        # Update execution log with error
        await executions_collection.update_one(
            {"_id": ObjectId(execution_id)},
            {"$set": {
                "completed_at": datetime.utcnow(),
                "execution_time": time.time() - start_time,
                "status": "error",
                "error": str(e),
                "node_results": node_results
            }}
        )
        
        # Return error response
        return WorkflowExecutionResponse(
            execution_id=execution_id,
            outputs={},
            execution_time=time.time() - start_time,
            status="error",
            error=str(e),
            node_results=node_results
        )

@router.post("/{workflow_id}/fix_input_types")
async def fix_input_types(
    workflow_id: str,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Fix the input node types in a workflow"""
    logger.info(f"Fixing input types for workflow: {workflow_id}")
    
    workflow_collection = await get_workflow_collection(request)
    workflow = await workflow_collection.find_one({
        "_id": ObjectId(workflow_id),
        "user_id": str(current_user.id)
    })
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Extract nodes 
    nodes = workflow.get("nodes", [])
    
    # Find input nodes and ensure they have a type
    updated = False
    fixed_nodes = 0
    
    for i, node in enumerate(nodes):
        if node.get("type") == "input":
            node_id = node.get("id", f"unknown-{i}")
            logger.info(f"Processing input node: {node_id}")
            
            # Ensure the node has a data.params object
            if "data" not in node:
                node["data"] = {}
                updated = True
                logger.info(f"Added missing data object to node {node_id}")
                
            if "params" not in node["data"]:
                node["data"]["params"] = {}
                updated = True
                logger.info(f"Added missing params object to node {node_id}")
                
            # If no type is set, default to Text
            if "type" not in node["data"]["params"] or not node["data"]["params"]["type"]:
                node["data"]["params"]["type"] = "Text"
                updated = True
                fixed_nodes += 1
                logger.info(f"Set default type 'Text' for input node {node_id}")
                
            # Make sure nodeName is set properly
            if "nodeName" not in node["data"]["params"] or not node["data"]["params"]["nodeName"]:
                # Extract node index
                node_index = node_id.split('-')[1] if '-' in node_id else '0'
                node["data"]["params"]["nodeName"] = f"Input {node_index}"
                updated = True
                logger.info(f"Set default nodeName for input node {node_id}")
    
    # If any updates were made, save the workflow
    if updated:
        await workflow_collection.update_one(
            {"_id": ObjectId(workflow_id)},
            {"$set": {"nodes": nodes, "updated_at": datetime.utcnow()}}
        )
        logger.info(f"Fixed {fixed_nodes} input nodes in workflow {workflow_id}")
        return {"message": f"Fixed {fixed_nodes} input node types", "updated": True, "fixed_count": fixed_nodes}
    
    logger.info(f"No input node fixes needed for workflow {workflow_id}")
    return {"message": "No updates needed", "updated": False, "fixed_count": 0}

# Helper functions for workflow execution

def calculate_execution_order(nodes, edges):
    """Calculate the topological sort of nodes for execution order"""
    # Create a graph representation
    graph = {node["id"]: [] for node in nodes}
    
    # Add edges to the graph
    for edge in edges:
        source = edge["source"]
        target = edge["target"]
        if source in graph:
            graph[source].append(target)
    
    # Perform topological sort
    visited = set()
    temp_visited = set()
    order = []
    
    def visit(node_id):
        if node_id in temp_visited:
            raise ValueError(f"Circular dependency detected at node {node_id}")
        if node_id in visited:
            return
        
        temp_visited.add(node_id)
        
        # Visit neighbors
        for neighbor in graph.get(node_id, []):
            visit(neighbor)
        
        temp_visited.remove(node_id)
        visited.add(node_id)
        
        # Get the node and add to order
        node = next((n for n in nodes if n["id"] == node_id), None)
        if node:
            order.append(node)
    
    # Start with input nodes or nodes with no incoming edges
    start_nodes = [
        node["id"] for node in nodes 
        if node["type"] == "input" or not any(edge["target"] == node["id"] for edge in edges)
    ]
    
    # If no start nodes, start with any node
    if not start_nodes and nodes:
        start_nodes = [nodes[0]["id"]]
    
    # Visit all nodes
    for node_id in start_nodes:
        if node_id not in visited:
            visit(node_id)
    
    # Make sure all nodes are visited
    remaining = [node for node in nodes if node["id"] not in visited]
    order.extend(remaining)
    
    # Reverse the order to get the correct execution flow (input first, output last)
    return list(reversed(order))

def get_node_inputs(node_id, edges, node_outputs, initial_inputs, nodes):
    """Get the inputs for a node from connected nodes"""
    inputs = {}
    
    # Find all edges that target this node
    incoming_edges = [edge for edge in edges if edge["target"] == node_id]
    
    # Process each incoming edge
    for edge in incoming_edges:
        source_id = edge["source"]
        if source_id in node_outputs:
            output = node_outputs[source_id]
            # Get the right output field based on the edge
            output_field = edge.get("sourceHandle", "output")
            input_field = edge.get("targetHandle", "input")
            
            # Handle special case where .text is used instead of .output
            if output_field == "text" and "output" in output:
                output_field = "output"
            
            if output_field in output:
                inputs[input_field] = output[output_field]
                
                # DISABLED: Special mapping for nodeName.text pattern for backward compatibility
                # This was causing unintended synchronization between input fields
                # source_node = next((n for n in nodes if n["id"] == source_id), None)
                # if source_node and source_node.get("type") == "input" and edge.get("id"):
                #     node_name = source_node.get("data", {}).get("params", {}).get("nodeName", source_id)
                #     inputs[f"{node_name}.text"] = output[output_field]
    
    # For input nodes, use the initial inputs
    if not inputs and node_id.startswith("input"):
        input_key = f"input_{node_id.split('-')[1] if '-' in node_id else '0'}"
        if input_key in initial_inputs:
            # Ensure we're getting the value correctly
            input_value = initial_inputs[input_key]
            
            # Handle the InputValue model or direct value
            if hasattr(input_value, 'value'):
                inputs["input"] = input_value.value
            else:
                inputs["input"] = input_value
                
            # Add type information that might be needed by the node
            node_info = next((n for n in nodes if n["id"] == node_id), None)
            if node_info:
                input_type = node_info.get("data", {}).get("params", {}).get("type", "Text")
                inputs["type"] = input_type
    
    return inputs

async def execute_node(node_type, node_data, inputs, mode):
    """Execute a node based on its type"""
    try:
        # Default implementation that can be expanded based on node types
        if node_type == "input":
            return {
                "output": inputs.get("input", "")
            }
        elif node_type == "output":
            return {
                "output": inputs.get("input", "No input")
            }
        elif node_type == "text":
            return {
                "output": node_data.get("params", {}).get("text", "Sample text")
            }
        elif node_type == "document-to-text":
            # Simulate document processing
            await asyncio.sleep(0.5)
            return {
                "output": f"Processed document: {inputs.get('document', 'No document')}"
            }
        elif node_type == "openai":
            # Extract parameters
            params = node_data.get("params", {})
            model = params.get("model", "gpt-3.5-turbo")
            prompt = params.get("prompt", "")
            system = params.get("system", "")
            temperature = float(params.get("temperature", 0.7))
            max_tokens = int(params.get("max_tokens", 1000))
            api_key = params.get("apiKey", "")
            
            # Replace variables in prompt
            for key, value in inputs.items():
                placeholder = f"{{{{{key}}}}}"
                prompt = prompt.replace(placeholder, str(value))
            
            # Special handling for {{nodeName.text}} format - replace with correct {{nodeName.output}} format
            # This pattern might be used by users for input nodes, but we store everything in "output" property
            text_var_pattern = r"{{([^}]+)\.text}}"
            matches = re.findall(text_var_pattern, prompt)
            for node_name in matches:
                # Check if we have this node output available
                if f"{node_name}.output" in inputs:
                    text_placeholder = f"{{{{{node_name}.text}}}}"
                    output_value = inputs[f"{node_name}.output"]
                    prompt = prompt.replace(text_placeholder, str(output_value))
            
            # Also check system prompt for the same patterns
            matches = re.findall(text_var_pattern, system)
            for node_name in matches:
                if f"{node_name}.output" in inputs:
                    text_placeholder = f"{{{{{node_name}.text}}}}"
                    output_value = inputs[f"{node_name}.output"]
                    system = system.replace(text_placeholder, str(output_value))
            
            # Prepare the request for the OpenAI handler
            messages = [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ]
            
            request_data = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "apiKey": api_key
            }
            
            # Call the handler
            result = await handle_openai_query(request_data)
            
            # Check for errors
            if "error" in result:
                error_message = result.get("content", "Unknown error from OpenAI service")
                # Log error for debugging
                logger.error(f"OpenAI node error: {error_message}")
                raise Exception(f"OpenAI API error: {error_message}")
            
            # Return formatted response
            return {
                "response": result.get("content", ""),
                "model": model,
                "output": result.get("content", "")  # Also map to output for consistency
            }
        elif node_type == "anthropic":
            # Extract parameters
            params = node_data.get("params", {})
            model = params.get("model", "claude-3-sonnet")
            prompt = params.get("prompt", "")
            system = params.get("system", "")
            max_tokens = int(params.get("max_tokens", 1000))
            
            # Replace variables in prompt
            for key, value in inputs.items():
                placeholder = f"{{{{{key}}}}}"
                prompt = prompt.replace(placeholder, str(value))
            
            # Prepare the request for the Anthropic handler
            messages = [
                {"role": "user", "content": prompt}
            ]
            
            request_data = {
                "model": model,
                "system": system,
                "messages": messages,
                "max_tokens": max_tokens
            }
            
            # Call the handler
            result = await handle_anthropic_query(request_data)
            
            # Return formatted response
            return {
                "response": result.get("content", ""),
                "model": model,
                "output": result.get("content", "")  # Also map to output for consistency
            }
        elif node_type == "gemini":
            # Extract parameters
            params = node_data.get("params", {})
            model = params.get("model", "gemini-pro")
            prompt = params.get("prompt", "")
            temperature = float(params.get("temperature", 0.7))
            
            # Replace variables in prompt
            for key, value in inputs.items():
                placeholder = f"{{{{{key}}}}}"
                prompt = prompt.replace(placeholder, str(value))
            
            # Prepare the request for the Gemini handler
            messages = [
                {"role": "user", "content": prompt}
            ]
            
            request_data = {
                "model": model,
                "messages": messages,
                "temperature": temperature
            }
            
            # Call the handler
            result = await handle_gemini_query(request_data)
            
            # Return formatted response
            return {
                "response": result.get("content", ""),
                "model": model,
                "output": result.get("content", "")  # Also map to output for consistency
            }
        elif node_type == "cohere":
            # Extract parameters
            params = node_data.get("params", {})
            model = params.get("model", "command")
            prompt = params.get("prompt", "")
            temperature = float(params.get("temperature", 0.7))
            max_tokens = int(params.get("max_tokens", 1000))
            
            # Replace variables in prompt
            for key, value in inputs.items():
                placeholder = f"{{{{{key}}}}}"
                prompt = prompt.replace(placeholder, str(value))
            
            # Prepare the request for the Cohere handler
            messages = [
                {"role": "user", "content": prompt}
            ]
            
            request_data = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            
            # Call the handler
            result = await handle_cohere_query(request_data)
            
            # Return formatted response
            return {
                "response": result.get("content", ""),
                "model": model,
                "output": result.get("content", "")  # Also map to output for consistency
            }
        elif node_type == "perplexity":
            # Extract parameters
            params = node_data.get("params", {})
            model = params.get("model", "sonar-medium")
            prompt = params.get("prompt", "")
            
            # Replace variables in prompt
            for key, value in inputs.items():
                placeholder = f"{{{{{key}}}}}"
                prompt = prompt.replace(placeholder, str(value))
            
            # Prepare the request for the Perplexity handler
            messages = [
                {"role": "user", "content": prompt}
            ]
            
            request_data = {
                "model": model,
                "messages": messages
            }
            
            # Call the handler
            result = await handle_perplexity_query(request_data)
            
            # Return formatted response
            return {
                "response": result.get("content", ""),
                "model": model,
                "output": result.get("content", "")  # Also map to output for consistency
            }
        elif node_type == "xai":
            # Extract parameters
            params = node_data.get("params", {})
            prompt = params.get("prompt", "")
            
            # Replace variables in prompt
            for key, value in inputs.items():
                placeholder = f"{{{{{key}}}}}"
                prompt = prompt.replace(placeholder, str(value))
            
            # Prepare the request for the XAI handler
            messages = [
                {"role": "user", "content": prompt}
            ]
            
            request_data = {
                "messages": messages
            }
            
            # Call the handler
            result = await handle_xai_query(request_data)
            
            # Return formatted response
            return {
                "response": result.get("content", ""),
                "model": "xai-chat",
                "output": result.get("content", "")  # Also map to output for consistency
            }
        elif node_type == "aws":
            # Extract parameters
            params = node_data.get("params", {})
            model = params.get("model", "amazon-titan")
            prompt = params.get("prompt", "")
            
            # Replace variables in prompt
            for key, value in inputs.items():
                placeholder = f"{{{{{key}}}}}"
                prompt = prompt.replace(placeholder, str(value))
            
            # Prepare the request for the AWS handler
            messages = [
                {"role": "user", "content": prompt}
            ]
            
            request_data = {
                "model": model,
                "messages": messages
            }
            
            # Call the handler
            result = await handle_aws_query(request_data)
            
            # Return formatted response
            return {
                "response": result.get("content", ""),
                "model": model,
                "output": result.get("content", "")  # Also map to output for consistency
            }
        elif node_type == "azure":
            # Extract parameters
            params = node_data.get("params", {})
            model = params.get("model", "gpt-35-turbo")
            prompt = params.get("prompt", "")
            system = params.get("system", "")
            temperature = float(params.get("temperature", 0.7))
            max_tokens = int(params.get("max_tokens", 1000))
            
            # Replace variables in prompt
            for key, value in inputs.items():
                placeholder = f"{{{{{key}}}}}"
                prompt = prompt.replace(placeholder, str(value))
            
            # Prepare the request for the Azure handler
            messages = [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ]
            
            request_data = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            
            # Call the handler
            result = await handle_azure_query(request_data)
            
            # Return formatted response
            return {
                "response": result.get("content", ""),
                "model": model,
                "output": result.get("content", "")  # Also map to output for consistency
            }
        # Add more node types as needed
        else:
            # Unknown node type
            logger.warning(f"Unknown node type: {node_type}")
            return {
                "output": f"Unknown node type: {node_type}"
            }
    except Exception as e:
        # Log the error
        logger.error(f"Error executing node of type {node_type}: {str(e)}", exc_info=True)
        
        # Return an error result that downstream nodes can handle
        return {
            "error": str(e),
            "output": f"Error: {str(e)}"  # Include in output for compatibility
        }

# Helper function to find nodes that depend on the output of a given node
def get_dependent_nodes(node_id, edges, remaining_nodes):
    """Find nodes that directly or indirectly depend on the output of a given node"""
    # Get direct dependent nodes
    direct_dependents = [edge["target"] for edge in edges if edge["source"] == node_id]
    
    # Filter only nodes that are in the remaining execution order
    dependent_nodes = [
        node for node in remaining_nodes 
        if node["id"] in direct_dependents
    ]
    
    return dependent_nodes