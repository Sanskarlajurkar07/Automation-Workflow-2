import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Settings, Trash2, Globe, Plus } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';

interface ApiLoaderNodeProps {
  id: string;
  data: {
    params?: {
      method?: string;
      url?: string;
      headers?: Array<{ key: string; value: string }>;
      queryParams?: Array<{ key: string; value: string }>;
      files?: Array<{ name: string; file?: File }>;
      body?: string;
      bodyType?: 'raw' | 'json';
      showSettings?: boolean;
    };
  };
  selected?: boolean;
}

const ApiLoaderNode: React.FC<ApiLoaderNodeProps> = ({ id, data, selected }) => {
  const [activeTab, setActiveTab] = useState<'headers' | 'query' | 'body' | 'files'>('headers');
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  return (
    <div
      className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-200 w-[420px] ${
        selected ? 'ring-2 ring-blue-500 shadow-blue-100' : 'shadow-gray-200/50'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">API Request</h3>
              <p className="text-xs text-blue-50/80">
                {data.params?.method || 'GET'} {data.params?.url ? '• Configured' : '• No URL'}
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
        {/* Method Selection */}
        <div className="flex gap-4">
          <div className="w-1/3">
            <label className="block text-xs font-medium text-gray-500 mb-1">Method</label>
            <select
              value={data.params?.method || 'GET'}
              onChange={(e) => updateNodeData(id, { params: { ...data.params, method: e.target.value } })}
              className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>PATCH</option>
              <option>DELETE</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">URL</label>
            <input
              type="text"
              placeholder="https://api.example.com"
              value={data.params?.url || ''}
              onChange={(e) => updateNodeData(id, { params: { ...data.params, url: e.target.value } })}
              className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4">
            {(['headers', 'query', 'body', 'files'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-sm font-medium rounded-t-lg -mb-px ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[200px]">
          {activeTab === 'headers' && (
            <div className="space-y-2">
              {(data.params?.headers || [{ key: '', value: '' }]).map((header, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    placeholder="Key"
                    value={header.key || ''}
                    onChange={(e) => {
                      const newHeaders = [...(data.params?.headers || [])];
                      newHeaders[index] = { ...header, key: e.target.value, value: header.value || '' };
                      updateNodeData(id, { params: { ...data.params, headers: newHeaders } });
                    }}
                    className="w-1/2 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    placeholder="Value"
                    value={header.value || ''}
                    onChange={(e) => {
                      const newHeaders = [...(data.params?.headers || [])];
                      newHeaders[index] = { ...header, value: e.target.value };
                      updateNodeData(id, { params: { ...data.params, headers: newHeaders } });
                    }}
                    className="w-1/2 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  const newHeaders = [...(data.params?.headers || []), { key: '', value: '' }];
                  updateNodeData(id, { params: { ...data.params, headers: newHeaders } });
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Header
              </button>
            </div>
          )}

          {activeTab === 'query' && (
            <div className="space-y-2">
              {(data.params?.queryParams || [{ key: '', value: '' }]).map((param, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    placeholder="Key"
                    value={param.key || ''}
                    onChange={(e) => {
                      const newParams = [...(data.params?.queryParams || [])];
                      newParams[index] = { ...param, key: e.target.value };
                      updateNodeData(id, { params: { ...data.params, queryParams: newParams } });
                    }}
                    className="w-1/2 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    placeholder="Value"
                    value={param.value || ''}
                    onChange={(e) => {
                      const newParams = [...(data.params?.queryParams || [])];
                      newParams[index] = { ...param, value: e.target.value };
                      updateNodeData(id, { params: { ...data.params, queryParams: newParams } });
                    }}
                    className="w-1/2 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  const newParams = [...(data.params?.queryParams || []), { key: '', value: '' }];
                  updateNodeData(id, { params: { ...data.params, queryParams: newParams } });
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Query Parameter
              </button>
            </div>
          )}

          {activeTab === 'body' && (
            <div className="space-y-2">
              <div className="flex items-center space-x-4 mb-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={data.params?.bodyType === 'raw'}
                    onChange={() => updateNodeData(id, { params: { ...data.params, bodyType: 'raw' } })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-600">Raw</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={data.params?.bodyType === 'json'}
                    onChange={() => updateNodeData(id, { params: { ...data.params, bodyType: 'json' } })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-600">JSON</span>
                </label>
              </div>
              <textarea
                value={data.params?.body || ''}
                onChange={(e) => updateNodeData(id, { params: { ...data.params, body: e.target.value } })}
                placeholder={data.params?.bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Request body...'}
                className="w-full h-[150px] px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              />
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-2">
              {(data.params?.files || []).map((file, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="file"
                    defaultValue={file.name}
                    onChange={(e) => {
                      const newFiles = [...(data.params?.files || [])];
                      newFiles[index] = { 
                        name: e.target.files?.[0]?.name || '',
                        file: e.target.files?.[0]
                      };
                      updateNodeData(id, { params: { ...data.params, files: newFiles } });
                    }}
                    className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => {
                      const newFiles = data.params?.files?.filter((_, i) => i !== index) || [];
                      updateNodeData(id, { params: { ...data.params, files: newFiles } });
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newFiles = [...(data.params?.files || []), { name: '' }];
                  updateNodeData(id, { params: { ...data.params, files: newFiles } });
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add File
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${data.params?.url ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span>{data.params?.url ? 'Ready to send' : 'Configure URL'}</span>
        </div>
        <div className="flex items-center gap-2">
          {data.params?.queryParams?.length ? (
            <span>{data.params.queryParams.length} query params</span>
          ) : null}
          {data.params?.files?.length ? (
            <span>{data.params.files.length} files</span>
          ) : null}
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 -ml-0.5 bg-blue-500 border-2 border-white rounded-full shadow-md transition-transform hover:scale-110"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 -mr-0.5 bg-indigo-500 border-2 border-white rounded-full shadow-md transition-transform hover:scale-110"
      />
    </div>
  );
};

export default ApiLoaderNode;