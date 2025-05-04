import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Trash2, Settings, Database, Play, Copy, Info, ChevronDown } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore'; // Add this import

interface TTSQLNodeProps {
  data: {
    params?: {
      nodeName?: string;
      query?: string;
      schema?: string;
      database?: string;
      showSettings?: boolean;
      showPreview?: boolean;
      generatedSQL?: string;
    };
  };
  id: string;
  selected?: boolean;
  updateNodeData: (id: string, params: any) => void;
}

const TTSQLNode: React.FC<TTSQLNodeProps> = ({ data, id, selected, updateNodeData }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const isQueryValid = !!data.params?.query;
  const isSchemaValid = !!data.params?.schema;
  
  // Get removeNode from useFlowStore
  const removeNode = useFlowStore((state) => state.removeNode);

  // Add handleDelete function
  const handleDelete = () => {
    removeNode(id);
  };

  const handleGenerateSQL = async () => {
    if (!isQueryValid || !isSchemaValid) return;
    
    setIsGenerating(true);
    try {
      // Simulated SQL generation - replace with actual implementation
      const sql = `SELECT * FROM users WHERE age > 25;`;
      updateNodeData(id, { generatedSQL: sql });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopySQL = () => {
    if (data.params?.generatedSQL) {
      navigator.clipboard.writeText(data.params.generatedSQL);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${
      selected ? 'ring-2 ring-blue-500' : 'border border-gray-200'
    }`}>
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">Text to SQL</h3>
              <p className="text-xs text-purple-50/80">Convert natural language to SQL</p>
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
              onClick={handleDelete}  // Use handleDelete instead of directly calling removeNode
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
                value={data.params?.nodeName || 'nl_to_sql_0'}
                onChange={(e) => updateNodeData(id, { nodeName: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Database Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500">SQL Database</label>
          <div className="relative">
            <select
              value={data.params?.database || 'MySQL'}
              onChange={(e) => updateNodeData(id, { database: e.target.value })}
              className="w-full appearance-none px-3 py-2 bg-white text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
            >
              <option value="MySQL">MySQL</option>
              <option value="PostgreSQL">PostgreSQL</option>
              <option value="SQLite">SQLite</option>
              <option value="SQLServer">SQL Server</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Schema Input */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500">Schema Definition *</label>
          <div className="relative">
            <textarea
              placeholder="Enter table schema details..."
              value={data.params?.schema || ''}
              onChange={(e) => updateNodeData(id, { schema: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[80px] ${
                isSchemaValid ? 'border-gray-200' : 'border-red-500'
              }`}
            />
            {!isSchemaValid && (
              <p className="text-xs text-red-500 mt-1">Schema definition is required</p>
            )}
          </div>
        </div>

        {/* Query Input */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500">Natural Language Query *</label>
          <div className="relative">
            <textarea
              placeholder="Describe your query in natural language..."
              value={data.params?.query || ''}
              onChange={(e) => updateNodeData(id, { query: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[80px] ${
                isQueryValid ? 'border-gray-200' : 'border-red-500'
              }`}
            />
            {!isQueryValid && (
              <p className="text-xs text-red-500 mt-1">Query is required</p>
            )}
          </div>
        </div>

        {/* Generate SQL Button */}
        <button
          onClick={handleGenerateSQL}
          disabled={!isQueryValid || !isSchemaValid || isGenerating}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            !isQueryValid || !isSchemaValid || isGenerating
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
          }`}
        >
          <Play className="w-4 h-4" />
          {isGenerating ? 'Generating...' : 'Generate SQL'}
        </button>

        {/* Generated SQL Preview */}
        {data.params?.generatedSQL && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-gray-500">Generated SQL</label>
              <button
                onClick={handleCopySQL}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Copy SQL"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-gray-50 rounded-md p-3">
              <code className="text-sm text-gray-700">{data.params.generatedSQL}</code>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${
            isQueryValid && isSchemaValid ? 'bg-green-500' : 'bg-gray-400'
          }`} />
          <span>{isQueryValid && isSchemaValid ? 'Ready' : 'Not configured'}</span>
        </span>
        <span>{data.params?.database || 'MySQL'}</span>
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

export default TTSQLNode;