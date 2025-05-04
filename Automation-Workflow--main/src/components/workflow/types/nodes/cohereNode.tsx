import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Settings, Trash2, Brain, Eye, EyeOff } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';

const modelOptions = ['command', 'command-light', 'command-nightly'];

const CohereNode: React.FC<any> = ({ id, data, selected }) => {
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden ${
        selected ? 'ring-2 ring-yellow-500' : 'border border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">Cohere</h3>
              <p className="text-xs text-orange-50/80">
                {data.params?.model || 'Select model'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                updateNodeData(id, { showSettings: !data.params?.showSettings })
              }
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => removeNode(id)}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-red-400/20 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Node Name */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Node Name
          </label>
          <input
            type="text"
            value={data.params?.nodeName || 'cohere_0'}
            onChange={(e) =>
              updateNodeData(id, { params: { ...data.params, nodeName: e.target.value } })
            }
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Model
          </label>
          <select
            value={data.params?.model || modelOptions[0]}
            onChange={(e) =>
              updateNodeData(id, { params: { ...data.params, model: e.target.value } })
            }
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            {modelOptions.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

       {/* System Instructions */}
              <div className="space-y-2">
               <label className="flex items-center justify-between">
                 <span className="text-xs font-medium text-gray-500">System Instructions</span>
                 <div className="flex items-center space-x-2">
                   <button
                     onClick={() => updateNodeData(id, { system: '' })}
                     className="text-xs text-gray-400 hover:text-gray-600"
                   >
                     Clear
                   </button>
                 </div>
               </label>
               <textarea
                 value={data.params?.system || ''}
                 onChange={(e) => updateNodeData(id, { system: e.target.value })}
                 placeholder="Enter system instructions..."
                 className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
               />
             </div>
     
             {/* Prompt */}
             <div>
               <label className="block text-sm font-medium text-gray-700">Prompt</label>
               <textarea
                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                 value={data.params?.prompt || ''}
                 onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
                 placeholder="Type {{}} to utilize variables. E.g., Question: {{input_0.text}}"
               />
             </div>
     
      {/* API Key */}
      <div>
               <label className="block text-sm font-medium text-gray-700">API Key</label>
               <div className="relative">
                 <input
                   type={showApiKey ? 'text' : 'password'}
                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                   value={data.params?.apiKey || ''}
                   onChange={(e) => updateNodeData(id, { apiKey: e.target.value })}
                   placeholder="Enter your API Key"
                 />
                 <button
                   type="button"
                   className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                   onClick={() => setShowApiKey(!showApiKey)}
                 >
                   {showApiKey ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                 </button>
               </div>
               <p className="mt-1 text-xs text-gray-500">Do not share API Key with anyone you do not trust!</p>
             </div>
     
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 -ml-0.5 bg-yellow-500 border-2 border-white rounded-full"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 -mr-0.5 bg-green-500 border-2 border-white rounded-full"
      />
    </div>
    </div>
  );
};

export default CohereNode;