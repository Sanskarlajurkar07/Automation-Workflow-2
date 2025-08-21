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
from utils.execution_engine import WorkflowExecutionEngine

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
    
    start_time = time.time()
    
    workflow_collection = await get_workflow_collection(request)
    workflow = await workflow_collection.find_one({
        "_id": ObjectId(workflow_id),
        "user_id": str(current_user.id)
    })
    
    if not workflow:
        logger.warning(f"Workflow not found: {workflow_id}")
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    nodes = workflow.get("nodes", [])
    edges = workflow.get("edges", [])
    
    logger.info(f"Workflow has {len(nodes)} nodes and {len(edges)} edges")
    
    # Record execution
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
    
    try:
        # Use the new execution engine
        engine = WorkflowExecutionEngine(nodes, edges)
        execution_result = await engine.execute_workflow(execution_request.inputs, execution_request.mode)
        
        # Update execution log
        await executions_collection.update_one(
            {"_id": ObjectId(execution_id)},
            {"$set": {
                "completed_at": datetime.utcnow(),
                "execution_time": execution_result["execution_time"],
                "status": "completed",
                "outputs": execution_result["outputs"],
                "node_results": execution_result["node_results"]
            }}
        )
        
        # Convert outputs to NodeResult objects
        formatted_outputs = {}
        for key, output_data in execution_result["outputs"].items():
            formatted_outputs[key] = NodeResult(**output_data)
        
        return WorkflowExecutionResponse(
            execution_id=execution_id,
            outputs=formatted_outputs,
            execution_time=execution_result["execution_time"],
            status=execution_result["status"],
            execution_path=execution_result["execution_path"],
            node_results=execution_result["node_results"]
        )
        
    except Exception as e:
        logger.error(f"Error executing workflow: {str(e)}", exc_info=True)
        
        await executions_collection.update_one(
            {"_id": ObjectId(execution_id)},
            {"$set": {
                "completed_at": datetime.utcnow(),
                "execution_time": time.time() - start_time,
                "status": "error",
                "error": str(e),
                "node_results": getattr(engine, 'execution_results', {}) if 'engine' in locals() else {}
            }}
        )
        
        return WorkflowExecutionResponse(
            execution_id=execution_id,
            outputs={},
            execution_time=time.time() - start_time,
            status="error",
            error=str(e),
            node_results=getattr(engine, 'execution_results', {}) if 'engine' in locals() else {}
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

@router.get("/{workflow_id}/validate")
async def validate_workflow_variables(
    workflow_id: str,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Validate all variables in a workflow"""
    workflow_collection = await get_workflow_collection(request)
    workflow = await workflow_collection.find_one({
        "_id": ObjectId(workflow_id),
        "user_id": str(current_user.id)
    })
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    nodes = workflow.get("nodes", [])
    edges = workflow.get("edges", [])
    
    # Use variable resolver to validate
    resolver = VariableResolver(nodes, edges)
    validation_results = {}
    
    for node in nodes:
        node_id = node["id"]
        node_params = node.get("data", {}).get("params", {})
        
        # Check prompt and system fields for variables
        for field_name in ["prompt", "system", "output"]:
            field_value = node_params.get(field_name, "")
            if field_value and "{{" in field_value:
                validation = resolver.validate_variables(field_value, {})
                if validation:
                    validation_results[f"{node_id}.{field_name}"] = validation
    
    return {
        "workflow_id": workflow_id,
        "validation_results": validation_results,
        "has_errors": any(
            any(not v["is_valid"] for v in validations)
            for validations in validation_results.values()
        )
    }