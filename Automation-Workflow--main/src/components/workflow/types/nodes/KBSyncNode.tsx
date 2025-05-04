import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Settings, Trash2, RefreshCw, Database, ChevronDown, AlertCircle } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';

interface KBSyncNodeProps {
  id: string;
  data: {
    params?: {
      knowledgeBase?: string;
      showSettings?: boolean;
      isSyncing?: boolean;
      lastSync?: string;
    };
  };
  selected?: boolean;
}

const KBSyncNode: React.FC<KBSyncNodeProps> = ({ id, data, selected }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate sync
    updateNodeData(id, { 
      params: { 
        ...data.params, 
        lastSync: new Date().toISOString(),
        isSyncing: false 
      } 
    });
    setIsSyncing(false);
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-200 w-[380px] ${
        selected ? 'ring-2 ring-blue-500 shadow-blue-100' : 'shadow-gray-200/50'
      }`}
    >
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
              <RefreshCw className={`w-5 h-5 text-white ${isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="font-medium text-white">Knowledge Base Sync</h3>
              <p className="text-xs text-blue-50/80">
                {data.params?.lastSync 
                  ? `Last synced: ${new Date(data.params.lastSync).toLocaleTimeString()}`
                  : 'Not synced yet'}
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
        {/* Knowledge Base Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Knowledge Base <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={data.params?.knowledgeBase || ''}
              onChange={(e) => updateNodeData(id, { params: { ...data.params, knowledgeBase: e.target.value } })}
              className="w-full pl-8 pr-10 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">Select Knowledge Base</option>
              <option value="kb1">General Knowledge</option>
              <option value="kb2">Technical Documentation</option>
              <option value="kb3">Customer Support</option>
            </select>
            <Database className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          {!data.params?.knowledgeBase && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-500" />
              Knowledge base is required
            </p>
          )}
        </div>

        {/* Sync Button */}
        <button
          onClick={handleSync}
          disabled={!data.params?.knowledgeBase || isSyncing}
          className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm rounded-lg transition-colors ${
            !data.params?.knowledgeBase || isSyncing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Knowledge Base'}
        </button>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed">
            Synchronize your knowledge base to ensure all nodes are working with the latest data. This process may take a few moments.
          </p>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${
            data.params?.knowledgeBase ? 'bg-green-500' : 'bg-gray-300'
          }`} />
          <span>
            {data.params?.knowledgeBase 
              ? 'Ready to sync' 
              : 'Select knowledge base'}
          </span>
        </div>
        {data.params?.lastSync && (
          <span className="text-purple-600 font-medium">
            Last sync: {new Date(data.params.lastSync).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Enhanced Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 -ml-0.5 bg-purple-500 border-2 border-white rounded-full shadow-md transition-transform hover:scale-110"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 -mr-0.5 bg-blue-500 border-2 border-white rounded-full shadow-md transition-transform hover:scale-110"
      />
    </div>
  );
};

export default KBSyncNode;