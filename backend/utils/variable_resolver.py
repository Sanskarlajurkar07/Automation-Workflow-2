"""
Enhanced variable resolution system for workflow execution
"""
import re
import logging
from typing import Dict, Any, List, Tuple, Optional

logger = logging.getLogger("workflow_api")

class VariableResolver:
    """Handles variable resolution in workflow execution"""
    
    def __init__(self, nodes: List[Dict], edges: List[Dict]):
        self.nodes = nodes
        self.edges = edges
        self.node_name_map = self._create_node_name_map()
        
    def _create_node_name_map(self) -> Dict[str, str]:
        """Create bidirectional mapping between node IDs and display names"""
        node_name_map = {}
        
        for node in self.nodes:
            node_id = node["id"]
            node_params = node.get("data", {}).get("params", {})
            
            # Get node name from params or generate default
            node_name = node_params.get("nodeName")
            if not node_name:
                node_type = node["type"]
                if node_id.startswith(f"{node_type}_"):
                    node_name = node_id
                else:
                    # Extract index from ID
                    parts = node_id.split('-')
                    index = parts[-1] if len(parts) > 1 else '0'
                    node_name = f"{node_type}_{index}"
            
            # Bidirectional mapping
            node_name_map[node_id] = node_name
            node_name_map[node_name] = node_id
            
        return node_name_map
    
    def standardize_node_output(self, node_type: str, output: Any) -> Dict[str, Any]:
        """Standardize node output fields based on node type"""
        if not isinstance(output, dict):
            return {"output": output}
        
        standardized = output.copy()
        
        # Ensure all nodes have an 'output' field
        if "output" not in standardized:
            if "response" in standardized:
                standardized["output"] = standardized["response"]
            elif "text" in standardized:
                standardized["output"] = standardized["text"]
            elif "content" in standardized:
                standardized["output"] = standardized["content"]
            elif "result" in standardized:
                standardized["output"] = standardized["result"]
            else:
                # Find first string value
                for key, value in standardized.items():
                    if isinstance(value, str) and value:
                        standardized["output"] = value
                        break
                else:
                    standardized["output"] = ""
        
        # AI nodes should have 'response' field
        ai_node_types = [
            "openai", "anthropic", "claude35", "gemini", "cohere", 
            "perplexity", "xai", "aws", "azure"
        ]
        if node_type in ai_node_types and "response" not in standardized:
            standardized["response"] = standardized.get("output", "")
        
        # Input nodes should have 'text' field for compatibility
        if node_type == "input" and "text" not in standardized:
            standardized["text"] = standardized.get("output", "")
            
        return standardized
    
    def resolve_variables(self, text: str, node_outputs: Dict[str, Any]) -> str:
        """Resolve variables in text using {{ nodeName.field }} format"""
        if not isinstance(text, str):
            return text
        
        # Pattern to match {{ nodeName.field }} with optional whitespace
        pattern = r'\{\{\s*([^}]+)\s*\}\}'
        
        def replace_variable(match):
            variable = match.group(1).strip()
            
            # Split by dot to get node name and field
            if '.' in variable:
                node_name, field = variable.split('.', 1)
                node_name = node_name.strip()
                field = field.strip()
            else:
                node_name = variable.strip()
                field = 'output'
            
            # Find node output
            node_output = self._find_node_output(node_name, node_outputs)
            
            if node_output and isinstance(node_output, dict):
                # Get requested field
                if field in node_output:
                    value = node_output[field]
                    return str(value) if value is not None else ""
                else:
                    # Try field alternatives
                    alternatives = self._get_field_alternatives(field)
                    for alt in alternatives:
                        if alt in node_output:
                            value = node_output[alt]
                            return str(value) if value is not None else ""
            
            # Log warning and return original if not resolved
            logger.warning(f"Could not resolve variable: {variable}")
            return match.group(0)
        
        return re.sub(pattern, replace_variable, text)
    
    def _find_node_output(self, node_name: str, node_outputs: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Find node output by name or ID"""
        # Direct lookup
        if node_name in node_outputs:
            return node_outputs[node_name]
        
        # Try ID lookup
        node_id = self.node_name_map.get(node_name)
        if node_id and node_id in node_outputs:
            return node_outputs[node_id]
        
        # Reverse lookup
        if node_name in self.node_name_map:
            mapped_name = self.node_name_map[node_name]
            if mapped_name in node_outputs:
                return node_outputs[mapped_name]
        
        return None
    
    def _get_field_alternatives(self, field: str) -> List[str]:
        """Get alternative field names for common mappings"""
        alternatives = {
            'text': ['output', 'response', 'content'],
            'response': ['output', 'text', 'content'],
            'output': ['response', 'text', 'content', 'result'],
            'content': ['output', 'response', 'text'],
            'result': ['output', 'response', 'content']
        }
        return alternatives.get(field, [])
    
    def validate_variables(self, text: str, available_outputs: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Validate that variables in text can be resolved"""
        if not isinstance(text, str):
            return []
        
        pattern = r'\{\{\s*([^}]+)\s*\}\}'
        matches = re.findall(pattern, text)
        validation_results = []
        
        for variable in matches:
            variable = variable.strip()
            node_name, field = (variable.split('.', 1) if '.' in variable else (variable, 'output'))
            node_name = node_name.strip()
            field = field.strip()
            
            # Check if variable can be resolved
            node_output = self._find_node_output(node_name, available_outputs)
            is_valid = node_output and (
                field in node_output or 
                any(alt in node_output for alt in self._get_field_alternatives(field))
            )
            
            suggestion = None
            if not is_valid and node_output:
                available_fields = list(node_output.keys())
                if available_fields:
                    suggestion = f"{node_name}.{available_fields[0]}"
            
            validation_results.append({
                "variable": variable,
                "is_valid": is_valid,
                "suggestion": suggestion
            })
        
        return validation_results