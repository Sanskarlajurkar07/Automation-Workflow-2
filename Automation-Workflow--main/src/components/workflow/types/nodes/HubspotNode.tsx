import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Settings, Trash2, Copy, ChevronRight } from 'lucide-react';
import { useFlowStore } from '../../../../store/flowStore';

interface HubspotNodeData {
  params?: {
    nodeName?: string;
    action?: 
      'fetch-contacts' | 'fetch-companies' | 'fetch-deals' | 'fetch-tickets' | 'fetch-notes' | 'fetch-calls' |
      'create-contact' | 'create-deal' | 'create-ticket' | 'create-note' | 'create-call' | 'create-task' |
      'fetch-tasks' | 'fetch-meetings' | 'fetch-emails' | 'create-meeting' | 'create-email';
    objectId?: string;
    properties?: string;
    oauthToken?: string;
    showSettings?: boolean;
  };
}

const HubspotNode: React.FC<NodeProps<HubspotNodeData>> = ({ id, data, selected }) => {
  const [currentStep, setCurrentStep] = useState(1); // Step tracker for configuration
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleActionChange = (action: HubspotNodeData['params']['action']) => {
    updateNodeData(id, { action });
    setCurrentStep(2); // Move to the next step
  };

  const handleOAuthConnect = () => {
    // Simulate OAuth 2.0 connection
    updateNodeData(id, { oauthToken: 'mock-oauth-token' });
    setCurrentStep(3); // Move to the final step
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${
      selected ? 'ring-2 ring-orange-500' : 'border border-gray-200'
    }`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <img src="/path/to/hubspot-icon.png" alt="HubSpot" className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-white">HubSpot</h3>
              <p className="text-xs text-orange-50/80">{data.params?.nodeName || 'hubspot_1'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigator.clipboard.writeText(id)}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              title="Copy Node ID"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateNodeData(id, { showSettings: !data.params?.showSettings })}
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
        {currentStep === 1 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Select an action</h4>
            <div className="space-y-2">
              <button
                onClick={() => handleActionChange('fetch-contacts')}
                className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">Fetch Contacts</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={() => handleActionChange('create-contact')}
                className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">Create Contact</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              {/* Add more actions as needed */}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Connect your HubSpot account</h4>
            <button
              onClick={handleOAuthConnect}
              className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Connect with HubSpot
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            {data.params?.action === 'fetch-contacts' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Properties</label>
                <textarea
                  value={data.params?.properties || ''}
                  onChange={(e) => updateNodeData(id, { properties: e.target.value })}
                  placeholder="Enter properties to fetch (comma-separated)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  rows={4}
                />
              </div>
            )}

            {data.params?.action === 'create-contact' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Details</label>
                <textarea
                  value={data.params?.properties || ''}
                  onChange={(e) => updateNodeData(id, { properties: e.target.value })}
                  placeholder="Enter contact details as JSON"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  rows={4}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 -ml-0.5 bg-orange-500 border-2 border-white rounded-full"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 -mr-0.5 bg-orange-500 border-2 border-white rounded-full"
      />
    </div>
  );
};

export default HubspotNode;