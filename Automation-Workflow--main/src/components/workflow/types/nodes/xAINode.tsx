import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Settings, Trash2, Brain, Eye, EyeOff, ChevronDown, Lock, MessageSquare } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';

// Define TypeScript interface for the node props
interface XAINodeProps {
  id: string;
  data: {
    params?: {
      nodeName?: string;
      model?: string;
      system?: string;
      prompt?: string;
      apiKey?: string;
      showSettings?: boolean;
    };
  };
  selected?: boolean;
}

const modelOptions = [
  { value: 'grok-3-beta', label: 'Grok 3 Beta' },
  { value: 'grok-3-fast-beta', label: 'Grok 3 Fast Beta' },
  { value: 'grok-3-mini-beta', label: 'Grok 3 Mini Beta' },
  { value: 'grok-3-mini-fast-beta', label: 'Grok 3 Mini Fast Beta' },
  { value: 'grok-2-vision', label: 'Grok 2 Vision' }
];

const XAINode: React.FC<XAINodeProps> = ({ id, data, selected }) => {
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(id, { params: { ...data.params, model: e.target.value } });
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-200 ${
        selected ? 'ring-2 ring-gray-700 shadow-gray-200/50' : 'border border-gray-200'
      }`}
    >
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg shadow-inner">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">XAI</h3>
              <p className="text-xs text-gray-300/90 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                {data.params?.model ? modelOptions.find(m => m.value === data.params?.model)?.label : 'Select model'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => updateNodeData(id, { params: { ...data.params, showSettings: !data.params?.showSettings } })}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => removeNode(id)}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-red-500/20 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Content */}
      <div className="p-4 space-y-4">
        {/* Node Name with Icon */}
        <div className="relative">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Node Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={data.params?.nodeName || 'xai_0'}
              onChange={(e) => updateNodeData(id, { params: { ...data.params, nodeName: e.target.value } })}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-transparent"
            />
            <MessageSquare className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Enhanced Model Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Model
          </label>
          <div className="relative">
            <select
              value={data.params?.model || modelOptions[0].value}
              onChange={handleModelChange}
              className="w-full appearance-none px-3 py-1.5 pl-8 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-transparent pr-10"
            >
              {modelOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <Brain className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* System Instructions */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            System Instructions
          </label>
          <textarea
            placeholder="Enter system instructions..."
            value={data.params?.system || ''}
            onChange={(e) =>
              updateNodeData(id, { params: { ...data.params, system: e.target.value } })
            }
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg min-h-[80px] focus:ring-2 focus:ring-gray-700 focus:border-transparent"
          />
        </div>

        {/* Prompt */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Prompt
          </label>
          <textarea
            placeholder="Type {{}} to utilize variables"
            value={data.params?.prompt || ''}
            onChange={(e) =>
              updateNodeData(id, { params: { ...data.params, prompt: e.target.value } })
            }
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg min-h-[80px] focus:ring-2 focus:ring-gray-700 focus:border-transparent"
          />
        </div>

        {/* Enhanced API Key Input */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              placeholder="Enter your API key"
              value={data.params?.apiKey || ''}
              onChange={(e) => updateNodeData(id, { params: { ...data.params, apiKey: e.target.value } })}
              className="w-full pl-8 pr-10 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-transparent"
            />
            <Lock className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">Keep your API key secure and never share it</p>
        </div>
      </div>

      {/* Enhanced Status Bar */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${data.params?.apiKey ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span>{data.params?.apiKey ? 'Connected' : 'Not connected'}</span>
        </div>
        {data.params?.model && (
          <span className="text-gray-600 font-medium">{modelOptions.find(m => m.value === data.params?.model)?.label}</span>
        )}
      </div>

      {/* Enhanced Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 -ml-0.5 bg-gray-700 border-2 border-white rounded-full shadow-md transition-transform hover:scale-110"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 -mr-0.5 bg-green-500 border-2 border-white rounded-full shadow-md transition-transform hover:scale-110"
      />
    </div>
  );
};

export default XAINode;