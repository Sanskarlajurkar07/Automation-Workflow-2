import React from 'react';
import { Handle, Position } from 'reactflow';
import { Settings, Trash2, Save, FileDown, Plus, FileText } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';

interface FileSaveNodeProps {
  id: string;
  data: {
    params?: {
      nodeName?: string;
      fileName?: string;
      files?: Array<{
        name: string;
        type: string;
      }>;
      showSettings?: boolean;
    };
  };
  selected?: boolean;
}

const FileSaveNode: React.FC<FileSaveNodeProps> = ({ id, data, selected }) => {
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const addFileItem = () => {
    const updatedFiles = [...(data.params?.files || []), { name: '', type: 'File' }];
    updateNodeData(id, { params: { ...data.params, files: updatedFiles } });
  };

  const updateFileItem = (index: number, key: string, value: string) => {
    const updatedFiles = [...(data.params?.files || [])];
    updatedFiles[index][key] = value;
    updateNodeData(id, { params: { ...data.params, files: updatedFiles } });
  };

  const removeFileItem = (index: number) => {
    const updatedFiles = data.params?.files.filter((_: any, i: number) => i !== index);
    updateNodeData(id, { params: { ...data.params, files: updatedFiles } });
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-200 w-[380px] ${
        selected ? 'ring-2 ring-blue-500 shadow-blue-100' : 'shadow-gray-200/50'
      }`}
    >
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
              <Save className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">File Save</h3>
              <p className="text-xs text-blue-50/80">{data.params?.files?.length || 0} files configured</p>
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
        {/* Node Name Field */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Node Name</label>
          <div className="relative">
            <input
              type="text"
              value={data.params?.nodeName || 'file_save_0'}
              onChange={(e) => updateNodeData(id, { params: { ...data.params, nodeName: e.target.value } })}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <FileText className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* File Name Field */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">File Name *</label>
          <div className="relative">
            <input
              type="text"
              placeholder='Type "{{variable}}" to utilize variables'
              value={data.params?.fileName || ''}
              onChange={(e) => updateNodeData(id, { params: { ...data.params, fileName: e.target.value } })}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <FileDown className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
          {!data.params?.fileName && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-500" />
              File Name is required
            </p>
          )}
        </div>

        {/* Files Section */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500 mb-2">Files *</label>
          <div className="space-y-2">
            {data.params?.files?.map((file: any, index: number) => (
              <div key={index} className="flex items-center space-x-2 group bg-gray-50 p-2 rounded-lg">
                <input
                  type="text"
                  placeholder={`Item ${index + 1}`}
                  value={file.name}
                  onChange={(e) => updateFileItem(index, 'name', e.target.value)}
                  className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={file.type}
                  onChange={(e) => updateFileItem(index, 'type', e.target.value)}
                  className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="File">File</option>
                  <option value="Variable">Variable</option>
                </select>
                <button
                  onClick={() => removeFileItem(index)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={addFileItem}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add File
            </button>
          </div>
          {!data.params?.files?.length && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-500" />
              At least one file is required
            </p>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${data.params?.files?.length ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span>{data.params?.files?.length ? `${data.params.files.length} files configured` : 'No files configured'}</span>
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
        className="w-3 h-3 -mr-0.5 bg-green-500 border-2 border-white rounded-full shadow-md transition-transform hover:scale-110"
      />
    </div>
  );
};

export default FileSaveNode;