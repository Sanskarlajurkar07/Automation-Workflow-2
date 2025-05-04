import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Settings, Trash2, Cloud } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';

interface AzureNodeProps {
  id: string;
  data: {
    params?: {
      nodeName?: string;
      system?: string;
      prompt?: string;
      model?: string;
      apiKey?: string;
      usePersonalKey?: boolean;
      endpoint?: string;
      showSettings?: boolean;
    };
  };
  selected?: boolean;
}

const modelOptions = [
  'text-davinci-003',
  'text-davinci-002',
  'code-davinci-002',
  'gpt-4',
  'gpt-3.5-turbo',
];

const AzureNode: React.FC<AzureNodeProps> = ({ id, data, selected }) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleToggleSettings = () => {
    updateNodeData(id, { showSettings: !data.params?.showSettings });
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden ${
        selected ? 'ring-2 ring-blue-700' : 'border border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">Azure</h3>
              <p className="text-xs text-indigo-50/80">
                {data.params?.model || 'Select model'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleSettings}
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
          <label className="block text-sm font-medium text-gray-700">
            Node Name
          </label>
          <input
            type="text"
            value={data.params?.nodeName || 'azure_0'}
            onChange={(e) =>
              updateNodeData(id, { params: { ...data.params, nodeName: e.target.value } })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-700 focus:ring-blue-700 sm:text-sm"
          />
        </div>

        {/* System Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            System Instructions
          </label>
          <textarea
            value={data.params?.system || ''}
            onChange={(e) =>
              updateNodeData(id, { params: { ...data.params, system: e.target.value } })
            }
            placeholder="Enter system instructions..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-700 focus:ring-blue-700 sm:text-sm"
          />
        </div>

        {/* Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Prompt</label>
          <textarea
            value={data.params?.prompt || ''}
            onChange={(e) =>
              updateNodeData(id, { params: { ...data.params, prompt: e.target.value } })
            }
            placeholder="Type {{}} to utilize variables. E.g., Question: {{input_0.text}}"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-700 focus:ring-blue-700 sm:text-sm"
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Model</label>
          <select
            value={data.params?.model || ''}
            onChange={(e) =>
              updateNodeData(id, { params: { ...data.params, model: e.target.value } })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-700 focus:ring-blue-700 sm:text-sm"
          >
            <option value="">Select a model</option>
            {modelOptions.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700">API Key</label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={data.params?.apiKey || ''}
              onChange={(e) =>
                updateNodeData(id, { params: { ...data.params, apiKey: e.target.value } })
              }
              placeholder="Enter your API Key"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-700 focus:ring-blue-700 sm:text-sm"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? (
                <span className="text-gray-400">Hide</span>
              ) : (
                <span className="text-gray-400">Show</span>
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Do not share your API Key with anyone you do not trust!
          </p>
        </div>

        {/* Endpoint */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Endpoint</label>
          <input
            type="text"
            value={data.params?.endpoint || ''}
            onChange={(e) =>
              updateNodeData(id, { params: { ...data.params, endpoint: e.target.value } })
            }
            placeholder="Enter your Azure endpoint"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-700 focus:ring-blue-700 sm:text-sm"
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span
            className={`w-2 h-2 rounded-full ${
              data.params?.apiKey ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
          <span>{data.params?.apiKey ? 'Connected' : 'API Key required'}</span>
        </div>
        {data.params?.model && (
          <span className="text-blue-600 font-medium">{data.params.model}</span>
        )}
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 -ml-0.5 bg-gray-700 border-2 border-white rounded-full"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 -mr-0.5 bg-green-500 border-2 border-white rounded-full"
      />
    </div>
  );
};

export default AzureNode;