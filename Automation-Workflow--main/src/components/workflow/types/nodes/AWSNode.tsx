import React from 'react';
import { Handle, Position } from 'reactflow';
import { Settings, Trash2, Cloud } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';

const AWSNode: React.FC<any> = ({ id, data, selected }) => {
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const modelOptions = [
    'text-davinci-003',
    'text-davinci-002',
    'code-davinci-002',
    'gpt-4',
    'gpt-3.5-turbo',
  ];

  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden ${
        selected ? 'ring-2 ring-gray-700' : 'border border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">AWS</h3>
              <p className="text-xs text-gray-50/80">
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
          <label className="block text-sm font-medium text-gray-700">
            Node Name
          </label>
          <input
            type="text"
            value={data.params?.nodeName || 'aws_0'}
            onChange={(e) =>
              updateNodeData(id, { params: { ...data.params, nodeName: e.target.value } })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-700 focus:ring-gray-700 sm:text-sm"
          />
        </div>

        {/* AWS Service */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            AWS Service
          </label>
          <select
            value={data.params?.service || ''}
            onChange={(e) =>
              updateNodeData(id, { params: { ...data.params, service: e.target.value } })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-700 focus:ring-gray-700 sm:text-sm"
          >
            <option value="">Select a service</option>
            <option value="s3">S3</option>
            <option value="lambda">Lambda</option>
            <option value="dynamodb">DynamoDB</option>
          </select>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700">API Key</label>
          <input
            type="password"
            value={data.params?.apiKey || ''}
            onChange={(e) =>
              updateNodeData(id, { params: { ...data.params, apiKey: e.target.value } })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-700 focus:ring-gray-700 sm:text-sm"
            placeholder="Enter your API Key"
          />
          <p className="mt-1 text-xs text-gray-500">
            Do not share your API Key with anyone you do not trust!
          </p>
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
      <Handle type="target" position={Position.Top} />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 -ml-0.5 bg-gray-700 border-2 border-white rounded-full"
      />
      <Handle type="source" position={Position.Bottom} />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 -mr-0.5 bg-green-500 border-2 border-white rounded-full"
      />
    </div>
  );
};

export default AWSNode;