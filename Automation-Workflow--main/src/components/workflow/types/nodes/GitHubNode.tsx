import React from 'react';
import { Handle, Position } from 'reactflow';
import { Settings, Trash2, Github } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';

interface GitHubNodeProps {
  id: string;
  data: {
    params?: {
      nodeName?: string;
      account?: boolean;
      showSettings?: boolean;
      showConfig?: boolean;
      action?: string;
      ownerName?: string;
      repoName?: string;
      branchName?: string;
      fileName?: string;
      base?: string;
      head?: string;
      title?: string;
      body?: string;
      pullNumber?: string;
    };
  };
  selected?: boolean;
}

const GitHubNode: React.FC<GitHubNodeProps> = ({ id, data, selected }) => {
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleDelete = () => {
    removeNode(id);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${
      selected ? 'ring-2 ring-gray-800' : 'border border-gray-200'
    }`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Github className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">GitHub</h3>
              <p className="text-xs text-gray-300">{data.params?.nodeName || 'github_0'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => updateNodeData(id, { showSettings: !data.params?.showSettings })}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
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

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Node Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Node Name</label>
          <input
            type="text"
            value={data.params?.nodeName || 'github_0'}
            onChange={(e) => updateNodeData(id, { nodeName: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-gray-800 focus:border-transparent"
          />
        </div>

        {/* Connection Config */}
        {!data.params?.account && (
          <div className="space-y-2">
            <button
              onClick={() => updateNodeData(id, { showConfig: true })}
              className="w-full px-3 py-1.5 text-sm text-gray-800 border border-gray-300 rounded hover:bg-gray-100"
            >
              + Connect Account
            </button>
          </div>
        )}

        {(data.params?.account || data.params?.showConfig) && (
          <div className="space-y-3">
            {/* Action Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Action *</label>
              <select
                value={data.params?.action || 'read-file'}
                onChange={(e) => updateNodeData(id, { action: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-gray-800 focus:border-transparent"
              >
                <option value="read-file">Read a file</option>
                <option value="create-pull-request">Create a pull request</option>
                <option value="update-pull-request">Update a Pull Request</option>
              </select>
            </div>

            {/* Repository Details */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Owner Name *</label>
              <input
                type="text"
                placeholder="Enter repository owner name..."
                value={data.params?.ownerName || ''}
                onChange={(e) => updateNodeData(id, { ownerName: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-gray-800 focus:border-transparent"
              />
              {!data.params?.ownerName && (
                <p className="text-xs text-red-500 mt-1">Owner name is required</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Repository Name *</label>
              <input
                type="text"
                placeholder="Enter repository name..."
                value={data.params?.repoName || ''}
                onChange={(e) => updateNodeData(id, { repoName: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-gray-800 focus:border-transparent"
              />
              {!data.params?.repoName && (
                <p className="text-xs text-red-500 mt-1">Repository name is required</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Branch Name *</label>
              <input
                type="text"
                placeholder="Enter branch name..."
                value={data.params?.branchName || ''}
                onChange={(e) => updateNodeData(id, { branchName: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-gray-800 focus:border-transparent"
              />
              {!data.params?.branchName && (
                <p className="text-xs text-red-500 mt-1">Branch name is required</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 -ml-0.5 bg-gray-800 border-2 border-white rounded-full"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 -mr-0.5 bg-gray-800 border-2 border-white rounded-full"
      />
    </div>
  );
};

export default GitHubNode;