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
    
    logger.info(f"Workflow has {len(nodes)} nodes and {len(edges)} edges")
    
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
        execution_order = calculate_execution_order(nodes, edges)
        execution_path = [node["id"] for node in execution_order]
        
        logger.info(f"Execution order: {execution_path}")
        
        # Initialize node outputs and results
        node_outputs = {}
        results = {}
        node_results = {}
        
        # Create a mapping of node IDs to node names for variable resolution
        node_name_map = create_node_name_map(nodes)
        
        # Process each node in order
        for i, node in enumerate(execution_order):
            node_id = node["id"]
            node_type = node["type"]
            node_data = node.get("data", {})
            
            logger.info(f"Executing node {i+1}/{len(execution_order)}: {node_id} ({node_type})")
            
            # Get inputs for this node
            node_inputs = get_node_inputs(node_id, edges, node_outputs, execution_request.inputs, nodes, node_name_map)
            
            # Record node execution start
            node_start_time = time.time()
            
            try:
                # Execute the node based on its type
                output = await execute_node(node_type, node_data, node_inputs, execution_request.mode, node_name_map)
                node_execution_time = time.time() - node_start_time
                
                # Store the output with standardized field names
                standardized_output = standardize_node_output(node_type, output)
                node_outputs[node_id] = standardized_output
                
                # Also store by node name for variable resolution
                node_name = get_node_name(node, node_name_map)
                if node_name:
                    node_outputs[node_name] = standardized_output
                
                node_results[node_id] = {
                    "status": "success",
                    "execution_time": node_execution_time,
                    "output": standardized_output
                }
                
                # Log successful node execution
                logger.info(f"Node {node_id} executed successfully in {node_execution_time:.3f}s")
                
                # If this is an output node, add to results
                if node_type == "output":
                    output_key = get_node_name(node, node_name_map) or f"output_{node_id.split('-')[1] if '-' in node_id else '0'}"
                    results[output_key] = NodeResult(
                        output=standardized_output.get("output", ""),
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
                    output_key = get_node_name(node, node_name_map) or f"output_{node_id.split('-')[1] if '-' in node_id else '0'}"
                    results[output_key] = NodeResult(
                        output="",
                        type=node_data.get("params", {}).get("type", "Text"),
                        execution_time=node_execution_time,
                        status="error",
                        error=error_message,
                        node_id=node_id,
                        node_name=node_data.get("params", {}).get("nodeName", node_type)
                    )
                
                # Continue execution for other nodes unless this is critical
                continue
        
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
                "node_results": node_results if 'node_results' in locals() else {}
            }}
        )
        
        # Return error response
        return WorkflowExecutionResponse(
            execution_id=execution_id,
            outputs={},
            execution_time=time.time() - start_time,
            status="error",
            error=str(e),
            node_results=node_results if 'node_results' in locals() else {}
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
                node["data"]["params"]["nodeName"] = f"input_{node_index}"
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
    if not nodes:
        return []
    
    # Create adjacency list and in-degree count
    graph = {node["id"]: [] for node in nodes}
    in_degree = {node["id"]: 0 for node in nodes}
    
    # Build the graph
    for edge in edges:
        source = edge["source"]
        target = edge["target"]
        if source in graph and target in graph:
            graph[source].append(target)
            in_degree[target] += 1
    
    # Find nodes with no incoming edges (start nodes)
    queue = [node_id for node_id, degree in in_degree.items() if degree == 0]
    order = []
    
    # Process nodes in topological order
    while queue:
        current = queue.pop(0)
        order.append(current)
        
        # Reduce in-degree for neighbors
        for neighbor in graph[current]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    
    # Check for cycles
    if len(order) != len(nodes):
        logger.warning("Circular dependency detected in workflow")
        # Return nodes in a safe order: inputs first, then others, then outputs
        input_nodes = [n for n in nodes if n["type"] == "input"]
        output_nodes = [n for n in nodes if n["type"] == "output"]
        other_nodes = [n for n in nodes if n["type"] not in ["input", "output"]]
        return input_nodes + other_nodes + output_nodes
    
    # Convert node IDs back to node objects
    node_map = {node["id"]: node for node in nodes}
    return [node_map[node_id] for node_id in order if node_id in node_map]

def create_node_name_map(nodes):
    """Create a mapping between node IDs and their display names"""
    node_name_map = {}
    
    for node in nodes:
        node_id = node["id"]
        node_params = node.get("data", {}).get("params", {})
        
        # Get the node name from params, or generate a default
        node_name = node_params.get("nodeName")
        if not node_name:
            # Generate default name based on type and ID
            node_type = node["type"]
            if node_id.startswith(f"{node_type}_"):
                node_name = node_id
            else:
                # Extract index from ID if possible
                parts = node_id.split('-')
                index = parts[-1] if len(parts) > 1 else '0'
                node_name = f"{node_type}_{index}"
        
        node_name_map[node_id] = node_name
        # Also map the reverse for lookups
        node_name_map[node_name] = node_id
    
    return node_name_map

def get_node_name(node, node_name_map):
    """Get the display name for a node"""
    node_id = node["id"]
    return node_name_map.get(node_id, node_id)

def standardize_node_output(node_type, output):
    """Standardize node output fields based on node type"""
    if not isinstance(output, dict):
        return {"output": output}
    
    standardized = output.copy()
    
    # Ensure all nodes have an 'output' field
    if "output" not in standardized:
        # Map common field names to 'output'
        if "response" in standardized:
            standardized["output"] = standardized["response"]
        elif "text" in standardized:
            standardized["output"] = standardized["text"]
        elif "content" in standardized:
            standardized["output"] = standardized["content"]
        elif "result" in standardized:
            standardized["output"] = standardized["result"]
        else:
            # If no recognizable output field, use the first string value
            for key, value in standardized.items():
                if isinstance(value, str) and value:
                    standardized["output"] = value
                    break
            else:
                standardized["output"] = ""
    
    # For AI nodes, ensure they have a 'response' field
    ai_node_types = ["openai", "anthropic", "gemini", "cohere", "perplexity", "xai", "aws", "azure", "claude35"]
    if node_type in ai_node_types:
        if "response" not in standardized:
            standardized["response"] = standardized.get("output", "")
    
    # For input nodes, ensure they have a 'text' field for backward compatibility
    if node_type == "input":
        if "text" not in standardized:
            standardized["text"] = standardized.get("output", "")
    
    return standardized

def resolve_variables(text, node_outputs, node_name_map):
    """Resolve variables in text using the format {{ nodeName.field }}"""
    if not isinstance(text, str):
        return text
    
    # Pattern to match {{ nodeName.field }}
    pattern = r'\{\{\s*([^}]+)\s*\}\}'
    
    def replace_variable(match):
        variable = match.group(1).strip()
        
        # Split by dot to get node name and field
        if '.' in variable:
            node_name, field = variable.split('.', 1)
            node_name = node_name.strip()
            field = field.strip()
        else:
            # If no field specified, assume 'output'
            node_name = variable.strip()
            field = 'output'
        
        # Try to find the node output
        node_output = None
        
        # First try direct node name lookup
        if node_name in node_outputs:
            node_output = node_outputs[node_name]
        else:
            # Try to find by node ID if node name lookup fails
            node_id = node_name_map.get(node_name)
            if node_id and node_id in node_outputs:
                node_output = node_outputs[node_id]
        
        if node_output and isinstance(node_output, dict):
            # Get the requested field
            if field in node_output:
                value = node_output[field]
                return str(value) if value is not None else ""
            else:
                # If field doesn't exist, try common alternatives
                if field == "text" and "output" in node_output:
                    return str(node_output["output"])
                elif field == "response" and "output" in node_output:
                    return str(node_output["output"])
                elif field == "output" and "response" in node_output:
                    return str(node_output["response"])
        
        # If variable couldn't be resolved, return the original placeholder
        logger.warning(f"Could not resolve variable: {variable}")
        return match.group(0)  # Return original {{ variable }}
    
    # Replace all variables in the text
    resolved_text = re.sub(pattern, replace_variable, text)
    return resolved_text

def get_node_inputs(node_id, edges, node_outputs, initial_inputs, nodes, node_name_map):
    """Get the inputs for a node from connected nodes and initial inputs"""
    inputs = {}
    
    # Find all edges that target this node
    incoming_edges = [edge for edge in edges if edge["target"] == node_id]
    
    # Process each incoming edge
    for edge in incoming_edges:
        source_id = edge["source"]
        
        # Get source node output
        source_output = None
        if source_id in node_outputs:
            source_output = node_outputs[source_id]
        else:
            # Try to find by node name
            source_node = next((n for n in nodes if n["id"] == source_id), None)
            if source_node:
                source_name = get_node_name(source_node, node_name_map)
                if source_name in node_outputs:
                    source_output = node_outputs[source_name]
        
        if source_output:
            # Use the standardized output
            inputs["input"] = source_output.get("output", "")
            
            # Also provide access to all fields for variable resolution
            for field_name, field_value in source_output.items():
                source_name = get_node_name(
                    next((n for n in nodes if n["id"] == source_id), {"id": source_id}), 
                    node_name_map
                )
                inputs[f"{source_name}.{field_name}"] = field_value
    
    # For input nodes, use the initial inputs
    current_node = next((n for n in nodes if n["id"] == node_id), None)
    if current_node and current_node["type"] == "input":
        node_name = get_node_name(current_node, node_name_map)
        
        # Try to find matching input by node name or ID
        input_value = None
        if node_name in initial_inputs:
            input_value = initial_inputs[node_name]
        elif node_id in initial_inputs:
            input_value = initial_inputs[node_id]
        else:
            # Try pattern matching for input_0, input_1, etc.
            for input_key in initial_inputs.keys():
                if input_key.startswith("input_") and (
                    input_key == node_name or 
                    input_key.endswith(node_id.split('-')[-1])
                ):
                    input_value = initial_inputs[input_key]
                    break
        
        if input_value:
            # Handle the InputValue model or direct value
            if hasattr(input_value, 'value'):
                inputs["input"] = input_value.value
                inputs["type"] = getattr(input_value, 'type', 'Text')
            else:
                inputs["input"] = input_value
                inputs["type"] = "Text"
            
            logger.info(f"Using input value for {node_id}: {inputs['input']}")
    
    return inputs

async def execute_node(node_type, node_data, inputs, mode, node_name_map):
    """Execute a node based on its type with improved variable resolution"""
    try:
        params = node_data.get("params", {})
        
        if node_type == "input":
            return {
                "output": inputs.get("input", ""),
                "text": inputs.get("input", "")  # For backward compatibility
            }
        elif node_type == "output":
            # Get the output value from the connected input
            output_value = inputs.get("input", "No input connected")
            
            # Also try to resolve any variables in the output field
            output_field = params.get("output", "")
            if output_field:
                # Create a flattened inputs dict for variable resolution
                flat_inputs = {}
                for key, value in inputs.items():
                    if "." in key:
                        flat_inputs[key] = value
                
                resolved_output = resolve_variables(output_field, flat_inputs, node_name_map)
                if resolved_output != output_field:  # If variables were resolved
                    output_value = resolved_output
            
            return {
                "output": output_value
            }
        elif node_type == "text":
            return {
                "output": params.get("text", "Sample text")
            }
        elif node_type == "document-to-text":
            # Simulate document processing
            await asyncio.sleep(0.5)
            input_text = inputs.get("input", params.get("text", "No document"))
            return {
                "output": f"Processed document: {input_text}"
            }
        elif node_type in ["openai", "anthropic", "gemini", "cohere", "perplexity", "xai", "aws", "azure", "claude35"]:
            # Handle AI model nodes
            model = params.get("model", get_default_model(node_type))
            prompt = params.get("prompt", "")
            system = params.get("system", "")
            temperature = float(params.get("temperature", 0.7))
            max_tokens = int(params.get("max_tokens", 1000))
            api_key = params.get("apiKey", "")
            
            # Create a flattened inputs dict for variable resolution
            flat_inputs = {}
            for key, value in inputs.items():
                flat_inputs[key] = value
            
            # Resolve variables in prompt and system
            resolved_prompt = resolve_variables(prompt, flat_inputs, node_name_map)
            resolved_system = resolve_variables(system, flat_inputs, node_name_map)
            
            logger.info(f"Executing {node_type} with prompt: {resolved_prompt[:100]}...")
            
            # Prepare messages
            messages = []
            if resolved_system:
                messages.append({"role": "system", "content": resolved_system})
            messages.append({"role": "user", "content": resolved_prompt})
            
            # Prepare request data
            request_data = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "apiKey": api_key
            }
            
            # Call the appropriate handler
            if node_type == "openai":
                result = await handle_openai_query(request_data)
            elif node_type == "anthropic" or node_type == "claude35":
                result = await handle_anthropic_query(request_data)
            elif node_type == "gemini":
                result = await handle_gemini_query(request_data)
            elif node_type == "cohere":
                result = await handle_cohere_query(request_data)
            elif node_type == "perplexity":
                result = await handle_perplexity_query(request_data)
            elif node_type == "xai":
                result = await handle_xai_query(request_data)
            elif node_type == "aws":
                result = await handle_aws_query(request_data)
            elif node_type == "azure":
                result = await handle_azure_query(request_data)
            else:
                raise Exception(f"Unsupported AI node type: {node_type}")
            
            # Check for errors
            if "error" in result:
                error_message = result.get("content", "Unknown error from AI service")
                logger.error(f"{node_type} node error: {error_message}")
                raise Exception(f"{node_type} API error: {error_message}")
            
            # Return standardized response
            return {
                "response": result.get("content", ""),
                "output": result.get("content", ""),
                "model": model,
                "input_tokens": result.get("input_tokens", 0),
                "output_tokens": result.get("output_tokens", 0)
            }
        
        # Add more node types as needed
        elif node_type == "transform" or node_type == "scripts":
            # Handle transformation nodes
            script = params.get("script", "")
            input_data = inputs.get("input", "")
            
            # Simple transformation (in production, you'd want to sandbox this)
            try:
                # For now, just return the input with a transformation note
                return {
                    "output": f"Transformed: {input_data}",
                    "transformed_text": f"Transformed: {input_data}"
                }
            except Exception as e:
                logger.error(f"Transform error: {str(e)}")
                return {
                    "output": f"Transform error: {str(e)}"
                }
        
        else:
            # Unknown node type - return input as output
            logger.warning(f"Unknown node type: {node_type}")
            return {
                "output": inputs.get("input", f"Unknown node type: {node_type}")
            }
    
    except Exception as e:
        logger.error(f"Error executing node of type {node_type}: {str(e)}", exc_info=True)
        raise e

def get_default_model(node_type):
    """Get default model for each AI provider"""
    defaults = {
        "openai": "gpt-3.5-turbo",
        "anthropic": "claude-3-sonnet",
        "claude35": "claude-3-5-sonnet",
        "gemini": "gemini-pro",
        "cohere": "command",
        "perplexity": "sonar-medium",
        "xai": "grok-1",
        "aws": "amazon-titan",
        "azure": "gpt-35-turbo"
    }
    return defaults.get(node_type, "gpt-3.5-turbo")

def get_dependent_nodes(node_id, edges, remaining_nodes):
    """Find nodes that directly depend on the output of a given node"""
    direct_dependents = [edge["target"] for edge in edges if edge["source"] == node_id]
    
    dependent_nodes = [
        node for node in remaining_nodes 
        if node["id"] in direct_dependents
    ]
    
    return dependent_nodes