import React, { useState, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { Settings, Trash2, Copy, Sparkles, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';
import { VariableBuilder } from '../../VariableBuilder';
import { useVariableInput } from '../../../../hooks/useVariableInput';
import { VariableHighlighter } from '../../VariableHighlighter';

interface OpenAINodeProps {
  id: string;
  data: {
    params?: {
      nodeName?: string;
      system?: string;
      prompt?: string;
      model?: string;
      apiKey?: string;
      usePersonalKey?: boolean;
      finetunedModel?: string;
      showSettings?: boolean;
    };
  };
  selected?: boolean;
}

const modelOptions = [
  'gpt-4-turbo-preview',
  'gpt-4-0125-preview',
  'gpt-4-1106-preview',
  'gpt-4',
  'gpt-3.5-turbo-0125',
  'gpt-3.5-turbo',
  'text-embedding-3-small',
  'text-embedding-3-large',
  'whisper-1',
  'tts-1',
  'tts-1-hd',
  'dall-e-3',
  'dall-e-2'
];

const OpenAINode: React.FC<OpenAINodeProps> = ({ id, data, selected }) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [variablePosition, setVariablePosition] = useState<{ x: number, y: number } | null>(null);
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
  
  // Use our variable input hook for system
  const {
    inputRef: systemInputRef,
    showVarBuilder: showSystemVarBuilder,
    handleKeyUp: handleSystemKeyUp,
    insertVariable: insertSystemVariable,
  } = useVariableInput({
    value: data.params?.system || '',
    onChange: (value) => updateNodeData(id, { system: value })
  });
  
  // Use our variable input hook for prompt
  const {
    inputRef: promptInputRef,
    showVarBuilder: showPromptVarBuilder,
    handleKeyUp: handlePromptKeyUp,
    insertVariable: insertPromptVariable,
  } = useVariableInput({
    value: data.params?.prompt || '',
    onChange: (value) => updateNodeData(id, { prompt: value })
  });
  
  // Helper to check for variable errors
  const checkVariableErrors = () => {
    if (!data.params?.prompt) return null;
    
    // Get a list of all node names from the current workflow
    const nodeNames = nodes.map(node => node.data.params?.nodeName || node.id);
    
    // Find all variables in the prompt
    const regex = /{{([^}]+)}}/g;
    const matches = [...(data.params.prompt.matchAll(regex) || [])];
    
    // Check each variable
    for (const match of matches) {
      const variable = match[1];
      
      // Split by dot to get node name and output field
      const [nodeName, outputField] = variable.split('.');
      
      // Check if node exists
      if (!nodeNames.includes(nodeName)) {
        return {
          error: 'Invalid variable',
          message: `Node "${nodeName}" doesn't exist in the workflow.`,
          variable
        };
      }
      
      // Check if node is connected to this node
      const sourceNode = nodes.find(n => n.data.params?.nodeName === nodeName || n.id === nodeName);
      if (sourceNode) {
        const isConnected = edges.some(edge => 
          edge.source === sourceNode.id && edge.target === id
        );
        
        if (!isConnected) {
          return {
            error: 'Node not connected',
            message: `Node "${nodeName}" is not connected to this node.`,
            variable
          };
        }
      }
    }
    
    return null;
  };
  
  const variableError = checkVariableErrors();

  const getConnectedNodes = () => {
    return edges
      .filter(edge => edge.target === id)
      .map(edge => edge.source)
      .map(sourceId => nodes.find(node => node.id === sourceId))
      .filter(Boolean);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${
      selected ? 'ring-2 ring-blue-500' : 'border border-gray-200'
    }`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">OpenAI</h3>
              <p className="text-xs text-emerald-50/80">
                {data.params?.model || 'Select model'}
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
            value={data.params?.nodeName || 'openai_0'}
            onChange={(e) => updateNodeData(id, { nodeName: e.target.value })}
            className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Add this after the node name input */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500">Connected Nodes</label>
          {getConnectedNodes().length > 0 ? (
            <div className="p-2 bg-gray-50 border border-gray-200 rounded-md">
              <ul className="space-y-1">
                {getConnectedNodes().map((node: any) => (
                  <li key={node.id} className="flex items-center text-xs">
                    <span className="w-2 h-2 bg-teal-500 rounded-full mr-2"></span>
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

        {/* Prompt */}
        <div className="space-y-2 relative">
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Prompt</span>
            <div className="text-xs text-blue-600 flex items-center">
              <span className="mr-1">Type </span>
              <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">&#123;&#123;</kbd>
              <span className="ml-1">to use variables</span>
            </div>
          </label>
          <textarea
            ref={promptInputRef}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
            value={data.params?.prompt || ''}
            onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
            onKeyUp={handlePromptKeyUp}
            onFocus={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setVariablePosition({ 
                x: rect.left, 
                y: rect.bottom + window.scrollY + 5
              });
            }}
            placeholder="Type your prompt here... Type {{ to use variables from other nodes"
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
          
          {showPromptVarBuilder && variablePosition && (
            <VariableBuilder 
              nodeId={id}
              position={variablePosition}
              onSelect={(variable) => insertPromptVariable(variable)}
              inputType="Text"
          />
          )}
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Model</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
            value={data.params?.model || ''}
            onChange={(e) => updateNodeData(id, { model: e.target.value })}
          >
            <option value="">Select a model</option>
            {modelOptions.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            API Key <span className="text-xs text-gray-500">(Optional if system key is configured)</span>
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
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

        {/* Finetuned Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Finetuned Model ID</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
            value={data.params?.finetunedModel || ''}
            onChange={(e) => updateNodeData(id, { finetunedModel: e.target.value })}
            placeholder="Enter your finetuned model ID"
          />
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

export default OpenAINode;