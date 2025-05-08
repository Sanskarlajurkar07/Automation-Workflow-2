import api from './axios';
import { Workflow, WorkflowCreate, WorkflowUpdate } from '../types/workflow';

export const workflowService = {
  // Get all workflows
  getWorkflows: async (): Promise<Workflow[]> => {
    try {
      const response = await api.get('/workflows');
      return response.data;
    } catch (error) {
      console.error('Error fetching workflows:', error);
      throw error;
    }
  },

  // Get a single workflow
  getWorkflow: async (id: string): Promise<Workflow> => {
    try {
      const response = await api.get(`/workflows/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching workflow ${id}:`, error);
      throw error;
    }
  },

  // Create a new workflow
  createWorkflow: async (workflow: WorkflowCreate): Promise<Workflow> => {
    try {
      const response = await api.post('/workflows', workflow);
      return response.data;
    } catch (error) {
      console.error('Error creating workflow:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Status:', error.response.status);
      }
      throw error;
    }
  },

  // Update a workflow
  updateWorkflow: async (id: string, workflow: WorkflowUpdate): Promise<Workflow> => {
    try {
      console.log('Updating workflow with data:', JSON.stringify(workflow, null, 2));
      const response = await api.put(`/workflows/${id}`, workflow);
      return response.data;
    } catch (error) {
      console.error(`Error updating workflow ${id}:`, error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Status:', error.response.status);
      }
      throw error;
    }
  },

  // Delete a workflow
  deleteWorkflow: async (id: string): Promise<void> => {
    try {
      await api.delete(`/workflows/${id}`);
    } catch (error) {
      console.error(`Error deleting workflow ${id}:`, error);
      throw error;
    }
  },

  // Clone a workflow
  cloneWorkflow: async (id: string): Promise<Workflow> => {
    try {
      const response = await api.post(`/workflows/${id}/clone`);
      return response.data;
    } catch (error) {
      console.error(`Error cloning workflow ${id}:`, error);
      throw error;
    }
  },

  // Export a workflow
  exportWorkflow: async (id: string): Promise<any> => {
    try {
      const response = await api.get(`/workflows/${id}/export`);
      return response.data;
    } catch (error) {
      console.error(`Error exporting workflow ${id}:`, error);
      throw error;
    }
  },
  
  // Execute a workflow
  executeWorkflow: async (id: string, inputs: Record<string, any>, mode: string = 'standard'): Promise<any> => {
    try {
      console.log('Executing workflow with inputs:', inputs);
      
      // Format inputs for API
      const formattedInputs: Record<string, any> = {};
      let hasFiles = false;
      
      for (const [key, inputValue] of Object.entries(inputs)) {
        // Check if we're dealing with a file
        if (inputValue.value instanceof File) {
          hasFiles = true;
        }
        
        // Store formatted input
        formattedInputs[key] = {
          value: inputValue.value,
          type: inputValue.type || 'Text'
        };
        
        // Debug log to help identify input value issues
        console.log(`Formatted input ${key}: type=${inputValue.type}, value=`, 
          typeof inputValue.value === 'string' && inputValue.value.length > 100 
            ? `${inputValue.value.substring(0, 100)}...` 
            : inputValue.value);
      }
      
      let response;
      
      if (hasFiles) {
        // If we have files, use FormData to handle multipart/form-data
        const formData = new FormData();
        
        // Add workflow execution parameters
        formData.append('mode', mode);
        
        // Process each input
        for (const [key, input] of Object.entries(formattedInputs)) {
          if (input.value instanceof File) {
            // Add the file to form data
            formData.append(`file_${key}`, input.value);
            // Add file metadata
            formData.append(`${key}_type`, input.type);
          } else {
            // For non-file inputs, stringify the value
            formData.append(`${key}_value`, typeof input.value === 'object' 
              ? JSON.stringify(input.value) 
              : String(input.value));
            formData.append(`${key}_type`, input.type);
          }
        }
        
        // Send the form data
        response = await api.post(`/workflows/${id}/execute`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Standard JSON request for non-file inputs
        response = await api.post(`/workflows/${id}/execute`, {
          inputs: formattedInputs,
          mode: mode
        });
      }
      
      const executionResult = response.data;
      
      // Log execution details
      console.log(`Workflow execution completed in ${executionResult.execution_time.toFixed(2)}s`);
      console.log(`Execution ID: ${executionResult.execution_id || 'Not available'}`);
      
      if (executionResult.status === 'error') {
        throw new Error(executionResult.error || 'Unknown error during workflow execution');
      }
      
      return executionResult;
    } catch (error) {
      console.error(`Error executing workflow ${id}:`, error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Status:', error.response.status);
      }
      throw error;
    }
  },

  // Add the function to fix input types
  fixInputTypes: async function(workflowId: string): Promise<any> {
    try {
      const response = await api.post(`/workflows/${workflowId}/fix_input_types`);
      return response.data;
    } catch (error) {
      console.error('Error fixing input types:', error);
      throw error;
    }
  }
};

export default workflowService; 