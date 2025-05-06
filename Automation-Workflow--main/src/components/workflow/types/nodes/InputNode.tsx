import React from 'react';
import { Handle, Position } from 'reactflow';
import { Trash2, Settings } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';

interface InputNodeProps {
  id: string;
  data: {
    params?: {
      fieldName?: string;
      type?: string;
      showSettings?: boolean;
    };
  };
  selected?: boolean;
}

const InputNode: React.FC<InputNodeProps> = ({ id, data, selected }) => {
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleDelete = () => {
    removeNode(id);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(id, { type: e.target.value });
  };

  const variableName = data.params?.fieldName || id.replace('input-', 'input_');

  return (
    <div
      className={`relative bg-white rounded-lg shadow-md border-2 ${
        selected ? 'border-blue-500' : 'border-gray-200'
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-900">Input</div>
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-500"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Variable Name */}
        <div className="mb-3">
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
      </div>

      {/* Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-white rounded-full"
        style={{ right: -6 }}
      />
    </div>
  );
};

export default InputNode;