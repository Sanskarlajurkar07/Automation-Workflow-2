import React from 'react';
import { Handle, Position } from 'reactflow';
import { Settings, Trash2, Search, Database, FileText, Variable } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';

interface KBSearchNodeProps {
  id: string;
  data: {
    params?: {
      embeddingModel?: string;
      searchQuery?: string;
      documents?: string;
      showSettings?: boolean;
    };
  };
  selected?: boolean;
}

const KBSearchNode: React.FC<KBSearchNodeProps> = ({ id, data, selected }) => {
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  return (
    <div
      className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-200 w-[380px] ${
        selected ? 'ring-2 ring-blue-500 shadow-blue-100' : 'shadow-gray-200/50'
      }`}
    >
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">Knowledge Base Search</h3>
              <p className="text-xs text-blue-50/80">
                {data.params?.documents ? 'Documents configured' : 'Configure search parameters'}
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
              onClick={() => removeNode(id)}
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
        {/* Embedding Model Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Embedding Model</label>
          <div className="relative">
            <select
              value={data.params?.embeddingModel || 'openai/text-embedding-3-small'}
              onChange={(e) => updateNodeData(id, { params: { ...data.params, embeddingModel: e.target.value } })}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="openai/text-embedding-3-small">openai/text-embedding-3-small</option>
              <option value="openai/text-embedding-3-large">openai/text-embedding-3-large</option>
            </select>
            <Database className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Search Query Input */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Search Query <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Type '{{variable}}' to utilize variables"
              value={data.params?.searchQuery || ''}
              onChange={(e) => updateNodeData(id, { params: { ...data.params, searchQuery: e.target.value } })}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
          {!data.params?.searchQuery && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-500" />
              Search query is required
            </p>
          )}
        </div>

        {/* Documents Input */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Documents for Search <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Type '{{variable}}' to utilize variables"
              value={data.params?.documents || ''}
              onChange={(e) => updateNodeData(id, { params: { ...data.params, documents: e.target.value } })}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <FileText className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
          {!data.params?.documents && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-500" />
              Documents field is required
            </p>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            Use this node to perform semantic search across your documents using state-of-the-art embedding models.
          </p>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${
            data.params?.searchQuery && data.params?.documents ? 'bg-green-500' : 'bg-gray-300'
          }`} />
          <span>
            {data.params?.searchQuery && data.params?.documents 
              ? 'Ready to search'
              : 'Configure required fields'}
          </span>
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 -ml-0.5 bg-indigo-500 border-2 border-white rounded-full shadow-md transition-transform hover:scale-110"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 -mr-0.5 bg-blue-500 border-2 border-white rounded-full shadow-md transition-transform hover:scale-110"
      />
    </div>
  );
};

export default KBSearchNode;