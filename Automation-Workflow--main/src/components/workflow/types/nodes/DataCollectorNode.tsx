import React from 'react';
import { Handle, Position } from 'reactflow';
import { Trash2, Settings, Database, Plus } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';

interface DataCollectorNodeProps {
  data: {
    params?: {
      nodeName?: string;
      showSettings?: boolean;
      query?: string;
      prompt?: string;
      fields?: { name: string; description: string; example: string }[];
    };
  };
  id: string;
  selected?: boolean;
}

const DataCollectorNode: React.FC<DataCollectorNodeProps> = ({ 
  data, 
  id, 
  selected 
}) => {
  // Get both removeNode and updateNodeData from store
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // Handle functions
  const handleDelete = () => {
    removeNode(id);
  };

  const toggleSettings = () => {
    updateNodeData(id, { showSettings: !data.params?.showSettings });
  };

  const addField = () => {
    const updatedFields = [...(data.params?.fields || []), { name: '', description: '', example: '' }];
    updateNodeData(id, { fields: updatedFields });
  };

  const removeField = (index: number) => {
    const updatedFields = (data.params?.fields || []).filter((_, i) => i !== index);
    updateNodeData(id, { fields: updatedFields });
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${
      selected ? 'ring-2 ring-blue-500' : 'border border-gray-200'
    }`}>
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">Data Collector</h3>
              <p className="text-xs text-purple-50/80">Collecting {data.params?.fields?.length || 0} fields</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleSettings}
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

      {/* Settings Panel */}
      {data.params?.showSettings && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Node Name</label>
              <input
                type="text"
                value={data.params?.nodeName || 'data_collector_0'}
                onChange={(e) => updateNodeData(id, { nodeName: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Query Input */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500">Query *</label>
          <input
            type="text"
            placeholder="Enter your query"
            value={data.params?.query || ''}
            onChange={(e) => updateNodeData(id, { query: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          {!data.params?.query && (
            <p className="text-xs text-red-500">Query field is required</p>
          )}
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500">Prompt</label>
          <textarea
            placeholder="Enter prompt text"
            value={data.params?.prompt || ''}
            onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[80px]"
          />
        </div>

        {/* Dynamic Fields Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-gray-500">Fields</label>
            <button
              onClick={addField}  // Use the addField function here
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Field
            </button>
          </div>

          <div className="space-y-2">
            {data.params?.fields?.map((field, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center bg-gray-50 p-2 rounded-md">
                <input
                  type="text"
                  placeholder="Field name"
                  value={field.name || ''}
                  onChange={(e) => {
                    const updatedFields = [...(data.params?.fields || [])];
                    updatedFields[index] = { ...field, name: e.target.value };
                    updateNodeData(id, { fields: updatedFields });
                  }}
                  className="text-sm border border-gray-200 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={field.description || ''}
                  onChange={(e) => {
                    const updatedFields = [...(data.params?.fields || [])];
                    updatedFields[index] = { ...field, description: e.target.value };
                    updateNodeData(id, { fields: updatedFields });
                  }}
                  className="text-sm border border-gray-200 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Example"
                  value={field.example || ''}
                  onChange={(e) => {
                    const updatedFields = [...(data.params?.fields || [])];
                    updatedFields[index] = { ...field, example: e.target.value };
                    updateNodeData(id, { fields: updatedFields });
                  }}
                  className="text-sm border border-gray-200 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={() => {
                    const updatedFields = (data.params?.fields || []).filter((_, i) => i !== index);
                    updateNodeData(id, { fields: updatedFields });
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  title="Remove field"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-xs text-gray-500">
            <span className="font-medium">Recommended Connections:</span>
            <br />
            Connect to one or more Output nodes.
          </p>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${data.params?.query ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span>{data.params?.query ? 'Configured' : 'Not configured'}</span>
        </span>
        <span>{data.params?.fields?.length || 0} fields</span>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 -ml-0.5 bg-purple-500 border-2 border-white rounded-full"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 -mr-0.5 bg-green-500 border-2 border-white rounded-full"
      />
    </div>
  );
};

export default DataCollectorNode;