import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { FileText, Settings, Trash2, Plus, Maximize2, Code } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';

interface DocumentToTextNodeProps {
  id: string;
  data: {
    params?: {
      fieldName?: string;
      text?: string;
      showSettings?: boolean;
    };
  };
  selected?: boolean;
}

const DocumentToTextNode: React.FC<DocumentToTextNodeProps> = ({ id, data, selected }) => {
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const [textInput, setTextInput] = useState(data.params?.text || '');

  const handleDelete = () => {
    removeNode(id);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTextInput(value);
    updateNodeData(id, { text: value });
  };

  const variableName = data.params?.fieldName || id.replace('document-to-text-', 'text_');

  return (
    <div
      className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-200 w-[380px] ${
        selected ? 'ring-2 ring-blue-500 shadow-blue-100' : 'shadow-gray-200/50'
      }`}
    >
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">Document to Text</h3>
              <p className="text-xs text-blue-50/80">
                {textInput ? 'Text configured' : 'Configure text'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => updateNodeData(id, { params: { ...data.params, showSettings: !data.params?.showSettings } })}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-red-400/20 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Variable Name with better styling */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Variable Name</label>
          <div className="relative">
            <input
              type="text"
              value={variableName}
              readOnly
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Code className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Enhanced Text Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-gray-500">
              Text Input
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="flex items-center gap-1">
              <button
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title="Add Variable"
              >
                <Plus className="w-4 h-4 text-gray-400" />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title="Expand Editor"
              >
                <Maximize2 className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
          
          <div className="relative">
            <textarea
              value={textInput}
              onChange={handleTextChange}
              placeholder="Type your text here. Use '{{' to insert variables..."
              className={`w-full h-[120px] p-3 text-sm bg-white border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                !textInput ? 'border-red-200' : 'border-gray-200'
              }`}
            />
            {!textInput && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-500" />
                Text input is required
              </p>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            This node allows you to process documents and extract text content that can be used in downstream nodes.
          </p>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${textInput ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span>{textInput ? 'Text configured' : 'Awaiting text input'}</span>
        </div>
      </div>

      {/* Enhanced Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 -ml-0.5 bg-blue-500 border-2 border-white rounded-full shadow-md transition-transform hover:scale-110"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 -mr-0.5 bg-indigo-500 border-2 border-white rounded-full shadow-md transition-transform hover:scale-110"
      />
    </div>
  );
};

export default DocumentToTextNode;