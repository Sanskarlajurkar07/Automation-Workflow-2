import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  Settings, Trash2, Copy, Sparkles, Eye, EyeOff, 
  AlertTriangle, MessageSquare, ChevronDown, ChevronUp,
  CheckCircle, FileText, Zap, Book, Lightbulb
} from 'lucide-react';
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
      temperature?: number;
      maxTokens?: number;
      streaming?: boolean;
      frequencyPenalty?: number;
      presencePenalty?: number;
    };
  };
  selected?: boolean;
}

// Updated model options with categorization
const modelOptions = {
  'GPT-4 Models': [
    'gpt-4o',
    'gpt-4-turbo',
    'gpt-4-vision-preview',
    'gpt-4',
  ],
  'GPT-3.5 Models': [
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-16k',
  ],
  'Special Purpose': [
    'text-embedding-3-small',
    'text-embedding-3-large',
    'whisper-1',
    'tts-1',
    'tts-1-hd',
    'dall-e-3',
  ]
};

// Prompt templates
const promptTemplates = [
  { name: 'Default', 
    system: 'You are a helpful assistant.', 
    prompt: 'Please provide information about {{topic}}.' },
  { name: 'Content Writer', 
    system: 'You are a professional content writer with expertise in creating engaging and informative articles.', 
    prompt: 'Write an article about {{topic}} with the following criteria:\n- Length: {{length}}\n- Target audience: {{audience}}\n- Tone: {{tone}}' },
  { name: 'Code Assistant', 
    system: 'You are an expert programming assistant. Provide clean, efficient, and well-commented code examples.', 
    prompt: 'Write code for {{language}} that accomplishes the following task:\n\n{{task}}' },
  { name: 'Data Analyzer', 
    system: 'You are a data analysis expert who can interpret data and provide insights.', 
    prompt: 'Analyze the following data:\n\n{{data}}\n\nProvide insights and recommendations.' },
  { name: 'Customer Support', 
    system: 'You are a helpful and friendly customer support representative. Be concise but thorough in addressing customer concerns.', 
    prompt: 'The customer has the following question or issue:\n\n{{issue}}\n\nHow would you respond?' },
];

const OpenAINode: React.FC<OpenAINodeProps> = ({ id, data, selected }) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [variablePosition, setVariablePosition] = useState<{ x: number, y: number } | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    prompt: true,
    system: false,
    model: true,
    advanced: false
  });
  const [showTemplates, setShowTemplates] = useState(false);
  const systemTextareaRef = useRef<HTMLTextAreaElement>(null);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const { nodes, edges } = useFlowStore();

  // Set default values for new parameters
  useEffect(() => {
    if (!data.params?.temperature && data.params?.temperature !== 0) {
      updateNodeData(id, { temperature: 0.7 });
    }
    if (!data.params?.maxTokens) {
      updateNodeData(id, { maxTokens: 1000 });
    }
    if (data.params?.streaming === undefined) {
      updateNodeData(id, { streaming: false });
    }
    if (!data.params?.nodeName) {
      updateNodeData(id, { nodeName: `openai_${id.split('-')[1] || '0'}` });
    }
  }, [id, data.params, updateNodeData]);

  const handleToggleSettings = () => {
    updateNodeData(id, { showSettings: !data.params?.showSettings });
  };

  const handleCopyNodeId = () => {
    navigator.clipboard.writeText(id);
  };

  const toggleSectionExpand = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const applyTemplate = (template: typeof promptTemplates[0]) => {
    updateNodeData(id, { 
      system: template.system,
      prompt: template.prompt
    });
    setShowTemplates(false);
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
      
      // Skip checking if the variable doesn't contain a dot (might be a template variable)
      if (!variable.includes('.')) continue;
      
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

  // Check for issues with the node configuration
  const getNodeIssues = () => {
    const issues = [];
    
    if (!data.params?.model) {
      issues.push({ type: 'error', message: 'No model selected' });
    }
    
    if (!data.params?.prompt || data.params.prompt.trim() === '') {
      issues.push({ type: 'error', message: 'Prompt is empty' });
    } else if (variableError) {
      issues.push({ type: 'error', message: variableError.message });
    }

    if (data.params?.maxTokens && (data.params.maxTokens < 1 || data.params.maxTokens > 8192)) {
      issues.push({ type: 'warning', message: 'Max tokens should be between 1 and 8192' });
    }

    return issues;
  };

  const nodeIssues = getNodeIssues();
  const hasErrors = nodeIssues.some(issue => issue.type === 'error');

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${
      selected ? 'ring-2 ring-emerald-500' : hasErrors ? 'border border-red-300' : 'border border-gray-200'
    }`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">{data.params?.nodeName || 'OpenAI'}</h3>
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
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this OpenAI node?')) {
                  removeNode(id);
                }
              }}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-red-400/20 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-5">
        {/* Node Issues */}
        {nodeIssues.length > 0 && (
          <div className={`rounded-md p-3 ${hasErrors ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-start">
              <AlertTriangle className={`w-5 h-5 ${hasErrors ? 'text-red-500' : 'text-yellow-500'} mt-0.5 mr-2 flex-shrink-0`} />
              <div>
                <p className={`text-sm font-medium ${hasErrors ? 'text-red-800' : 'text-yellow-800'}`}>
                  {hasErrors ? 'Required fields missing' : 'Configuration warnings'}
                </p>
                <ul className="mt-1 text-xs space-y-1">
                  {nodeIssues.map((issue, index) => (
                    <li key={index} className={issue.type === 'error' ? 'text-red-700' : 'text-yellow-700'}>
                      • {issue.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Node Name */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500">Node Name</label>
          <input
            type="text"
            value={data.params?.nodeName || ''}
            onChange={(e) => updateNodeData(id, { nodeName: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Connected Nodes */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 flex items-center">
            <span>Connected Inputs</span>
            <span className="ml-2 px-1.5 py-0.5 text-xs rounded-md bg-emerald-100 text-emerald-800">
              {getConnectedNodes().length} {getConnectedNodes().length === 1 ? 'node' : 'nodes'}
            </span>
          </label>
          {getConnectedNodes().length > 0 ? (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <ul className="space-y-1">
                {getConnectedNodes().map((node: any) => (
                  <li key={node.id} className="flex items-center text-xs">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
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
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-700 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>No connected nodes. Connect inputs to use their data as variables.</span>
            </div>
          )}
        </div>

        {/* Model Section */}
        <div className="space-y-2">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSectionExpand('model')}
          >
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-emerald-500" />
              <span>Model Selection</span>
            </label>
            <button className="text-gray-400">
              {expandedSections.model ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          
          {expandedSections.model && (
            <div className="pt-2 space-y-3">
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                value={data.params?.model || ''}
                onChange={(e) => updateNodeData(id, { model: e.target.value })}
              >
                <option value="">Select a model</option>
                {Object.entries(modelOptions).map(([category, models]) => (
                  <optgroup key={category} label={category}>
                    {models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              
              {data.params?.model?.includes('gpt-4') && (
                <div className="p-2 bg-blue-50 border border-blue-100 rounded text-xs text-blue-700 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Using GPT-4 model: Higher quality, better reasoning, more capabilities
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prompt Templates */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowTemplates(!showTemplates)}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center"
            >
              <FileText className="w-4 h-4 mr-1" />
              {showTemplates ? 'Hide Templates' : 'Show Prompt Templates'}
            </button>
          </div>
          
          {showTemplates && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <h4 className="text-xs font-medium text-gray-700 mb-2">Select a template to apply</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {promptTemplates.map((template, index) => (
                  <div 
                    key={index}
                    className="p-2 bg-white border border-gray-200 rounded cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                    onClick={() => applyTemplate(template)}
                  >
                    <div className="text-sm font-medium text-gray-700">{template.name}</div>
                    <div className="text-xs text-gray-500 truncate">{template.prompt.substring(0, 60)}...</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* System Prompt */}
        <div className="space-y-2">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSectionExpand('system')}
          >
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <Book className="w-4 h-4 mr-2 text-emerald-500" />
              <span>System Prompt</span>
            </label>
            <button className="text-gray-400">
              {expandedSections.system ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          
          {expandedSections.system && (
            <div className="pt-2 space-y-2">
              <div className="relative">
                <textarea
                  ref={systemInputRef}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm min-h-[100px]"
                  value={data.params?.system || ''}
                  onChange={(e) => updateNodeData(id, { system: e.target.value })}
                  onKeyUp={handleSystemKeyUp}
                  onFocus={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setVariablePosition({ 
                      x: rect.left, 
                      y: rect.bottom + window.scrollY + 5
                    });
                  }}
                  placeholder="Define the AI's behavior and knowledge context..."
                />
                
                {showSystemVarBuilder && variablePosition && (
                  <VariableBuilder 
                    nodeId={id}
                    position={variablePosition}
                    onSelect={(variable) => insertSystemVariable(variable)}
                    inputType="Text"
                  />
                )}
              </div>
              
              {data.params?.system && (
                <div className="p-2 bg-blue-50 border border-blue-100 rounded-md text-xs text-blue-700">
                  <p>System prompts influence the AI's behavior and knowledge without appearing in the conversation.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSectionExpand('prompt')}
          >
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-emerald-500" />
              <span>User Prompt</span>
              {!data.params?.prompt && (
                <span className="ml-2 text-red-500 text-xs">Required</span>
              )}
            </label>
            <button className="text-gray-400">
              {expandedSections.prompt ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          
          {expandedSections.prompt && (
            <div className="pt-2 relative space-y-2">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-blue-600 flex items-center">
                  <span className="mr-1">Type </span>
                  <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">&#123;&#123;</kbd>
                  <span className="ml-1">to use variables</span>
                </div>
              </div>
              
              <textarea
                ref={promptInputRef}
                className={`w-full rounded-md shadow-sm sm:text-sm min-h-[140px] ${
                  !data.params?.prompt 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'
                }`}
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
              
              {showPromptVarBuilder && variablePosition && (
                <VariableBuilder 
                  nodeId={id}
                  position={variablePosition}
                  onSelect={(variable) => insertPromptVariable(variable)}
                  inputType="Text"
                />
              )}
              
              {/* Variable usage guidance */}
              <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded text-xs text-blue-700">
                <p><strong>Variable Usage:</strong></p>
                <ul className="mt-1 space-y-1 list-disc pl-4">
                  <li>Input nodes: use <code>&#123;&#123;nodeName.output&#125;&#125;</code> to access their value</li>
                  <li>AI nodes: use <code>&#123;&#123;nodeName.response&#125;&#125;</code> for their response</li>
                  <li>Type <code>&#123;&#123;</code> to open the variable selector</li>
                </ul>
              </div>
              
              {/* Add this block to show the highlighted variables preview */}
              {data.params?.prompt && data.params.prompt.includes('{{') && (
                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Preview with variables:</label>
                  <VariableHighlighter 
                    text={data.params.prompt} 
                    className="text-sm text-gray-700"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Advanced Settings */}
        <div className="space-y-2">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSectionExpand('advanced')}
          >
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <Settings className="w-4 h-4 mr-2 text-emerald-500" />
              <span>Advanced Settings</span>
            </label>
            <button className="text-gray-400">
              {expandedSections.advanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          
          {expandedSections.advanced && (
            <div className="pt-2 space-y-4">
              {/* Temperature slider */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="block text-xs font-medium text-gray-500">Temperature: {data.params?.temperature}</label>
                  <span className="text-xs text-gray-400">
                    {data.params?.temperature === 0 
                      ? 'Deterministic' 
                      : data.params?.temperature && data.params.temperature > 0.7 
                        ? 'More creative' 
                        : 'More focused'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={data.params?.temperature || 0.7}
                  onChange={(e) => updateNodeData(id, { temperature: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
              
              {/* Max tokens */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500">
                  Max Tokens: {data.params?.maxTokens || 1000}
                </label>
                <input
                  type="number"
                  value={data.params?.maxTokens || 1000}
                  onChange={(e) => updateNodeData(id, { maxTokens: parseInt(e.target.value) })}
                  min="1"
                  max="8192"
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500">Maximum number of tokens to generate in the response.</p>
              </div>
              
              {/* Streaming toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`streaming-${id}`}
                  checked={data.params?.streaming || false}
                  onChange={(e) => updateNodeData(id, { streaming: e.target.checked })}
                  className="h-4 w-4 text-emerald-500 focus:ring-emerald-400 border-gray-300 rounded"
                />
                <label htmlFor={`streaming-${id}`} className="text-xs font-medium text-gray-700">
                  Enable streaming (receive tokens as they're generated)
                </label>
              </div>
              
              {/* API Key */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500">
                  API Key <span className="text-xs text-gray-400">(Optional if system key is configured)</span>
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                <p className="text-xs text-gray-500">Leave blank to use the system API key if available.</p>
              </div>
              
              {/* Finetuned Model */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500">Finetuned Model ID</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={data.params?.finetunedModel || ''}
                  onChange={(e) => updateNodeData(id, { finetunedModel: e.target.value })}
                  placeholder="Enter your finetuned model ID (if applicable)"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 -ml-0.5 bg-emerald-500 border-2 border-white rounded-full"
        style={{ top: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 -mr-0.5 bg-emerald-500 border-2 border-white rounded-full"
        style={{ top: '50%' }}
      />
    </div>
  );
};

export default OpenAINode;