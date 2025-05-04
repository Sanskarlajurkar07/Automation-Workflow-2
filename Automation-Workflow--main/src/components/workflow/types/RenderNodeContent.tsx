import React from 'react';

interface RenderNodeContentProps {
  type: string;
  data: any;
  id: string;
  updateNodeData: (id: string, params: any) => void;
  removeNode: (id: string) => void;
}

const RenderNodeContent: React.FC<RenderNodeContentProps> = ({ type, data, id, updateNodeData, removeNode }) => {
  // This will be populated with actual node components later
  return (
    <div className="p-4">
      <p className="text-sm text-gray-500">Node type: {type}</p>
      <p className="text-sm text-gray-500">Node ID: {id}</p>
    </div>
  );
};

export default RenderNodeContent;