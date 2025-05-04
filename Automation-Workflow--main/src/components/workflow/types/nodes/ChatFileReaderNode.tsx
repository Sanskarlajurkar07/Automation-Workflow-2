import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Trash2, Settings, FileText, Upload, ChevronDown } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';

interface ChatFileReaderNodeProps {
  data: {
    params?: {
      nodeName?: string;
      showSettings?: boolean;
      fileType?: string;
      maxFileSize?: number;
      selectedFile?: string;
    };
  };
  id: string;
  selected?: boolean;
}

const ChatFileReaderNode: React.FC<ChatFileReaderNodeProps> = ({ 
  data, 
  id, 
  selected 
}) => {
  // Get store functions
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // Handle functions
  const handleDelete = () => {
    removeNode(id);
  };

  const toggleSettings = () => {
    updateNodeData(id, { showSettings: !data.params?.showSettings });
  };

  const handleFileUpload = () => {
    console.log('File upload clicked');
    // Implement file upload logic here
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${
      selected ? 'ring-2 ring-blue-500' : 'border border-gray-200'
    }`}>
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">Chat File Reader</h3>
              <p className="text-xs text-blue-50/80">
                {data.params?.selectedFile || 'No file selected'}
              </p>
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
                value={data.params?.nodeName || 'chat_file_reader_0'}
                onChange={(e) => updateNodeData(id, { nodeName: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">File Type</label>
              <select
                value={data.params?.fileType || 'all'}
                onChange={(e) => updateNodeData(id, { fileType: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Files</option>
                <option value="pdf">PDF Only</option>
                <option value="text">Text Only</option>
                <option value="doc">Word Documents</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Info Box */}
        <div className="bg-blue-50 rounded-md p-3">
          <p className="text-xs text-blue-600">
            Upload and process documents for chat interactions. Supports PDF, TXT, and DOC formats.
          </p>
        </div>

        {/* Upload Button */}
        <button
          onClick={handleFileUpload}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span className="text-sm font-medium">Upload File</span>
        </button>

        {/* File Info */}
        {data.params?.selectedFile && (
          <div className="text-xs text-gray-500">
            Selected file: {data.params.selectedFile}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${data.params?.selectedFile ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span>{data.params?.selectedFile ? 'File loaded' : 'No file'}</span>
        </span>
        <span>{data.params?.fileType || 'All Files'}</span>
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
        className="w-3 h-3 -mr-0.5 bg-green-500 border-2 border-white rounded-full"
      />
    </div>
  );
};

export default ChatFileReaderNode;