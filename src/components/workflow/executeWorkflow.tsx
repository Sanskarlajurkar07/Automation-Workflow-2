import React, { useState, useEffect } from 'react';
import { useFlowStore } from '../../store/flowStore';
import { Play, Square, RotateCcw, Download, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import workflowService from '../../lib/workflowService';
import { useTheme } from '../../utils/themeProvider';

interface ExecuteWorkflowProps {
  onClose: () => void;
  workflowId?: string;
}

interface InputField {
  nodeId: string;
  nodeName: string;
  type: string;
  value: any;
  required: boolean;
}

interface ExecutionResult {
  outputs: Record<string, any>;
  execution_time: number;
  status: string;
  error?: string;
  execution_path: string[];
  node_results: Record<string, any>;
}

const ExecuteWorkflow: React.FC<ExecuteWorkflowProps> = ({ onClose, workflowId }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { nodes, edges } = useFlowStore();
  
  const [inputFields, setInputFields] = useState<InputField[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [executionStep, setExecutionStep] = useState<string>('');

  // Extract input nodes and create input fields
  useEffect(() => {
    const inputNodes = nodes.filter(node => node.type === 'input');
    const fields: InputField[] = inputNodes.map(node => {
      const params = node.data?.params || {};
      const nodeName = params.nodeName || node.id;
      const nodeType = params.type || 'Text';
      
      return {
        nodeId: node.id,
        nodeName,
        type: nodeType,
        value: getDefaultValue(nodeType),
        required: true
      };
    });
    
    setInputFields(fields);
  }, [nodes]);

  const getDefaultValue = (type: string) => {
    switch (type) {
      case 'Text':
      case 'Formatted Text':
        return '';
      case 'Image':
      case 'Audio':
      case 'File':
        return null;
      case 'JSON':
        return '{}';
      default:
        return '';
    }
  };

  const updateInputValue = (nodeId: string, value: any) => {
    setInputFields(prev => 
      prev.map(field => 
        field.nodeId === nodeId ? { ...field, value } : field
      )
    );
  };

  const handleFileUpload = (nodeId: string, file: File | null) => {
    updateInputValue(nodeId, file);
  };

  const validateInputs = (): boolean => {
    return inputFields.every(field => {
      if (!field.required) return true;
      
      switch (field.type) {
        case 'Text':
        case 'Formatted Text':
          return typeof field.value === 'string' && field.value.trim() !== '';
        case 'Image':
        case 'Audio':
        case 'File':
          return field.value instanceof File;
        case 'JSON':
          try {
            JSON.parse(field.value);
            return true;
          } catch {
            return false;
          }
        default:
          return field.value !== null && field.value !== undefined && field.value !== '';
      }
    });
  };

  const executeWorkflow = async () => {
    if (!workflowId) {
      setExecutionError('No workflow ID provided');
      return;
    }

    if (!validateInputs()) {
      setExecutionError('Please fill in all required input fields');
      return;
    }

    setIsExecuting(true);
    setExecutionError(null);
    setExecutionResult(null);
    setExecutionStep('Preparing workflow...');

    try {
      // Prepare inputs for execution
      const inputs: Record<string, any> = {};
      
      inputFields.forEach(field => {
        // Use the node name as the key for better variable resolution
        const inputKey = field.nodeName;
        inputs[inputKey] = {
          value: field.value,
          type: field.type
        };
      });

      setExecutionStep('Executing workflow...');
      
      // Execute the workflow
      const result = await workflowService.executeWorkflow(workflowId, inputs, 'standard');
      
      setExecutionStep('Processing results...');
      
      // Process the results
      setExecutionResult(result);
      setExecutionStep('Completed');
      
    } catch (error) {
      console.error('Workflow execution error:', error);
      setExecutionError(error instanceof Error ? error.message : 'Unknown error occurred');
      setExecutionStep('Failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const resetExecution = () => {
    setExecutionResult(null);
    setExecutionError(null);
    setExecutionStep('');
    // Reset input values to defaults
    setInputFields(prev => 
      prev.map(field => ({
        ...field,
        value: getDefaultValue(field.type)
      }))
    );
  };

  const downloadResults = () => {
    if (!executionResult) return;
    
    const data = {
      execution_time: executionResult.execution_time,
      outputs: executionResult.outputs,
      execution_path: executionResult.execution_path,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderInputField = (field: InputField) => {
    const isValid = !field.required || (
      field.type === 'Text' || field.type === 'Formatted Text' 
        ? typeof field.value === 'string' && field.value.trim() !== ''
        : field.value !== null && field.value !== undefined
    );

    switch (field.type) {
      case 'Text':
      case 'Formatted Text':
        return (
          <textarea
            value={field.value || ''}
            onChange={(e) => updateInputValue(field.nodeId, e.target.value)}
            placeholder={`Enter ${field.type.toLowerCase()}...`}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none ${
              isValid 
                ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500' 
                : 'border-red-300 focus:border-red-500 focus:ring-red-500'
            }`}
            rows={3}
          />
        );
      
      case 'Image':
      case 'Audio':
      case 'File':
        return (
          <div className="space-y-2">
            <input
              type="file"
              accept={field.type === 'Image' ? 'image/*' : field.type === 'Audio' ? 'audio/*' : '*/*'}
              onChange={(e) => handleFileUpload(field.nodeId, e.target.files?.[0] || null)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none ${
                isValid 
                  ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500' 
                  : 'border-red-300 focus:border-red-500 focus:ring-red-500'
              }`}
            />
            {field.value && (
              <p className="text-sm text-gray-600">
                Selected: {field.value.name} ({(field.value.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        );
      
      case 'JSON':
        return (
          <textarea
            value={field.value || '{}'}
            onChange={(e) => updateInputValue(field.nodeId, e.target.value)}
            placeholder="Enter valid JSON..."
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none font-mono ${
              isValid 
                ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500' 
                : 'border-red-300 focus:border-red-500 focus:ring-red-500'
            }`}
            rows={4}
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={field.value || ''}
            onChange={(e) => updateInputValue(field.nodeId, e.target.value)}
            placeholder={`Enter ${field.type.toLowerCase()}...`}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none ${
              isValid 
                ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500' 
                : 'border-red-300 focus:border-red-500 focus:ring-red-500'
            }`}
          />
        );
    }
  };

  const renderExecutionResults = () => {
    if (!executionResult) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Execution Results</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Completed in {executionResult.execution_time.toFixed(2)}s
            </span>
            <button
              onClick={downloadResults}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
              title="Download Results"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Output Results */}
        <div className="space-y-3">
          {Object.entries(executionResult.outputs).map(([key, result]) => (
            <div key={key} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-800">{result.node_name || key}</h4>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    result.status === 'success' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {result.execution_time?.toFixed(3)}s
                  </span>
                </div>
              </div>
              
              {result.status === 'success' ? (
                <div className="bg-white rounded border p-3">
                  <div className="text-sm text-gray-600 mb-1">Output ({result.type}):</div>
                  <div className="text-gray-800 whitespace-pre-wrap">
                    {typeof result.output === 'string' 
                      ? result.output 
                      : JSON.stringify(result.output, null, 2)
                    }
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <div className="text-sm text-red-600 mb-1">Error:</div>
                  <div className="text-red-800">{result.error}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Execution Path */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Execution Path</h4>
          <div className="flex flex-wrap gap-2">
            {executionResult.execution_path.map((nodeId, index) => {
              const node = nodes.find(n => n.id === nodeId);
              const nodeName = node?.data?.params?.nodeName || nodeId;
              const nodeStatus = executionResult.node_results?.[nodeId]?.status || 'unknown';
              
              return (
                <div
                  key={nodeId}
                  className={`flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                    nodeStatus === 'success' 
                      ? 'bg-green-100 text-green-800' 
                      : nodeStatus === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <span className="mr-1">{index + 1}.</span>
                  {nodeName}
                  {nodeStatus === 'success' && <CheckCircle className="w-3 h-3 ml-1" />}
                  {nodeStatus === 'error' && <AlertCircle className="w-3 h-3 ml-1" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <Play className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Execute Workflow</h2>
            <p className="text-sm text-gray-600">
              {inputFields.length > 0 
                ? `Configure ${inputFields.length} input${inputFields.length !== 1 ? 's' : ''} and run your workflow`
                : 'No inputs required - ready to run'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {executionResult && (
            <button
              onClick={resetExecution}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!executionResult && !executionError && (
          <div className="space-y-6">
            {/* Input Fields */}
            {inputFields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Input Configuration</h3>
                {inputFields.map(field => (
                  <div key={field.nodeId} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.nodeName}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                      <span className="text-xs text-gray-500 ml-2">({field.type})</span>
                    </label>
                    {renderInputField(field)}
                  </div>
                ))}
              </div>
            )}

            {/* Workflow Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Workflow Overview</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">Nodes:</span>
                  <span className="ml-2 text-blue-800">{nodes.length}</span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Connections:</span>
                  <span className="ml-2 text-blue-800">{edges.length}</span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Inputs:</span>
                  <span className="ml-2 text-blue-800">{inputFields.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Execution Status */}
        {isExecuting && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Executing Workflow</h3>
            <p className="text-gray-600">{executionStep}</p>
          </div>
        )}

        {/* Execution Error */}
        {executionError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Execution Failed</h3>
                <p className="text-red-700">{executionError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Execution Results */}
        {executionResult && renderExecutionResults()}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          {executionResult && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              <span>Executed in {executionResult.execution_time.toFixed(2)}s</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
          >
            Close
          </button>
          
          {!executionResult && !isExecuting && (
            <button
              onClick={executeWorkflow}
              disabled={!validateInputs() || isExecuting}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                validateInputs() && !isExecuting
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Zap className="w-4 h-4 mr-2" />
              Execute Workflow
            </button>
          )}
          
          {isExecuting && (
            <button
              onClick={() => setIsExecuting(false)}
              className="flex items-center px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-md"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Execution
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecuteWorkflow;