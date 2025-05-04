import React, { useState } from 'react';
import { useFlowStore } from '../../store/flowStore';
import { AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';

interface VariableBuilderProps {
  onSelect: (variable: string) => void;
  nodeId: string; // Current node ID
  position: { x: number, y: number };
  inputType?: string; // Expected type of input (for compatibility checking)
}

export const VariableBuilder: React.FC<VariableBuilderProps> = ({ 
  onSelect, 
  nodeId,
  position,
  inputType = 'Text'
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const { nodes, edges } = useFlowStore();

  // Get all connected nodes (nodes with edges pointing to the current node)
  const connectedNodes = React.useMemo(() => {
    return edges
      .filter(edge => edge.target === nodeId)
      .map(edge => edge.source)
      .map(sourceId => nodes.find(node => node.id === sourceId))
      .filter(node => node !== undefined) as any[];
  }, [edges, nodeId, nodes]);

  // Get all available nodes if no connected nodes
  const availableNodes = React.useMemo(() => {
    return connectedNodes.length > 0 ? connectedNodes : nodes.filter(n => n.id !== nodeId);
  }, [connectedNodes, nodes, nodeId]);

  // Define output fields for each node type with their types
  const getNodeOutputFields = (nodeType: string) => {
    // Map of node types to their output fields and types
    const outputFieldMap: Record<string, Array<{ name: string, type: string }>> = {
      input: [{ name: 'output', type: 'Text' }],
      openai: [
        { name: 'response', type: 'Text' },
        { name: 'model', type: 'Text' },
        { name: 'input_tokens', type: 'Number' },
        { name: 'output_tokens', type: 'Number' }
      ],
      output: [{ name: 'output', type: 'Text' }],
      text: [{ name: 'output', type: 'Text' }],
      anthropic: [
        { name: 'response', type: 'Text' },
        { name: 'model', type: 'Text' },
        { name: 'input_tokens', type: 'Number' },
        { name: 'output_tokens', type: 'Number' }
      ],
      gemini: [
        { name: 'response', type: 'Text' },
        { name: 'model', type: 'Text' }
      ],
      cohere: [
        { name: 'response', type: 'Text' },
        { name: 'model', type: 'Text' },
        { name: 'input_tokens', type: 'Number' },
        { name: 'output_tokens', type: 'Number' }
      ],
      'document-to-text': [{ name: 'output', type: 'Text' }],
      transform: [{ name: 'output', type: 'Text' }],
      'url-loader': [{ name: 'content', type: 'Text' }, { name: 'url', type: 'Text' }],
      // Add more node types and their output fields with types
    };
    
    return outputFieldMap[nodeType] || [];
  };

  // Filter output fields based on input type compatibility
  const filterCompatibleFields = (fields: Array<{ name: string, type: string }>) => {
    if (!inputType) return fields;
    
    // Type compatibility rules
    const typeCompatibility: Record<string, string[]> = {
      'Text': ['Text', 'String', 'Number', 'Any'],
      'Number': ['Number', 'Any'],
      'Image': ['Image', 'Any'],
      'Audio': ['Audio', 'Any'],
      'File': ['File', 'Any'],
      'JSON': ['JSON', 'Any'],
      'Any': ['Text', 'Number', 'Image', 'Audio', 'File', 'JSON', 'Any']
    };
    
    // Get compatible types for the input type
    const compatibleTypes = typeCompatibility[inputType] || [inputType];
    
    return fields.filter(field => compatibleTypes.includes(field.type));
  };

  const handleSelectNode = (node: any) => {
    setSelectedNode(node.id);
    setStep(2);
  };

  const handleBack = () => {
    setSelectedNode(null);
    setStep(1);
  };

  const handleSelectField = (node: any, field: { name: string, type: string }) => {
    const nodeName = node.data.params?.nodeName || node.id;
    onSelect(`${nodeName}.${field.name}`);
  };

  const selectedNodeData = selectedNode ? nodes.find(n => n.id === selectedNode) : null;
  const outputFields = selectedNodeData 
    ? filterCompatibleFields(getNodeOutputFields(selectedNodeData.type))
    : [];

  return (
    <div 
      className="absolute z-50 bg-white border border-gray-200 rounded-md shadow-lg p-4 w-72 max-h-80 overflow-auto"
      style={{ 
        left: position.x, 
        top: position.y,
        animation: 'fadeIn 0.1s ease-out'
      }}
    >
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Title with progress */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">
          {step === 1 ? 'Select Node' : 'Select Output Field'}
        </h3>
        <div className="flex items-center text-xs text-gray-500">
          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full mr-1 ${
            step === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}>1</span>
          <ArrowRight className="w-3 h-3 mx-1 text-gray-400" />
          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${
            step === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}>2</span>
        </div>
      </div>

      {/* Connected nodes warning if no connected nodes */}
      {step === 1 && connectedNodes.length === 0 && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
          <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-xs text-yellow-700">
            No connected nodes found. Connect nodes to use their outputs as variables.
          </p>
        </div>
      )}

      {step === 1 ? (
        <ul className="space-y-1 max-h-60 overflow-y-auto">
          {availableNodes.map((node) => (
              <li key={node.id}>
                <button
                onClick={() => handleSelectNode(node)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center justify-between"
                >
                <span>{node.data.params?.nodeName || node.id}</span>
                <span className="text-xs text-gray-500">{node.type}</span>
                </button>
              </li>
            ))}
          </ul>
      ) : (
        <>
          <button
            onClick={handleBack}
            className="mb-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
          >
            ← Back to nodes
          </button>
          
          {outputFields.length > 0 ? (
            <ul className="space-y-1 max-h-60 overflow-y-auto">
              {outputFields.map((field) => (
                <li key={field.name}>
                <button
                    onClick={() => handleSelectField(selectedNodeData, field)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center justify-between"
                >
                    <div className="flex items-center">
                      <span>{field.name}</span>
                      <span className="ml-2 text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                        {field.type}
                      </span>
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                </button>
              </li>
            ))}
          </ul>
          ) : (
            <div className="p-2 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-xs text-gray-500">
                No compatible output fields found for this node type.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};