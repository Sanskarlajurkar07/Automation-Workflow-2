import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  Settings, Trash2, Copy, Sparkles, Eye, EyeOff, 
  AlertTriangle, MessageSquare, ChevronDown, ChevronUp,
  CheckCircle, FileText, Zap
} from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';
import { VariableBuilder } from '../../VariableBuilder';
import { useVariableInput } from '../../../../hooks/useVariableInput';
import { VariableHighlighter } from '../../VariableHighlighter';
import AutocompleteInput from '../../AutocompleteInput';
import NodeSettingsField from '../../NodeSettingsField';

interface AnthropicNodeProps {
  id: string;
  data: {
    params?: {
      nodeName?: string;
      system?: string;
      prompt?: string;
      model?: string;
      apiKey?: string;
      usePersonalKey?: boolean;
      max_tokens?: number;
      showSettings?: boolean;
    };
    system?: string;
    prompt?: string;
  };
  selected?: boolean;
}

const modelOptions = ['claude-3-opus', 'claude-3-sonnet', 'claude-2.1'];

const AnthropicNode: React.FC<AnthropicNodeProps> = ({ id, data, selected }) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [variablePosition, setVariablePosition] = useState<{ x: number, y: number } | null>(null);
  const [variableError, setVariableError] = useState<{
    error: string;
    message: string;
    variable: string;
  } | null>(null);
  
  const systemTextareaRef = useRef<HTMLTextAreaElement>(null);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const { nodes, edges } = useFlowStore();

  const handleToggleSettings = () => {
    updateNodeData(id, { showSettings: !data.params?.showSettings });
  };

  const handleCopyNodeId = () => {
    navigator.clipboard.writeText(id);
  };
  
  // Use variable input hook for system
  const {
    inputRef: systemInputRef,
    showVarBuilder: showSystemVarBuilder,
    handleKeyUp: handleSystemKeyUp,
    insertVariable: insertSystemVariable,
    getConnectedNodes
  } = useVariableInput({
    value: data.params?.system || data.system || '',
    onChange: (value) => updateNodeData(id, { system: value })
  });
  
  // Use variable input hook for prompt
  const {
    inputRef: promptInputRef,
    showVarBuilder: showPromptVarBuilder,
    handleKeyUp: handlePromptKeyUp,
    insertVariable: insertPromptVariable,
  } = useVariableInput({
    value: data.params?.prompt || data.prompt || '',
    onChange: (value) => updateNodeData(id, { prompt: value })
  });

  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden ${
        selected ? 'ring-2 ring-purple-500' : 'border border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-violet-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-1 bg-white/20 backdrop-blur-sm rounded-lg w-9 h-9 flex items-center justify-center">
              <img 
                src="/logos/anthropic.png" 
                alt="Anthropic Logo" 
                className="w-7 h-7 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://www.anthropic.com/images/favicon.svg"; 
                  target.onerror = null;
                }}
              />
            </div>
            <div>
              <h3 className="font-medium text-white">{data.params?.nodeName || 'Anthropic'}</h3>
              <p className="text-xs text-purple-50/80">
                {data.params?.model || 'claude-3-opus'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyNodeId}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              title="Copy Node ID"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleToggleSettings}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
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

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Node Name */}
        <div className="space-y-2">
          <input
            type="text"
            value={data.params?.nodeName || 'anthropic_0'}
            onChange={(e) => updateNodeData(id, { nodeName: e.target.value })}
            className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Connected Nodes */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500">Connected Nodes</label>
          {getConnectedNodes(id).length > 0 ? (
            <div className="p-2 bg-gray-50 border border-gray-200 rounded-md">
              <ul className="space-y-1">
                {getConnectedNodes(id).map((node: any) => (
                  <li key={node.id} className="flex items-center text-xs">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    <span className="font-medium">{node.data.params?.nodeName || node.id}</span>
                    <span className="text-gray-500 ml-1">({node.type})</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 mt-2 border-t border-gray-200 pt-1">
                Type <code className="px-1.5 py-0.5 bg-gray-200 rounded">&#123;&#123;</code> to use variables from these nodes
              </p>
            </div>
          ) : (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-700">
              No connected nodes. Connect nodes to use their outputs as variables.
            </div>
          )}
        </div>

        {/* Variable error display */}
        {variableError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-start">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">{variableError.error}</p>
                <p className="text-xs text-red-700 mt-1">{variableError.message}</p>
                <div className="mt-2 px-2 py-1 bg-red-100 rounded text-xs font-mono text-red-800">
                  {'{{'}{variableError.variable}{'}}'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Instructions */}
        <div className="space-y-2 relative">
          <label className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">System Instructions</span>
            <button
              onClick={() => updateNodeData(id, { system: '' })}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          </label>
          <AutocompleteInput
            value={data.params?.system || data.system || ''}
            onChange={(value) => updateNodeData(id, { system: value })}
            placeholder="Enter system instructions..."
            multiline={true}
            rows={3}
          />
          
          {/* System variables preview */}
          {data.params?.system && data.params.system.includes('{{') && (
            <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Preview with variables:</label>
              <VariableHighlighter 
                text={data.params.system} 
                className="text-sm text-gray-700"
              />
            </div>
          )}
        </div>

        {/* Prompt */}
        <div className="space-y-2 relative">
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Prompt</span>
          </label>
          <AutocompleteInput
            value={data.params?.prompt || data.prompt || ''}
            onChange={(value) => updateNodeData(id, { prompt: value })}
            placeholder="Type your prompt here... Use variables from other nodes"
            multiline={true}
            rows={4}
          />
          
          {/* Add this block to show the highlighted variables preview */}
          {data.params?.prompt && data.params.prompt.includes('{{') && (
            <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Preview with variables:</label>
              <VariableHighlighter 
                text={data.params.prompt} 
                className="text-sm text-gray-700"
              />
            </div>
          )}
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Model</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            value={data.params?.model || modelOptions[0]}
            onChange={(e) =>
              updateNodeData(id, { model: e.target.value })
            }
          >
            {modelOptions.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        {/* Max Tokens */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Max Tokens</label>
          <input
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            value={data.params?.max_tokens || 1000}
            onChange={(e) => updateNodeData(id, { max_tokens: parseInt(e.target.value) })}
            placeholder="Maximum output tokens (default: 1000)"
          />
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            API Key <span className="text-xs text-gray-500">(Optional if system key is configured)</span>
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              value={data.params?.apiKey || ''}
              onChange={(e) => updateNodeData(id, { apiKey: e.target.value })}
              placeholder="Enter your API Key (or leave blank to use system key)"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">Leave blank to use the system API key if available.</p>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span
            className={`w-2 h-2 rounded-full ${
              data.params?.apiKey ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
          <span>{data.params?.apiKey ? 'Connected' : 'API Key required'}</span>
        </div>
        {data.params?.model && (
          <span className="text-purple-600 font-medium">{data.params.model}</span>
        )}
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

export default AnthropicNode;