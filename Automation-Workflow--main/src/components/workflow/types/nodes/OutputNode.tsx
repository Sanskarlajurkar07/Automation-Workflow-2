import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Trash2, Settings } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';

interface OutputNodeProps {
  id: string;
  data: {
    params?: {
      fieldName?: string;
      type?: string;
      output?: string;
      showSettings?: boolean;
    };
  };
  selected?: boolean;
}

const OutputNode: React.FC<OutputNodeProps> = ({ id, data, selected }) => {
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const [variableInput, setVariableInput] = useState(data.params?.output || '');

  const handleDelete = () => {
    removeNode(id);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(id, { type: e.target.value });
  };

  const handleVariableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setVariableInput(value);

    // Validate variable format
    const isValid = validateVariable(value);
    updateNodeData(id, { output: value, isValid });
  };

  const validateVariable = (variable: string): boolean => {
    const variableRegex = /^\{\{[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+\}\}$/;
    return variableRegex.test(variable);
  };

  const variableName = data.params?.fieldName || id.replace('output-', 'output_');

  return (
    <div
      className={`relative bg-white rounded-lg shadow-md border ${
        selected ? 'border-gray-300' : !data.params?.output ? 'border-red-500' : 'border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200">
        <div className="text-sm font-medium text-gray-900">Output</div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => updateNodeData(id, { showSettings: !data.params?.showSettings })}
            className="text-gray-400 hover:text-gray-600"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-500"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Variable Name */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Variable Name</label>
          <input
            type="text"
            value={variableName}
            readOnly
            className="w-full text-sm border border-gray-200 rounded px-2 py-1 bg-gray-50"
          />
        </div>

        {/* Type Dropdown */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Type</label>
          <select
            value={data.params?.type || 'Text'}
            onChange={handleTypeChange}
            className="w-full text-sm border border-gray-200 rounded px-2 py-1"
          >
            <option value="Text">Text</option>
            <option value="Image">Image</option>
            <option value="Formatted Text">Formatted Text</option>
            <option value="Audio">Audio</option>
            <option value="JSON">JSON</option>
            <option value="File">File</option>
          </select>
        </div>

        {/* Output Field */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Output *</label>
          <input
            type="text"
            value={variableInput}
            onChange={handleVariableChange}
            placeholder='Type "{{nodeName.outputField}}"'
            className={`w-full text-sm border rounded px-2 py-1 ${
              validateVariable(variableInput) ? 'border-gray-200' : 'border-red-500'
            }`}
          />
          {!validateVariable(variableInput) && (
            <p className="text-xs text-red-500 mt-1">Invalid variable format</p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {!data.params?.output && (
        <div className="text-xs text-red-500 px-4 pb-2">⚠️ Output field is required</div>
      )}

      {/* Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white rounded-full"
        style={{ left: -6, top: '50%' }}
      />
    </div>
  );
};

export default OutputNode;