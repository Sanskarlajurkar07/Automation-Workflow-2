import { create } from 'zustand';
import { 
  Connection, 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges,
  MarkerType,
} from 'reactflow';
import { FlowNode, FlowEdge, NodeType } from '../types/flow';
import type { Template } from '../types/template';

interface FlowState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  nodeCounters: Record<string, number>;
  selectedNode: FlowNode | null;
  selectedTemplate: Template | null;
  workflowName: string;
  workflowId: string | null;
  saveStatus: 'unsaved' | 'saving' | 'saved';
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: Connection) => void;
  updateNodeParams: (nodeId: string, params: any) => void;
  updateNodeResults: (nodeId: string, results: any) => void;
  loadTemplate: (template: Template) => void;
  getNextNodeId: (type: NodeType) => string;
  removeNode: (nodeId: string) => void;
  setSelectedNode: (node: FlowNode | null) => void;
  clearWorkflow: () => void;
  setEdges: (updater: (edges: FlowEdge[]) => FlowEdge[]) => void; // Add setEdges
  setNodes: (nodes: FlowNode[]) => void; // Add setNodes function
  updateNodeData: (id: string, params: any) => void; // Add updateNodeData
  addNode: (type: NodeType, position: { x: number; y: number }) => FlowNode;
  setWorkflowName: (name: string) => void;
  setWorkflowId: (id: string | null) => void;
  setSaveStatus: (status: 'unsaved' | 'saving' | 'saved') => void;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  nodeCounters: {},
  selectedNode: null,
  selectedTemplate: null,
  workflowName: '',
  workflowId: null,
  saveStatus: 'unsaved',

  getNextNodeId: (type: NodeType) => {
    const state = get();
    const counter = state.nodeCounters[type] || 0;
    set({ nodeCounters: { ...state.nodeCounters, [type]: counter + 1 } });
    return `${type}_${counter}`;
  },

  addNode: (type: NodeType, position: { x: number; y: number }) => {
    const nodeId = get().getNextNodeId(type);
    const newNode: FlowNode = {
      id: nodeId,
      type,
      position,
      data: {
        label: type,
        type,
        params: {
          nodeName: nodeId
        }
      }
    };

    set((state) => ({
      nodes: [...state.nodes, newNode]
    }));
    
    return newNode;
  },

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    const newEdge = {
      ...connection,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed },
      animated: true,
    };
    set({
      edges: addEdge(newEdge, get().edges),
    });
  },

  updateNodeParams: (nodeId, params) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              params: {
                ...node.data.params,
                ...params,
              },
            },
          };
        }
        return node;
      }),
    });
  },

  updateNodeResults: (nodeId, results) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              results,
            },
          };
        }
        return node;
      }),
    });
  },

  loadTemplate: (template) => {
    set({
      nodes: template.nodes,
      edges: template.edges,
      selectedTemplate: template,
    });
  },

  removeNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
    }));
  },

  setSelectedNode: (node) => {
    set({ selectedNode: node });
  },

  clearWorkflow: () => {
    console.log('CLEARING WORKFLOW STATE', new Date().toISOString(), 'Resetting all node state');
    
    // Get current state - for debugging
    const before = {
      nodeCount: get().nodes.length,
      edgeCount: get().edges.length,
      selectedNode: get().selectedNode?.id || 'none',
      workflowId: get().workflowId || 'none',
      counters: { ...get().nodeCounters }
    };
    console.log('State before clearing:', before);
    
    // Complete state reset - this is critical to ensure clean workflow separation
    set({
      nodes: [],
      edges: [],
      nodeCounters: {}, // Reset node counters to avoid ID conflicts between workflows
      selectedNode: null,
      selectedTemplate: null,
      workflowName: '',
      workflowId: null,
      saveStatus: 'unsaved'
    });
    
    // Verify the reset was successful - for debugging
    const after = {
      nodeCount: get().nodes.length,
      edgeCount: get().edges.length,
      nodeCounters: get().nodeCounters,
      workflowId: get().workflowId
    };
    console.log('State after clearing:', after);
  },

  setEdges: (updater) => {
    set({
      edges: updater(get().edges),
    });
  },

  setNodes: (nodes) => {
    set({ nodes });
  },

  updateNodeData: (id, params) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, params: { ...node.data.params, ...params } } }
          : node
      ),
    }));
  },

  setWorkflowName: (name: string) => set({ workflowName: name }),
  setWorkflowId: (id: string | null) => set({ workflowId: id }),
  setSaveStatus: (status: 'unsaved' | 'saving' | 'saved') => set({ saveStatus: status }),
}));