import React from 'react';
import { Handle, Position } from 'reactflow';
import { Trash2, Settings, GitMerge, Plus, ChevronDown } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';

interface MergeNodeProps {
  data: {
    params?: {
      nodeName?: string;
      showSettings?: boolean;
      type?: string;
      function?: string;
      paths?: string[];
    };
  };
  id: string;
  selected?: boolean;
}

const MergeNode: React.FC<MergeNodeProps> = ({ data, id, selected }) => {
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeParams);

  const handleDelete = () => {
    removeNode(id);
  };

  const toggleSettings = () => {
    updateNodeData(id, { showSettings: !data.params?.showSettings });
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
              <GitMerge className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">Merge Node</h3>
              <p className="text-xs text-purple-50/80">Path Combiner</p>
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
                value={data.params?.nodeName || 'merge_0'}
                onChange={(e) => updateNodeData(id, { nodeName: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Description */}
        <p className="text-xs text-gray-500 bg-purple-50 p-2 rounded-md">
          Recombine paths created by a condition node. Note: if you are not using a condition node, you shouldn't use a merge node.
        </p>

        {/* Type Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500">Data Type</label>
          <div className="relative">
            <select
              value={data.params?.type || 'Text'}
              onChange={(e) => updateNodeData(id, { type: e.target.value })}
              className="w-full appearance-none px-3 py-2 bg-white text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
            >
              <option value="Text">Text</option>
              <option value="Integer">Integer</option>
              <option value="Any">Any</option>
              <option value="Float">Float</option>
              <option value="Boolean">Boolean</option>
              <option value="File">File</option>
              <option value="Audio">Audio</option>
              <option value="Image">Image</option>
              <option value="JSON">JSON</option>
              <option value="Knowledge Base">Knowledge Base</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Merge Function */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500">Merge Function</label>
          <div className="flex gap-2">
            {['Pick First', 'Join All'].map((func) => (
              <button
                key={func}
                onClick={() => updateNodeData(id, { function: func })}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  data.params?.function === func
                    ? 'bg-purple-100 text-purple-700 font-medium'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {func}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Paths */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-gray-500">Input Paths</label>
            <span className="text-xs text-gray-400">{data.params?.paths?.length || 0} paths</span>
          </div>
          
          <div className="space-y-2">
            {data.params?.paths?.map((path, index) => (
              <div key={index} className="flex items-center gap-2 group">
                <span className="text-xs font-medium text-gray-400 w-12">Path {index + 1}</span>
                <input
                  type="text"
                  value={path}
                  onChange={(e) => {
                    const updatedPaths = [...(data.params?.paths || [])];
                    updatedPaths[index] = e.target.value;
                    updateNodeData(id, { paths: updatedPaths });
                  }}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={`Enter path ${index + 1}`}
                />
                <button
                  onClick={() => {
                    const updatedPaths = (data.params?.paths || []).filter((_, i) => i !== index);
                    updateNodeData(id, { paths: updatedPaths });
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {!data.params?.paths?.length && (
              <p className="text-xs text-red-500">At least one path is required</p>
            )}
          </div>

          <button
            onClick={() => {
              const updatedPaths = [...(data.params?.paths || []), ''];
              updateNodeData(id, { paths: updatedPaths });
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-purple-600 hover:text-purple-700 border border-purple-200 hover:border-purple-300 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Path
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${
            data.params?.paths?.length ? 'bg-green-500' : 'bg-gray-400'
          }`} />
          <span>{data.params?.paths?.length ? 'Configured' : 'Not configured'}</span>
        </span>
        <span>{data.params?.type || 'Text'}</span>
      </div>

      {/* Handles with Dot Nodes */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center">
        <div className="w-2 h-2 rounded-full bg-blue-500 absolute -left-1" />
        <div className="h-[2px] w-4 bg-blue-200" />
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 -ml-0.5 bg-blue-500 border-2 border-white rounded-full"
        />
      </div>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
        <div className="h-[2px] w-4 bg-green-200" />
        <div className="w-2 h-2 rounded-full bg-green-500 absolute -right-1" />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 -mr-0.5 bg-green-500 border-2 border-white rounded-full"
        />
      </div>
    </div>
  );
};

export default MergeNode;