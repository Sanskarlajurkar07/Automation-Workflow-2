/**
 * Enhanced variable resolution utilities for frontend
 */

export interface NodeOutput {
  [key: string]: any;
}

export interface VariableContext {
  nodeOutputs: Record<string, NodeOutput>;
  nodeNameMap: Record<string, string>;
}

export interface VariableValidationResult {
  variable: string;
  isValid: boolean;
  suggestion?: string;
  nodeExists?: boolean;
  fieldExists?: boolean;
}

/**
 * Resolve variables in text using the format {{ nodeName.field }}
 */
export function resolveVariables(
  text: string, 
  context: VariableContext
): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Pattern to match {{ nodeName.field }} with optional whitespace
  const pattern = /\{\{\s*([^}]+)\s*\}\}/g;
  
  return text.replace(pattern, (match, variable) => {
    const trimmedVariable = variable.trim();
    
    // Split by dot to get node name and field
    let nodeName: string;
    let field: string;
    
    if (trimmedVariable.includes('.')) {
      [nodeName, field] = trimmedVariable.split('.', 2);
      nodeName = nodeName.trim();
      field = field.trim();
    } else {
      // If no field specified, assume 'output'
      nodeName = trimmedVariable;
      field = 'output';
    }
    
    // Try to find the node output
    const nodeOutput = findNodeOutput(nodeName, context);
    
    if (nodeOutput && typeof nodeOutput === 'object') {
      // Get the requested field
      if (field in nodeOutput) {
        const value = nodeOutput[field];
        return value !== null && value !== undefined ? String(value) : '';
      } else {
        // Try common field alternatives
        const alternatives = getFieldAlternatives(field);
        for (const alt of alternatives) {
          if (alt in nodeOutput) {
            const value = nodeOutput[alt];
            return value !== null && value !== undefined ? String(value) : '';
          }
        }
      }
    }
    
    // If variable couldn't be resolved, return the original placeholder
    console.warn(`Could not resolve variable: ${trimmedVariable}`);
    return match; // Return original {{ variable }}
  });
}

/**
 * Find node output by name or ID
 */
function findNodeOutput(
  nodeName: string, 
  context: VariableContext
): NodeOutput | null {
  const { nodeOutputs, nodeNameMap } = context;
  
  // First try direct node name lookup
  if (nodeName in nodeOutputs) {
    return nodeOutputs[nodeName];
  }
  
  // Try to find by node ID if node name lookup fails
  const nodeId = nodeNameMap[nodeName];
  if (nodeId && nodeId in nodeOutputs) {
    return nodeOutputs[nodeId];
  }
  
  // Try reverse lookup (in case nodeName is actually an ID)
  if (nodeName in nodeNameMap) {
    const mappedName = nodeNameMap[nodeName];
    if (mappedName in nodeOutputs) {
      return nodeOutputs[mappedName];
    }
  }
  
  return null;
}

/**
 * Get alternative field names for common field mappings
 */
function getFieldAlternatives(field: string): string[] {
  const alternatives: Record<string, string[]> = {
    'text': ['output', 'response', 'content'],
    'response': ['output', 'text', 'content'],
    'output': ['response', 'text', 'content', 'result'],
    'content': ['output', 'response', 'text'],
    'result': ['output', 'response', 'content']
  };
  
  return alternatives[field] || [];
}

/**
 * Standardize node output fields based on node type
 */
export function standardizeNodeOutput(nodeType: string, output: any): NodeOutput {
  if (!output || typeof output !== 'object') {
    return { output: output || '' };
  }
  
  const standardized = { ...output };
  
  // Ensure all nodes have an 'output' field
  if (!('output' in standardized)) {
    // Map common field names to 'output'
    if ('response' in standardized) {
      standardized.output = standardized.response;
    } else if ('text' in standardized) {
      standardized.output = standardized.text;
    } else if ('content' in standardized) {
      standardized.output = standardized.content;
    } else if ('result' in standardized) {
      standardized.output = standardized.result;
    } else {
      // Find the first string value
      for (const [key, value] of Object.entries(standardized)) {
        if (typeof value === 'string' && value) {
          standardized.output = value;
          break;
        }
      }
      
      // If still no output, set empty string
      if (!('output' in standardized)) {
        standardized.output = '';
      }
    }
  }
  
  // For AI nodes, ensure they have a 'response' field
  const aiNodeTypes = [
    'openai', 'anthropic', 'claude35', 'gemini', 'cohere', 
    'perplexity', 'xai', 'aws', 'azure'
  ];
  
  if (aiNodeTypes.includes(nodeType)) {
    if (!('response' in standardized)) {
      standardized.response = standardized.output;
    }
  }
  
  // For input nodes, ensure they have a 'text' field for backward compatibility
  if (nodeType === 'input') {
    if (!('text' in standardized)) {
      standardized.text = standardized.output;
    }
  }
  
  return standardized;
}

/**
 * Create a mapping between node IDs and their display names
 */
export function createNodeNameMap(nodes: any[]): Record<string, string> {
  const nodeNameMap: Record<string, string> = {};
  
  for (const node of nodes) {
    const nodeId = node.id;
    const nodeParams = node.data?.params || {};
    
    // Get the node name from params, or generate a default
    let nodeName = nodeParams.nodeName;
    if (!nodeName) {
      // Generate default name based on type and ID
      const nodeType = node.type;
      if (nodeId.startsWith(`${nodeType}_`)) {
        nodeName = nodeId;
      } else {
        // Extract index from ID if possible
        const parts = nodeId.split('-');
        const index = parts.length > 1 ? parts[parts.length - 1] : '0';
        nodeName = `${nodeType}_${index}`;
      }
    }
    
    // Map both directions for lookups
    nodeNameMap[nodeId] = nodeName;
    nodeNameMap[nodeName] = nodeId;
  }
  
  return nodeNameMap;
}

/**
 * Validate that all variables in text can be resolved
 */
export function validateVariables(
  text: string, 
  context: VariableContext
): VariableValidationResult[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const pattern = /\{\{\s*([^}]+)\s*\}\}/g;
  const matches = [...text.matchAll(pattern)];
  const validationResults: VariableValidationResult[] = [];
  
  for (const match of matches) {
    const variable = match[1].trim();
    const [nodeName, field = 'output'] = variable.includes('.') 
      ? variable.split('.', 2) 
      : [variable, 'output'];
    
    // Check if node exists
    const nodeOutput = findNodeOutput(nodeName.trim(), context);
    const nodeExists = nodeOutput !== null;
    
    // Check if field exists
    let fieldExists = false;
    if (nodeOutput && typeof nodeOutput === 'object') {
      fieldExists = field.trim() in nodeOutput || 
        getFieldAlternatives(field.trim()).some(alt => alt in nodeOutput);
    }
    
    const isValid = nodeExists && fieldExists;
    
    let suggestion = undefined;
    if (!isValid && nodeOutput) {
      // Suggest available fields
      const availableFields = Object.keys(nodeOutput);
      if (availableFields.length > 0) {
        suggestion = `${nodeName}.${availableFields[0]}`;
      }
    }
    
    validationResults.push({
      variable,
      isValid,
      suggestion,
      nodeExists,
      fieldExists
    });
  }
  
  return validationResults;
}

/**
 * Get available variables from nodes
 */
export function getAvailableVariables(nodes: any[]): Array<{
  nodeId: string;
  nodeName: string;
  nodeType: string;
  fields: Array<{name: string, type: string, description: string}>;
}> {
  return nodes.map(node => {
    const nodeId = node.id;
    const nodeName = node.data?.params?.nodeName || nodeId;
    const nodeType = node.type;
    
    // Define fields based on node type
    let fields: Array<{name: string, type: string, description: string}> = [];
    
    switch (nodeType) {
      case 'input':
        fields = [
          { name: 'output', type: 'Text', description: 'User input text' },
          { name: 'text', type: 'Text', description: 'User input text (legacy)' }
        ];
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
        fields = [
          { name: 'response', type: 'Text', description: 'AI model response' },
          { name: 'output', type: 'Text', description: 'AI model output' },
          { name: 'model', type: 'Text', description: 'Model name used' },
          { name: 'input_tokens', type: 'Number', description: 'Input tokens consumed' },
          { name: 'output_tokens', type: 'Number', description: 'Output tokens generated' }
        ];
        break;
      
      case 'transform':
      case 'scripts':
        fields = [
          { name: 'output', type: 'Text', description: 'Transformed text' },
          { name: 'transformed_text', type: 'Text', description: 'Transformed text (legacy)' }
        ];
        break;
      
      case 'document-to-text':
        fields = [
          { name: 'output', type: 'Text', description: 'Extracted text from document' }
        ];
        break;
      
      case 'kb-search':
        fields = [
          { name: 'results', type: 'Array', description: 'Search results' },
          { name: 'output', type: 'Text', description: 'Formatted results' },
          { name: 'metadata', type: 'Object', description: 'Search metadata' }
        ];
        break;
      
      default:
        fields = [
          { name: 'output', type: 'Text', description: 'Node output' }
        ];
    }
    
    return {
      nodeId,
      nodeName,
      nodeType,
      fields
    };
  });
}

export default {
  resolveVariables,
  standardizeNodeOutput,
  createNodeNameMap,
  validateVariables,
  getAvailableVariables
};