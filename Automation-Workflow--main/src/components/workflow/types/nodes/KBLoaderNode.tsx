import React from 'react';
import { Handle, Position } from 'reactflow';
import { Settings, Trash2, Upload, Database, FileUp, Plus, File, ChevronDown } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';

interface KBLoaderNodeProps {
  id: string;
  data: {
    params?: {
      knowledgeBase?: string;
      dataType?: string;
      documents?: string[];
      showSettings?: boolean;
    };
  };
  selected?: boolean;
}

const KBLoaderNode: React.FC<KBLoaderNodeProps> = ({ id, data, selected }) => {
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  return (
    <div
      className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-200 w-[380px] ${
        selected ? 'ring-2 ring-blue-500 shadow-blue-100' : 'shadow-gray-200/50'
      }`}
    >
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-3 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
              <FileUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">Knowledge Base Loader</h3>
              <p className="text-xs text-emerald-50/80">
                {data.params?.documents?.length 
                  ? `${data.params.documents.length} document(s) configured` 
                  : 'Configure documents'}
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
              className="w-full pl-8 pr-10 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none"
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

        {/* Data Type Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Data Type</label>
          <div className="relative">
            <select
              value={data.params?.dataType || 'File'}
              onChange={(e) => updateNodeData(id, { params: { ...data.params, dataType: e.target.value } })}
              className="w-full pl-8 pr-10 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none"
            >
              <option value="File">File</option>
              <option value="Text">Text</option>
              <option value="JSON">JSON</option>
            </select>
            <File className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Documents Section */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500">
            Documents to Load <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {(data.params?.documents || ['']).map((doc, index) => (
              <div key={index} className="flex items-center space-x-2 group">
                <input
                  type="text"
                  placeholder={`Document ${index + 1}`}
                  value={doc}
                  onChange={(e) => {
                    const newDocs = [...(data.params?.documents || [''])];
                    newDocs[index] = e.target.value;
                    updateNodeData(id, { params: { ...data.params, documents: newDocs } });
                  }}
                  className="flex-1 pl-8 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-all"
                  title="Upload File"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              const newDocs = [...(data.params?.documents || []), ''];
              updateNodeData(id, { params: { ...data.params, documents: newDocs } });
            }}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Document
          </button>
          
          <button
            onClick={() => console.log('Create New Knowledge Base')}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Database className="w-4 h-4" />
            Create New Knowledge Base
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3">
          <p className="text-xs text-emerald-700 leading-relaxed">
            Load documents into your knowledge base. Supported formats include PDF, DOCX, TXT, and more.
          </p>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${
            data.params?.knowledgeBase && data.params?.documents?.length ? 'bg-emerald-500' : 'bg-gray-300'
          }`} />
          <span>
            {data.params?.documents?.length 
              ? `${data.params.documents.length} document(s) ready` 
              : 'No documents configured'}
          </span>
        </div>
      </div>

      {/* Enhanced Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 -ml-0.5 bg-emerald-500 border-2 border-white rounded-full shadow-md transition-transform hover:scale-110"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 -mr-0.5 bg-blue-500 border-2 border-white rounded-full shadow-md transition-transform hover:scale-110"
      />
    </div>
  );
};

export default KBLoaderNode;