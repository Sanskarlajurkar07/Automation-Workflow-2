const removeNode = useFlowStore((state) => state.removeNode);
const updateNodeData = useFlowStore((state) => state.updateNodeData);
const [showApiKey, setShowApiKey] = useState(false);
const { nodes, edges } = useFlowStore();

const getConnectedNodes = () => {
  return edges
    .filter(edge => edge.target === id)
    .map(edge => edge.source)
    .map(sourceId => nodes.find(node => node.id === sourceId))
    .filter(Boolean);
};