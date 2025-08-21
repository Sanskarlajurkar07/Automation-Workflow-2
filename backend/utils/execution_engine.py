"""
Enhanced workflow execution engine with proper dependency handling
"""
import asyncio
import time
import logging
from typing import Dict, Any, List, Optional, Tuple
from .variable_resolver import VariableResolver

logger = logging.getLogger("workflow_api")

class WorkflowExecutionEngine:
    """Handles workflow execution with proper node ordering and variable resolution"""
    
    def __init__(self, nodes: List[Dict], edges: List[Dict]):
        self.nodes = nodes
        self.edges = edges
        self.variable_resolver = VariableResolver(nodes, edges)
        self.node_outputs = {}
        self.execution_results = {}
        
    def calculate_execution_order(self) -> List[Dict]:
        """Calculate topological sort for node execution order"""
        if not self.nodes:
            return []
        
        # Create adjacency list and in-degree count
        graph = {node["id"]: [] for node in self.nodes}
        in_degree = {node["id"]: 0 for node in self.nodes}
        
        # Build graph from edges
        for edge in self.edges:
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
        if len(order) != len(self.nodes):
            logger.warning("Circular dependency detected, using fallback ordering")
            # Fallback: inputs first, then others, then outputs
            input_nodes = [n for n in self.nodes if n["type"] == "input"]
            output_nodes = [n for n in self.nodes if n["type"] == "output"]
            other_nodes = [n for n in self.nodes if n["type"] not in ["input", "output"]]
            return input_nodes + other_nodes + output_nodes
        
        # Convert node IDs back to node objects
        node_map = {node["id"]: node for node in self.nodes}
        return [node_map[node_id] for node_id in order if node_id in node_map]
    
    def get_node_inputs(self, node_id: str, initial_inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Get inputs for a node from connected nodes and initial inputs"""
        inputs = {}
        
        # Find incoming edges
        incoming_edges = [edge for edge in self.edges if edge["target"] == node_id]
        
        # Process connected inputs
        for edge in incoming_edges:
            source_id = edge["source"]
            source_output = self.node_outputs.get(source_id)
            
            if source_output:
                # Provide the main input
                inputs["input"] = source_output.get("output", "")
                
                # Also provide access to all fields for variable resolution
                source_node = next((n for n in self.nodes if n["id"] == source_id), None)
                if source_node:
                    source_name = self.variable_resolver.node_name_map.get(source_id, source_id)
                    for field_name, field_value in source_output.items():
                        inputs[f"{source_name}.{field_name}"] = field_value
        
        # Handle input nodes
        current_node = next((n for n in self.nodes if n["id"] == node_id), None)
        if current_node and current_node["type"] == "input":
            node_name = self.variable_resolver.node_name_map.get(node_id, node_id)
            
            # Find matching input value
            input_value = None
            if node_name in initial_inputs:
                input_value = initial_inputs[node_name]
            elif node_id in initial_inputs:
                input_value = initial_inputs[node_id]
            else:
                # Pattern matching for input_0, input_1, etc.
                for input_key in initial_inputs.keys():
                    if (input_key.startswith("input_") and 
                        (input_key == node_name or input_key.endswith(node_id.split('-')[-1]))):
                        input_value = initial_inputs[input_key]
                        break
            
            if input_value:
                # Handle InputValue model or direct value
                if hasattr(input_value, 'value'):
                    inputs["input"] = input_value.value
                    inputs["type"] = getattr(input_value, 'type', 'Text')
                else:
                    inputs["input"] = input_value
                    inputs["type"] = "Text"
        
        return inputs
    
    async def execute_node(self, node: Dict, inputs: Dict[str, Any], mode: str = "standard") -> Dict[str, Any]:
        """Execute a single node with proper variable resolution"""
        node_type = node["type"]
        node_data = node.get("data", {})
        params = node_data.get("params", {})
        
        logger.info(f"Executing node {node['id']} of type {node_type}")
        
        try:
            if node_type == "input":
                return {
                    "output": inputs.get("input", ""),
                    "text": inputs.get("input", "")
                }
            
            elif node_type == "output":
                # Get output value from connected input or resolve variables
                output_value = inputs.get("input", "No input connected")
                
                # Resolve variables in output field if specified
                output_field = params.get("output", "")
                if output_field:
                    resolved_output = self.variable_resolver.resolve_variables(
                        output_field, self.node_outputs
                    )
                    if resolved_output != output_field:
                        output_value = resolved_output
                
                return {"output": output_value}
            
            elif node_type == "text":
                return {"output": params.get("text", "Sample text")}
            
            elif node_type == "document-to-text":
                await asyncio.sleep(0.1)  # Simulate processing
                input_text = inputs.get("input", params.get("text", "No document"))
                return {"output": f"Processed document: {input_text}"}
            
            elif node_type in ["openai", "anthropic", "claude35", "gemini", "cohere", "perplexity", "xai", "aws", "azure"]:
                return await self._execute_ai_node(node_type, params, inputs)
            
            elif node_type in ["transform", "scripts"]:
                return await self._execute_transform_node(params, inputs)
            
            else:
                logger.warning(f"Unknown node type: {node_type}")
                return {"output": inputs.get("input", f"Unknown node type: {node_type}")}
                
        except Exception as e:
            logger.error(f"Error executing node {node['id']}: {str(e)}")
            raise e
    
    async def _execute_ai_node(self, node_type: str, params: Dict, inputs: Dict) -> Dict[str, Any]:
        """Execute AI model nodes with proper variable resolution"""
        # Get parameters
        model = params.get("model", self._get_default_model(node_type))
        prompt = params.get("prompt", "")
        system = params.get("system", "")
        temperature = float(params.get("temperature", 0.7))
        max_tokens = int(params.get("max_tokens", 1000))
        api_key = params.get("apiKey", "")
        
        # Resolve variables in prompt and system
        resolved_prompt = self.variable_resolver.resolve_variables(prompt, self.node_outputs)
        resolved_system = self.variable_resolver.resolve_variables(system, self.node_outputs)
        
        logger.info(f"Executing {node_type} with resolved prompt: {resolved_prompt[:100]}...")
        
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
        
        # Import and call appropriate handler
        from routers.nodes import (
            handle_openai_query, handle_anthropic_query, handle_gemini_query,
            handle_cohere_query, handle_perplexity_query, handle_xai_query,
            handle_aws_query, handle_azure_query
        )
        
        handlers = {
            "openai": handle_openai_query,
            "anthropic": handle_anthropic_query,
            "claude35": handle_anthropic_query,
            "gemini": handle_gemini_query,
            "cohere": handle_cohere_query,
            "perplexity": handle_perplexity_query,
            "xai": handle_xai_query,
            "aws": handle_aws_query,
            "azure": handle_azure_query
        }
        
        handler = handlers.get(node_type)
        if not handler:
            raise Exception(f"No handler for AI node type: {node_type}")
        
        result = await handler(request_data)
        
        # Check for errors
        if "error" in result:
            error_message = result.get("content", "Unknown error from AI service")
            raise Exception(f"{node_type} API error: {error_message}")
        
        # Return standardized response
        return {
            "response": result.get("content", ""),
            "output": result.get("content", ""),
            "model": model,
            "input_tokens": result.get("input_tokens", 0),
            "output_tokens": result.get("output_tokens", 0)
        }
    
    async def _execute_transform_node(self, params: Dict, inputs: Dict) -> Dict[str, Any]:
        """Execute transformation/script nodes"""
        script = params.get("script", "")
        input_data = inputs.get("input", "")
        
        # Simple transformation for now
        try:
            # In production, you'd want to sandbox script execution
            return {
                "output": f"Transformed: {input_data}",
                "transformed_text": f"Transformed: {input_data}"
            }
        except Exception as e:
            logger.error(f"Transform error: {str(e)}")
            return {"output": f"Transform error: {str(e)}"}
    
    def _get_default_model(self, node_type: str) -> str:
        """Get default model for AI providers"""
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
    
    async def execute_workflow(self, initial_inputs: Dict[str, Any], mode: str = "standard") -> Dict[str, Any]:
        """Execute the entire workflow"""
        start_time = time.time()
        
        # Calculate execution order
        execution_order = self.calculate_execution_order()
        execution_path = [node["id"] for node in execution_order]
        
        logger.info(f"Executing workflow with {len(execution_order)} nodes")
        
        # Reset state
        self.node_outputs = {}
        self.execution_results = {}
        results = {}
        
        # Execute each node in order
        for i, node in enumerate(execution_order):
            node_id = node["id"]
            node_type = node["type"]
            
            logger.info(f"Executing node {i+1}/{len(execution_order)}: {node_id} ({node_type})")
            
            # Get inputs for this node
            node_inputs = self.get_node_inputs(node_id, initial_inputs)
            
            # Execute the node
            node_start_time = time.time()
            try:
                output = await self.execute_node(node, node_inputs, mode)
                node_execution_time = time.time() - node_start_time
                
                # Standardize output
                standardized_output = self.variable_resolver.standardize_node_output(node_type, output)
                
                # Store outputs
                self.node_outputs[node_id] = standardized_output
                
                # Also store by node name
                node_name = self.variable_resolver.node_name_map.get(node_id, node_id)
                self.node_outputs[node_name] = standardized_output
                
                # Record execution result
                self.execution_results[node_id] = {
                    "status": "success",
                    "execution_time": node_execution_time,
                    "output": standardized_output
                }
                
                # If output node, add to final results
                if node_type == "output":
                    output_key = node_name or f"output_{node_id.split('-')[1] if '-' in node_id else '0'}"
                    results[output_key] = {
                        "output": standardized_output.get("output", ""),
                        "type": node.get("data", {}).get("params", {}).get("type", "Text"),
                        "execution_time": node_execution_time,
                        "status": "success",
                        "node_id": node_id,
                        "node_name": node.get("data", {}).get("params", {}).get("nodeName", node_type)
                    }
                
                logger.info(f"Node {node_id} executed successfully in {node_execution_time:.3f}s")
                
            except Exception as e:
                node_execution_time = time.time() - node_start_time
                error_message = str(e)
                logger.error(f"Error executing node {node_id}: {error_message}")
                
                # Record error
                self.execution_results[node_id] = {
                    "status": "error",
                    "execution_time": node_execution_time,
                    "error": error_message
                }
                
                # Add error to results if output node
                if node_type == "output":
                    node_name = self.variable_resolver.node_name_map.get(node_id, node_id)
                    output_key = node_name or f"output_{node_id.split('-')[1] if '-' in node_id else '0'}"
                    results[output_key] = {
                        "output": "",
                        "type": node.get("data", {}).get("params", {}).get("type", "Text"),
                        "execution_time": node_execution_time,
                        "status": "error",
                        "error": error_message,
                        "node_id": node_id,
                        "node_name": node.get("data", {}).get("params", {}).get("nodeName", node_type)
                    }
                
                # Continue execution for other nodes
                continue
        
        total_execution_time = time.time() - start_time
        
        return {
            "outputs": results,
            "execution_time": total_execution_time,
            "status": "success",
            "execution_path": execution_path,
            "node_results": self.execution_results
        }