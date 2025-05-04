import React, { useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { NodePanel } from './NodePanel';
import { FlowCanvas } from './FlowCanvas';
import { ErrorBoundary } from '../ErrorBoundary';
import { NodeCategory, FlowNode, FlowEdge } from '../../types/flow';
import { useParams } from 'react-router-dom';
import api from '../../lib/axios';
import workflowService from '../../lib/workflowService';
import { Workflow } from '../../types/workflow';
import { useTheme } from '../../utils/themeProvider';

// Helper function to convert backend node data to FlowNode format
const mapToFlowNode = (node: any): FlowNode => {
  return {
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      label: node.data?.label || node.type,
      type: node.data?.type || node.type,
      params: node.data?.params || {},
      ...node.data
    },
  };
};

// Helper function to convert backend edge data to FlowEdge format
const mapToFlowEdge = (edge: any): FlowEdge => {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type || 'smoothstep',
    animated: edge.animated ?? true,
    data: edge.data || {},
    markerEnd: edge.markerEnd || { type: 'arrowclosed' },
  };
};

export const WorkflowBuilder = () => {
  const { id } = useParams(); // Get workflow ID from URL param
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<NodeCategory>('general');
  const [workflowData, setWorkflowData] = useState<Workflow | null>(null);
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>([]);
  const [flowEdges, setFlowEdges] = useState<FlowEdge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const categoryMap: Record<string, NodeCategory> = {
    'Core Settings': 'general',
    'AI Models': 'llms',
    'Smart Database': 'knowledge-base',
    'Connected Apps': 'integrations',
    'Data Import': 'data-loaders',
    'Mixed Modal': 'multi-modal',
    'Workflow Rules': 'logic',
    'AI Tools & SparkLayer': 'ai-tools'
  };

  // Load workflow data when component mounts or ID changes
  useEffect(() => {
    if (id) {
      fetchWorkflowData(id);
    }
  }, [id]);

  const fetchWorkflowData = async (workflowId: string) => {
    try {
      setIsLoading(true);
      // Use the workflowService instead of direct API call
      const response = await workflowService.getWorkflow(workflowId);
      setWorkflowData(response);
      
      // Convert backend data to FlowNode/FlowEdge format
      if (response.nodes && Array.isArray(response.nodes)) {
        setFlowNodes(response.nodes.map(mapToFlowNode));
      }
      
      if (response.edges && Array.isArray(response.edges)) {
        setFlowEdges(response.edges.map(mapToFlowEdge));
      }
      
      // Set document title to workflow name for better UX
      if (response.name) {
        document.title = response.name;
      }
    } catch (err) {
      setError('Failed to load workflow data');
      console.error('Error loading workflow:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex h-screen items-center justify-center ${
        isLight 
          ? 'bg-theme-white'
          : 'bg-theme-dark'
      }`}>
        <div className="text-center p-8">
          <div className={`w-16 h-16 border-4 ${
            isLight
              ? 'border-t-theme-medium border-theme-light'
              : 'border-t-theme-medium border-theme-medium-dark/30'
          } rounded-full animate-spin mx-auto mb-6`}></div>
          <h2 className={`text-xl font-semibold ${isLight ? 'text-theme-dark' : 'text-theme-white'} mb-2`}>Loading Workflow</h2>
          <p className={`${isLight ? 'text-theme-medium-dark' : 'text-theme-light'}`}>Preparing your canvas and components...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex h-screen items-center justify-center ${
        isLight 
          ? 'bg-theme-white'
          : 'bg-theme-dark'
      }`}>
        <div className={`text-center p-8 max-w-md ${
          isLight 
            ? 'bg-theme-white border-red-100'
            : 'bg-theme-dark/80 border-rose-500/30'
        } rounded-xl border`}>
          <div className={`w-16 h-16 mx-auto mb-6 rounded-full ${
            isLight 
              ? 'bg-red-50 flex items-center justify-center'
              : 'bg-rose-500/10 flex items-center justify-center'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${isLight ? 'text-red-500' : 'text-rose-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className={`text-xl font-semibold ${isLight ? 'text-theme-dark' : 'text-theme-white'} mb-4`}>Error Loading Workflow</h2>
          <p className={`${
            isLight 
              ? 'text-red-600 mb-6 bg-red-50 p-3 rounded-lg border border-red-100'
              : 'text-rose-400 mb-6 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20'
          }`}>{error}</p>
          <button
            onClick={() => window.history.back()}
            className={`px-5 py-2.5 ${
              isLight 
                ? 'bg-theme-medium text-theme-white hover:bg-theme-medium-dark'
                : 'bg-theme-medium text-theme-white hover:bg-theme-medium-dark'
            } rounded-lg transition-colors`}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      isLight 
        ? 'bg-theme-white'
        : 'bg-theme-dark'
    }`}>
      <Navigation
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onSearch={setSearchQuery}
        workflowName={workflowData?.name || 'New Workflow'}
        workflowId={id}
      />
      <div className="flex h-[calc(100vh-132px)]">
        <div className={`w-64 border-r ${
          isLight 
            ? 'border-theme-light bg-theme-light/70 backdrop-blur-sm'
            : 'border-theme-medium-dark/30 bg-theme-dark/80 backdrop-blur-sm'
        } overflow-y-auto`}>
          <ErrorBoundary>
            <NodePanel
              category={activeCategory}
              searchQuery={searchQuery}
              onDragStart={(event, nodeType) => {
                event.dataTransfer.setData('application/reactflow', nodeType);
                event.dataTransfer.effectAllowed = 'move';
              }}
            />
          </ErrorBoundary>
        </div>
        <div className="flex-1">
          <FlowCanvas 
            workflowId={id} 
            initialNodes={flowNodes} 
            initialEdges={flowEdges} 
          />
        </div>
      </div>
    </div>
  );
};