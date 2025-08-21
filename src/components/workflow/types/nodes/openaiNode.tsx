import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  Settings, Trash2, Copy, Sparkles, Eye, EyeOff, 
  AlertTriangle, MessageSquare, ChevronDown, ChevronUp,
  CheckCircle, FileText, Zap, Book, Lightbulb
} from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';
import { VariableHighlighter } from '../../VariableHighlighter';
import AutocompleteInput from '../../AutocompleteInput';
import { validateVariables, createNodeNameMap } from '../../../../utils/variableResolver';
import { validateVariables } from '../../../../utils/variableResolver';

interface OpenAINodeProps {
  id: string;
}

const OpenAINode: React.FC<OpenAINodeProps> = ({ id }) => {
  const { nodes, edges, updateNodeData } = useFlowStore();
  
  const getConnectedNodes = () => {
    return edges
      .filter(edge => edge.target === id)
      .map(edge => edge.source)
      .map(sourceId => nodes.find(node => node.id === sourceId))
      .filter(Boolean);
  };

  // Enhanced node validation with variable checking
  const getNodeIssues = () => {
    const issues = [];
    
    const data = nodes.find(node => node.id === id)?.data;
    
    if (!data.params?.prompt || data.params.prompt.trim() === '') {
      issues.push({ type: 'error', message: 'Prompt is empty' });
    } else {
      // Enhanced variable validation
      const nodeNameMap = createNodeNameMap(nodes);
      
      const nodeOutputs = {};
      getConnectedNodes().forEach((node: any) => {
        const nodeName = nodeNameMap[node.id] || node.id;
        nodeOutputs[nodeName] = { output: 'sample', response: 'sample' };
      });
      
      const variableValidation = validateVariables(data.params.prompt, { nodeOutputs, nodeNameMap });
      const invalidVars = variableValidation.filter(v => !v.isValid);
      
      if (invalidVars.length > 0) {
        issues.push({ 
          type: 'error', 
          message: `Invalid variables: ${invalidVars.map(v => v.variable).join(', ')}` 
        });
      }
    }

    if (data.params?.maxTokens && (data.params.maxTokens < 1 || data.params.maxTokens > 8192)) {
      issues.push({ type: 'error', message: 'Max tokens must be between 1 and 8192' });
    }

    return issues;
  };

  return (
    <div className="openai-node">
      <div className="node-content">
        <div className="prompt-section">
          <div className="relative rounded-md overflow-hidden mb-3 transition-all duration-200 border-2 border-emerald-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/30">
            <AutocompleteInput
              value={data.params?.prompt || ''}
              onChange={(value) => updateNodeData(id, { prompt: value })}
              placeholder="Enter your prompt here... Use {{variables}} from connected nodes"
              multiline={true}
              rows={7}
              className="bg-white border-none shadow-none text-gray-800 focus:ring-0 resize-none"
            />
          </div>
          
          {/* Variable info callout */}
          <div className="flex items-start p-2.5 mb-3 bg-blue-50 border border-blue-100 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
              className="w-4 h-4 text-blue-600 mt-0.5 mr-2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
            <div>
              <p className="text-xs text-blue-700 font-medium">Dynamic Content</p>
              <p className="text-xs text-blue-600">
                Type <code className="px-1 py-0.5 bg-blue-100 rounded font-mono">&#123;&#123;</code> or click 
                the Variables button to insert dynamic values from connected nodes.
              </p>
            </div>
          </div>
          
          {/* Improved variable preview with clearer styling */}
          {data.params?.prompt && data.params.prompt.includes('{{') && (
            <div className="mb-3 p-3 bg-white/90 border border-emerald-200 rounded-md">
              <div className="flex items-center mb-1.5">
                <Eye className="w-4 h-4 mr-1.5 text-emerald-600" />
                <label className="text-sm font-medium text-emerald-700">Prompt Preview</label>
              </div>
              <VariableHighlighter 
                text={data.params.prompt} 
                className="text-sm text-gray-700 bg-white/50 p-2.5 rounded border border-gray-100"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpenAINode;