import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Settings, Trash2, FileCode, Code2, Play, Plus } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';

interface ScriptsNodeProps {
  id: string;
  data: {
    params?: {
      nodeName?: string;
      script?: string;
      language?: 'javascript' | 'python' | 'shell';
      showSettings?: boolean;
      isRunning?: boolean;
    };
  };
  selected?: boolean;
}

const ScriptsNode: React.FC<ScriptsNodeProps> = ({ id, data, selected }) => {
  const [showEditor, setShowEditor] = useState(false);
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleDelete = () => {
    removeNode(id);
  };

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
              <FileCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">Scripts</h3>
              <p className="text-xs text-blue-50/80">
                {data.params?.language || 'Select language'}
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
              onClick={handleDelete}
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
        {/* Node Name */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Node Name</label>
          <div className="relative">
            <input
              type="text"
              value={data.params?.nodeName || 'scripts_0'}
              onChange={(e) => updateNodeData(id, { params: { ...data.params, nodeName: e.target.value } })}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Code2 className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Language Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Language</label>
          <select
            value={data.params?.language || ''}
            onChange={(e) => updateNodeData(id, { params: { ...data.params, language: e.target.value } })}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select language</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="shell">Shell Script</option>
          </select>
        </div>

        {/* Script Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-gray-500">Script</label>
            <button
              onClick={() => setShowEditor(!showEditor)}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              {showEditor ? 'Hide Editor' : 'Show Editor'}
            </button>
          </div>
          {showEditor && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-500">Editor</span>
                <button
                  onClick={() => updateNodeData(id, { params: { ...data.params, isRunning: true } })}
                  className="p-1 rounded hover:bg-gray-200 transition-colors"
                  title="Run Script"
                >
                  <Play className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <textarea
                value={data.params?.script || ''}
                onChange={(e) => updateNodeData(id, { params: { ...data.params, script: e.target.value } })}
                placeholder={`Enter your ${data.params?.language || 'script'} code here...`}
                className="w-full h-32 p-3 text-sm font-mono bg-gray-900 text-gray-100 focus:outline-none resize-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${data.params?.script ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span>{data.params?.script ? 'Script ready' : 'No script'}</span>
        </div>
        {data.params?.isRunning && (
          <span className="text-blue-600 font-medium animate-pulse">Running...</span>
        )}
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

export default ScriptsNode;