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
      // Format inputs to match the API specification
      const formattedInputs: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(inputs)) {
        // If it's already in the right format, use it as is
        if (value && typeof value === 'object' && 'value' in value && 'type' in value) {
          formattedInputs[key] = value;
        } else {
          // Otherwise, create the proper format
          formattedInputs[key] = {
            value: value,
            type: typeof value === 'string' ? 'Text' : 
                 typeof value === 'object' && value instanceof File ? 'File' : 'Text'
          };
        }
      }
      
      console.log(`Executing workflow ${id} with inputs:`, formattedInputs);
      
      // For file uploads, use FormData
      const hasFiles = Object.values(formattedInputs).some(
        input => input.value instanceof File
      );
      
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
  }
};

export default workflowService; 