import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Settings, Trash2, Copy, Database, ChevronRight } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';

interface AirTableNodeData {
  params?: {
    nodeName?: string;
    action?: 'read-table' | 'add-record' | 'update-records' | 'column-list-writer';
    baseId?: string;
    tableId?: string;
    inputFields?: string;
    oauthToken?: string;
    showSettings?: boolean;
  };
}

const AirTableNode: React.FC<NodeProps<AirTableNodeData>> = ({ id, data, selected }) => {
  const [currentStep, setCurrentStep] = useState(1); // Step tracker for configuration
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleActionChange = (action: 'read-table' | 'add-record' | 'update-records' | 'column-list-writer') => {
    updateNodeData(id, { action });
    setCurrentStep(2); // Move to the next step
  };

  const handleOAuthConnect = () => {
    // Simulate OAuth 2.0 connection
    updateNodeData(id, { oauthToken: 'mock-oauth-token' });
    setCurrentStep(3); // Move to the final step
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${
      selected ? 'ring-2 ring-blue-500' : 'border border-gray-200'
    }`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-teal-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">Airtable</h3>
              <p className="text-xs text-blue-50/80">{data.params?.nodeName || 'airtable_1'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigator.clipboard.writeText(id)}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              title="Copy Node ID"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateNodeData(id, { showSettings: !data.params?.showSettings })}
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
        {currentStep === 1 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Select an action</h4>
            <div className="space-y-2">
              <button
                onClick={() => handleActionChange('read-table')}
                className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">Read Table</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={() => handleActionChange('add-record')}
                className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">Add New Record</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={() => handleActionChange('update-records')}
                className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">Update Records</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={() => handleActionChange('column-list-writer')}
                className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">Column List Writer</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Connect your Airtable account</h4>
            <button
              onClick={handleOAuthConnect}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Connect with Airtable
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Base</label>
              <input
                type="text"
                value={data.params?.baseId || ''}
                onChange={(e) => updateNodeData(id, { baseId: e.target.value })}
                placeholder="Enter Base ID"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Table</label>
              <input
                type="text"
                value={data.params?.tableId || ''}
                onChange={(e) => updateNodeData(id, { tableId: e.target.value })}
                placeholder="Enter Table ID"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Input Fields</label>
              <textarea
                value={data.params?.inputFields || ''}
                onChange={(e) => updateNodeData(id, { inputFields: e.target.value })}
                placeholder="Type JSON or comma-separated values"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                rows={4}
              />
            </div>
          </div>
        )}
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 -ml-0.5 bg-blue-500 border-2 border-white rounded-full"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 -mr-0.5 bg-blue-500 border-2 border-white rounded-full"
      />
    </div>
  );
};

export default AirTableNode;