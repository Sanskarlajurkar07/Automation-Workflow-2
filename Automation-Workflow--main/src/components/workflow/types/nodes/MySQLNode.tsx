import React from 'react';
import { Handle, Position } from 'reactflow';
import { Settings, Trash2, Database } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';

interface MySQLNodeProps {
  id: string;
  data: {
    params?: {
      nodeName?: string;
      account?: boolean;
      showSettings?: boolean;
      showConfig?: boolean;
      action?: string;
      table?: string;
      query?: string;
      connectionString?: string;
    };
  };
  selected?: boolean;
}

const MySQLNode: React.FC<MySQLNodeProps> = ({ id, data, selected }) => {
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleDelete = () => {
    removeNode(id);
  };

  return (
    <div className={`p-3 border rounded-md shadow-sm text-sm space-y-3 bg-white ${
      selected ? 'border-yellow-500' : 'border-gray-200'
    }`}>
      {/* Header with Title and Settings */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-white">
            <Database className="w-4 h-4" />
          </span>
          <div className="font-semibold text-white">MySQL Database</div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => updateNodeData(id, { showSettings: !data.params?.showSettings })}
            className="text-white hover:text-gray-300"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="text-gray-300 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Node Name */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Node Name</label>
        <input
          type="text"
          value={data.params?.nodeName || 'mysql_0'}
          onChange={(e) => updateNodeData(id, { nodeName: e.target.value })}
          className="w-full text-sm border border-gray-200 rounded px-2 py-1"
        />
      </div>

      {/* Connection Config */}
      {!data.params?.account && (
        <div className="space-y-2">
          <button
            onClick={() => updateNodeData(id, { showConfig: true })}
            className="w-full px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
          >
            + Connect Account
          </button>
        </div>
      )}

      {(data.params?.account || data.params?.showConfig) && (
        <div className="space-y-3">
          {/* Connection String */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Connection String *</label>
            <input
              type="password"
              placeholder="mysql://user:password@localhost:3306/database"
              value={data.params?.connectionString || ''}
              onChange={(e) => updateNodeData(id, { connectionString: e.target.value })}
              className="w-full text-sm border border-gray-200 rounded px-2 py-1"
            />
            {!data.params?.connectionString && (
              <p className="text-xs text-red-500 mt-1">Connection string is required</p>
            )}
          </div>

          {/* Action Selection */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Action</label>
            <select
              value={data.params?.action || 'nl-query'}
              onChange={(e) => updateNodeData(id, { action: e.target.value })}
              className="w-full text-sm border border-gray-200 rounded px-2 py-1"
            >
              <option value="nl-query">Natural Language Query</option>
              <option value="raw-sql">Raw SQL Query</option>
              <option value="nl-agent">Natural Language Agent</option>
            </select>
          </div>

          {/* Table Selection */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Table</label>
            <select
              value={data.params?.table || ''}
              onChange={(e) => updateNodeData(id, { table: e.target.value })}
              className="w-full text-sm border border-gray-200 rounded px-2 py-1"
            >
              <option value="">Select Table</option>
              <option value="users">Users</option>
              <option value="products">Products</option>
              <option value="orders">Orders</option>
            </select>
          </div>

          {/* Query Input */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Query *</label>
            <textarea
              placeholder={data.params?.action === 'raw-sql' 
                ? "SELECT * FROM users WHERE age > 30"
                : "Show me all users older than 30"}
              value={data.params?.query || ''}
              onChange={(e) => updateNodeData(id, { query: e.target.value })}
              className="w-full text-sm border border-gray-200 rounded px-2 py-1 min-h-[60px]"
            />
            {!data.params?.query && (
              <p className="text-xs text-red-500 mt-1">Query is required</p>
            )}
          </div>

          {/* Test Connection Button */}
          <button
            onClick={() => console.log('Testing connection...')}
            className="w-full px-3 py-1.5 text-sm text-green-600 border border-green-200 rounded hover:bg-green-50"
          >
            Test Connection
          </button>
        </div>
      )}

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white rounded-full"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-white rounded-full"
      />
    </div>
  );
};

export default MySQLNode;