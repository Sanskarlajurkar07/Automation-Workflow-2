import React from 'react';
import { Handle, Position } from 'reactflow';
import { Trash2, Settings, Volume2, Mic, ChevronDown, Key, Play, Music } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';

interface AudioProcessorNodeProps {
  data: {
    params?: {
      nodeName?: string;
      showSettings?: boolean;
      provider?: string;
      model?: string;
      voice?: string;
      text?: string;
      textMode?: string;
      apiKey?: string;
      usePersonalKey?: boolean;
    };
  };
  id: string;
  selected?: boolean;
}

const AudioProcessorNode: React.FC<AudioProcessorNodeProps> = ({ data, id, selected }) => {
  // Use flowStore for state management
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleDelete = () => {
    removeNode(id);
  };

  const handleToggleSettings = () => {
    updateNodeData(id, { showSettings: !data.params?.showSettings });
  };

  const handlePreview = () => {
    if (!data.params?.text || !data.params?.voice) {
      console.error('Text and Voice are required for preview');
      return;
    }
    console.log('Previewing audio with settings:', data.params);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${
      selected ? 'ring-2 ring-teal-500' : 'ring-1 ring-gray-200'
    }`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium">Audio Processor</h3>
              <p className="text-xs text-teal-50/80">{data.params?.nodeName || 'audio_processor_0'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleSettings}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Provider Selection */}
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-medium text-slate-700">Provider</span>
            </div>
            <select
              value={data.params?.provider || 'OpenAI'}
              onChange={(e) => updateNodeData(id, { provider: e.target.value })}
              className="text-sm bg-white border border-slate-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="OpenAI">OpenAI TTS</option>
              <option value="Eleven Labs">Eleven Labs</option>
              <option value="Azure">Azure Speech</option>
            </select>
          </div>

          {/* Model and Voice Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Model</label>
              <select
                value={data.params?.model || ''}
                onChange={(e) => updateNodeData(id, { model: e.target.value })}
                className="w-full text-sm bg-white border border-slate-200 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Select Model</option>
                {data.params?.provider === 'OpenAI' ? (
                  <>
                    <option value="tts-1">TTS-1</option>
                    <option value="tts-1-hd">TTS-1-HD</option>
                  </>
                ) : (
                  <>
                    <option value="eleven-multilingual-v1">Eleven Multilingual v1</option>
                    <option value="eleven-monolingual-v1">Eleven Monolingual v1</option>
                  </>
                )}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Voice</label>
              <select
                value={data.params?.voice || ''}
                onChange={(e) => updateNodeData(id, { voice: e.target.value })}
                className="w-full text-sm bg-white border border-slate-200 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Select Voice</option>
                <option value="alloy">Alloy</option>
                <option value="echo">Echo</option>
                <option value="fable">Fable</option>
                <option value="onyx">Onyx</option>
                <option value="nova">Nova</option>
                <option value="shimmer">Shimmer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Text Input Card */}
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Mic className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-medium text-slate-700">Input Text</span>
            </div>
            <button
              onClick={() => updateNodeData(id, { 
                textMode: data.params?.textMode === 'variable' ? 'text' : 'variable' 
              })}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                data.params?.textMode === 'variable'
                  ? 'bg-teal-100 text-teal-700'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {data.params?.textMode === 'variable' ? 'Variable Mode' : 'Text Mode'}
            </button>
          </div>
          
          <div className="relative">
            <textarea
              placeholder="Enter text or use variables with {{}}"
              value={data.params?.text || ''}
              onChange={(e) => updateNodeData(id, { text: e.target.value })}
              className="w-full text-sm bg-white border border-slate-200 rounded-md px-3 py-2 min-h-[80px] focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <button
              onClick={handlePreview}
              className="absolute bottom-2 right-2 p-1.5 bg-teal-100 text-teal-600 rounded-md hover:bg-teal-200 transition-colors"
              title="Preview Audio"
            >
              <Play className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* API Key Section */}
        {data.params?.usePersonalKey && (
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-teal-500" />
                <span className="text-sm font-medium text-slate-700">API Key</span>
              </div>
              <button
                onClick={() => updateNodeData(id, { usePersonalKey: false })}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Use System Key
              </button>
            </div>
            <input
              type="password"
              placeholder="Enter your API key"
              value={data.params?.apiKey || ''}
              onChange={(e) => updateNodeData(id, { apiKey: e.target.value })}
              className="w-full text-sm bg-white border border-slate-200 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Status Bar */}
        <div className="flex items-center justify-between py-2 px-3 bg-slate-100 rounded-md text-xs text-slate-500">
          <span className="flex items-center space-x-1">
            <span className={`w-2 h-2 rounded-full ${data.params?.text ? 'bg-teal-500' : 'bg-slate-400'}`} />
            <span>{data.params?.text ? 'Ready to generate' : 'Waiting for input'}</span>
          </span>
          <span>{data.params?.provider} • {data.params?.voice || 'No voice'}</span>
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 -ml-0.5 bg-teal-500 border-2 border-white rounded-full"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 -mr-0.5 bg-teal-500 border-2 border-white rounded-full"
      />
    </div>
  );
};

export default AudioProcessorNode;