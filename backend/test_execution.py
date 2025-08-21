"""
Test script for the enhanced workflow execution system
"""
import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.execution_engine import WorkflowExecutionEngine
from utils.variable_resolver import VariableResolver

async def test_simple_workflow():
    """Test a simple workflow with input -> OpenAI -> output"""
    
    # Sample workflow data
    nodes = [
        {
            "id": "input-1",
            "type": "input",
            "data": {
                "params": {
                    "nodeName": "input_0",
                    "type": "Text"
                }
            }
        },
        {
            "id": "openai-1", 
            "type": "openai",
            "data": {
                "params": {
                    "nodeName": "openai_0",
                    "model": "gpt-3.5-turbo",
                    "prompt": "Summarize this text: {{ input_0.output }}",
                    "temperature": 0.7,
                    "max_tokens": 100
                }
            }
        },
        {
            "id": "output-1",
            "type": "output", 
            "data": {
                "params": {
                    "nodeName": "output_0",
                    "output": "{{ openai_0.response }}",
                    "type": "Text"
                }
            }
        }
    ]
    
    edges = [
        {
            "id": "e1",
            "source": "input-1",
            "target": "openai-1"
        },
        {
            "id": "e2", 
            "source": "openai-1",
            "target": "output-1"
        }
    ]
    
    # Test inputs
    initial_inputs = {
        "input_0": {
            "value": "This is a long piece of text that needs to be summarized. It contains multiple sentences and ideas that should be condensed into a shorter form.",
            "type": "Text"
        }
    }
    
    print("Testing workflow execution...")
    print(f"Nodes: {len(nodes)}")
    print(f"Edges: {len(edges)}")
    print(f"Inputs: {list(initial_inputs.keys())}")
    
    # Create execution engine
    engine = WorkflowExecutionEngine(nodes, edges)
    
    # Test execution order calculation
    execution_order = engine.calculate_execution_order()
    print(f"Execution order: {[node['id'] for node in execution_order]}")
    
    # Test variable resolver
    resolver = VariableResolver(nodes, edges)
    print(f"Node name map: {resolver.node_name_map}")
    
    # Test variable resolution
    test_text = "Hello {{ input_0.output }}, this is from {{ openai_0.response }}"
    mock_outputs = {
        "input_0": {"output": "World", "text": "World"},
        "openai_0": {"response": "AI", "output": "AI"}
    }
    resolved = resolver.resolve_variables(test_text, mock_outputs)
    print(f"Variable resolution test: '{test_text}' -> '{resolved}'")
    
    # Test full execution (will use mock AI responses since no API keys)
    try:
        result = await engine.execute_workflow(initial_inputs)
        print(f"Execution completed in {result['execution_time']:.3f}s")
        print(f"Status: {result['status']}")
        print(f"Outputs: {list(result['outputs'].keys())}")
        
        for output_key, output_data in result['outputs'].items():
            print(f"  {output_key}: {output_data['output'][:100]}...")
            
    except Exception as e:
        print(f"Execution failed: {str(e)}")
    
    print("Test completed!")

if __name__ == "__main__":
    asyncio.run(test_simple_workflow())