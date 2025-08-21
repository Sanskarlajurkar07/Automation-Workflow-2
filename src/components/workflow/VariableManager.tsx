import React, { useState, useMemo } from 'react';
import { Clipboard, Copy, Search, ChevronDown, ChevronUp, RefreshCw, Check, AlertTriangle, Info } from 'lucide-react';
import { useTheme } from '../../utils/themeProvider';
import { useFlowStore } from '../../store/flowStore';
import { getAvailableVariables } from '../../utils/variableResolver';

interface Variable {
  id: string;
  name: string;
  nodeType: string;
  fields: Array<{name: string, type: string, description: string}>;
  description: string;
  isConnected: boolean;
}

interface VariableManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VariableManager: React.FC<VariableManagerProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Inputs': true,
    'AI Models': true,
    'Text Processing': true,
    'Knowledge Base': true,
  });
  
  // Get nodes and edges from flow store
  const { nodes, edges } = useFlowStore();
  
  // Generate variables from nodes with enhanced field detection
  const variables = useMemo(() => {
    // Use centralized variable detection
    const availableVars = getAvailableVariables(nodes);
    
    return availableVars.map(nodeVar => {
      const isConnected = edges.some(edge => edge.source === nodeVar.nodeId);
      
      return {
        id: nodeVar.nodeId,
        name: nodeVar.nodeName,
        nodeType: nodeVar.nodeType,
        fields: nodeVar.fields,
        description: getNodeDescription(nodeVar.nodeType),
        isConnected
      };
    });
  }, [nodes, edges]);
  
  // Group variables by type with better categorization
  const groupedVariables = useMemo(() => {
    const groups: Record<string, Variable[]> = {};
    
    variables.forEach(variable => {
      let groupName = 'Other';
      
      switch (variable.nodeType) {
        case 'input':
          groupName = 'Inputs';
          break;
        case 'openai':
        case 'anthropic':
        case 'claude35':
        case 'gemini':
        case 'cohere':
        case 'perplexity':
        case 'xai':
        case 'aws':
        case 'azure':
          groupName = 'AI Models';
          break;
        case 'kb-search':
        case 'kb-reader':
        case 'kb-loader':
        case 'kb-sync':
          groupName = 'Knowledge Base';
          break;
        case 'transform':
        case 'scripts':
        case 'text-processor':
        case 'json-handler':
          groupName = 'Text Processing';
          break;
        case 'file-loader':
        case 'document-to-text':
        case 'csv-loader':
        case 'url-loader':
        case 'youtube-loader':
        case 'arxiv-loader':
        case 'rss-loader':
          groupName = 'Data Import';
          break;
        case 'condition':
        case 'merge':
        case 'time':
        case 'ttsql':
          groupName = 'Logic & Control';
          break;
        case 'output':
        case 'file-save':
        case 'note':
          groupName = 'Outputs';
          break;
        case 'mysql':
        case 'mongodb':
        case 'github':
        case 'airtable':
        case 'notion':
        case 'hubspot':
        case 'gmail':
        case 'outlook':
        case 'slack':
        case 'teams':
        case 'discord':
          groupName = 'Integrations';
          break;
      }
      
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      
      groups[groupName].push(variable);
    });
    
    return groups;
  }, [variables]);
  
  // Filter variables based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groupedVariables;
    
    const filtered: Record<string, Variable[]> = {};
    
    Object.entries(groupedVariables).forEach(([groupName, groupVars]) => {
      const matchedVars = groupVars.filter(variable => 
        variable.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        variable.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        variable.fields.some(field => 
          field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          field.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      
      if (matchedVars.length > 0) {
        filtered[groupName] = matchedVars;
      }
    });
    
    return filtered;
  }, [groupedVariables, searchQuery]);
  
  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };
  
  const copyVariableToClipboard = (variableId: string, field: {name: string, type: string}) => {
    const variable = variables.find(v => v.id === variableId);
    if (!variable) return;
    
    const varText = `{{ ${variable.name}.${field.name} }}`;
    navigator.clipboard.writeText(varText);
    setCopiedVar(`${variableId}.${field.name}`);
    
    // Clear the copied indicator after 2 seconds
    setTimeout(() => setCopiedVar(null), 2000);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className={`w-full max-w-5xl ${isLight ? 'bg-white' : 'bg-slate-900'} rounded-lg shadow-lg p-6 max-h-[90vh] overflow-hidden flex flex-col`}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Clipboard className={`h-5 w-5 mr-2 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
            <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>
              Workflow Variables
            </h2>
          </div>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-lg ${isLight ? 'hover:bg-gray-100' : 'hover:bg-slate-800'}`}
          >
            <span className="sr-only">Close</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Info Banner */}
        <div className={`mb-4 p-4 rounded-lg ${
          isLight ? 'bg-blue-50 border border-blue-100' : 'bg-blue-900/20 border border-blue-800/30'
        }`}>
          <div className="flex items-start">
            <Info className={`w-5 h-5 ${isLight ? 'text-blue-600' : 'text-blue-400'} mt-0.5 mr-3 flex-shrink-0`} />
            <div>
              <p className={`text-sm ${isLight ? 'text-blue-800' : 'text-blue-300'} font-medium mb-1`}>
                How to use variables in your workflow:
              </p>
              <ul className={`text-sm ${isLight ? 'text-blue-700' : 'text-blue-200'} space-y-1`}>
                <li>• Copy variables from the list below and paste them into node input fields</li>
                <li>• Variables use the format: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{{ nodeName.fieldName }}</code></li>
                <li>• Only connected nodes will have their variables available during execution</li>
                <li>• Use the autocomplete feature in input fields by typing <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{'{{'}</code></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className={`relative ${isLight ? 'bg-gray-50' : 'bg-slate-800'} rounded-lg`}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search variables by name, type, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-2 pl-10 pr-4 rounded-lg ${
                isLight 
                  ? 'bg-gray-50 text-gray-800 placeholder-gray-400' 
                  : 'bg-slate-800 text-white placeholder-gray-400'
              } border ${isLight ? 'border-gray-200' : 'border-slate-700'}`}
            />
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1">
          {Object.keys(filteredGroups).length > 0 ? (
            Object.entries(filteredGroups).map(([groupName, groupVars]) => (
              <div key={groupName} className={`mb-4 rounded-lg border ${
                isLight ? 'border-gray-200' : 'border-slate-700'
              }`}>
                <button
                  onClick={() => toggleGroup(groupName)}
                  className={`w-full px-4 py-3 flex justify-between items-center ${
                    isLight 
                      ? 'bg-gray-50 hover:bg-gray-100'
                      : 'bg-slate-800 hover:bg-slate-700'
                  } rounded-t-lg transition-colors`}
                >
                  <div className="flex items-center">
                    <span className="font-medium">{groupName}</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      isLight ? 'bg-blue-100 text-blue-800' : 'bg-blue-900/30 text-blue-300'
                    }`}>
                      {groupVars.length}
                    </span>
                  </div>
                  {expandedGroups[groupName] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                
                {expandedGroups[groupName] && (
                  <div className={`p-4 ${isLight ? 'bg-white' : 'bg-slate-900'} rounded-b-lg`}>
                    {groupVars.map(variable => (
                      <div 
                        key={variable.id} 
                        className={`mb-4 p-4 rounded-lg ${
                          isLight ? 'bg-gray-50' : 'bg-slate-800'
                        } ${!variable.isConnected ? 'opacity-75' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <div className="font-medium text-base">{variable.name}</div>
                              {!variable.isConnected && (
                                <div className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                  isLight ? 'bg-yellow-100 text-yellow-700' : 'bg-yellow-900/30 text-yellow-400'
                                }`}>
                                  Not connected
                                </div>
                              )}
                            </div>
                            <div className={`text-sm mt-1 ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>
                              {variable.description}
                            </div>
                          </div>
                          <div className={`text-xs px-2 py-1 rounded ${
                            isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-900/20 text-blue-400'
                          }`}>
                            {variable.nodeType}
                          </div>
                        </div>
                        
                        {/* Available Fields */}
                        <div className="space-y-2">
                          <div className={`text-sm font-medium ${isLight ? 'text-gray-700' : 'text-gray-200'}`}>
                            Available fields:
                          </div>
                          {variable.fields.map(field => (
                            <div 
                              key={field.name} 
                              className={`flex justify-between items-center p-2 rounded hover:${
                                isLight ? 'bg-gray-100' : 'bg-slate-700'
                              } transition-colors`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <code className={`text-sm font-mono px-2 py-1 rounded ${
                                    isLight 
                                      ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                                      : 'bg-blue-900/20 text-blue-300 border border-blue-800/30'
                                  }`}>
                                    {'{{ '}<span className="font-semibold">{variable.name}</span>{'.'}
                                    <span className="font-semibold">{field.name}</span>{' }}'}
                                  </code>
                                  <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                                    getTypeColor(field.type, isLight)
                                  }`}>
                                    {field.type}
                                  </span>
                                </div>
                                <div className={`text-xs mt-1 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                                  {field.description}
                                </div>
                              </div>
                              <button
                                onClick={() => copyVariableToClipboard(variable.id, field)}
                                className={`p-2 rounded transition-colors ${
                                  copiedVar === `${variable.id}.${field.name}`
                                    ? (isLight ? 'text-green-600 bg-green-50' : 'text-green-400 bg-green-900/20')
                                    : (isLight ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100' : 'text-gray-500 hover:text-gray-300 hover:bg-slate-600')
                                }`}
                                title="Copy to clipboard"
                              >
                                {copiedVar === `${variable.id}.${field.name}` ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        {/* Connection warning */}
                        {!variable.isConnected && (
                          <div className={`mt-3 p-2 rounded-md flex items-start ${
                            isLight ? 'bg-yellow-50 border border-yellow-200' : 'bg-yellow-900/20 border border-yellow-800/30'
                          }`}>
                            <AlertTriangle className={`w-4 h-4 mt-0.5 mr-2 flex-shrink-0 ${
                              isLight ? 'text-yellow-600' : 'text-yellow-400'
                            }`} />
                            <div className={`text-xs ${isLight ? 'text-yellow-700' : 'text-yellow-300'}`}>
                              This node is not connected to other nodes. Connect it to make its variables available during execution.
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className={`text-center py-8 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
              {searchQuery ? (
                <>
                  <div className="text-lg mb-2">No variables found</div>
                  <p>Try a different search term or clear your search</p>
                </>
              ) : (
                <>
                  <div className="text-lg mb-2">No variables available</div>
                  <p>Add nodes to your workflow to create variables</p>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
          <div className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
            {variables.length} variable{variables.length !== 1 ? 's' : ''} available
            {variables.filter(v => v.isConnected).length !== variables.length && (
              <span className="ml-2">
                • {variables.filter(v => v.isConnected).length} connected
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-2 ${
              isLight 
                ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' 
                : 'bg-slate-800 text-white hover:bg-slate-700'
            } rounded-lg mr-2`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to get type-specific colors
function getTypeColor(type: string, isLight: boolean): string {
  const colors = {
    'Text': isLight ? 'bg-blue-100 text-blue-800' : 'bg-blue-900/30 text-blue-300',
    'Number': isLight ? 'bg-green-100 text-green-800' : 'bg-green-900/30 text-green-300',
    'Boolean': isLight ? 'bg-purple-100 text-purple-800' : 'bg-purple-900/30 text-purple-300',
    'Array': isLight ? 'bg-orange-100 text-orange-800' : 'bg-orange-900/30 text-orange-300',
    'Object': isLight ? 'bg-indigo-100 text-indigo-800' : 'bg-indigo-900/30 text-indigo-300',
  };
  
  return colors[type as keyof typeof colors] || (isLight ? 'bg-gray-100 text-gray-800' : 'bg-gray-700 text-gray-300');
}

// Helper function to get node descriptions
function getNodeDescription(nodeType: string): string {
  const descriptions: Record<string, string> = {
    'input': 'Text input from user',
    'output': 'Workflow output result',
    'openai': 'OpenAI language model response',
    'anthropic': 'Anthropic Claude model response',
    'claude35': 'Claude 3.5 model response',
    'gemini': 'Google Gemini model response',
    'cohere': 'Cohere language model response',
    'perplexity': 'Perplexity AI model response',
    'xai': 'X.AI Grok model response',
    'aws': 'AWS Bedrock model response',
    'azure': 'Azure OpenAI model response',
    'transform': 'Text transformation result',
    'scripts': 'Script execution result',
    'document-to-text': 'Document text extraction',
    'kb-search': 'Knowledge base search results',
    'kb-reader': 'Knowledge base query results',
    'condition': 'Conditional logic evaluation',
    'time': 'Current time information'
  };
  
  return descriptions[nodeType] || 'Node output';
}

export default VariableManager;