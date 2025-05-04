import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Trash2, Maximize2, Settings } from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';
import RenderNodeContent from './types/RenderNodeContent';

interface BaseNodeProps extends NodeProps {
  icon?: React.ReactNode;
  inputs?: string[];
  outputs?: string[];
}

export const BaseNode = memo(({ data, id, selected, icon: Icon, inputs = [], outputs = [] }: BaseNodeProps) => {
  const removeNode = useFlowStore((state) => state.removeNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeParams);

  const renderInputHandles = () => {
    return inputs.map((input, index) => (
      <Handle
        key={`input-${index}`}
        type="target"
        position={Position.Left}
        id={input}
        className={`w-2.5 h-2.5 border-2 rounded-full transition-all ${
          selected 
            ? 'bg-blue-400 border-blue-600' 
            : 'bg-slate-400 border-slate-600'
        }`}
        style={{ left: -8, top: `${50 + index * 20}%`, transform: 'translateY(-50%)' }}
      />
    ));
  };

  const renderOutputHandles = () => (
    <Handle
      type="source"
      position={Position.Right}
      id="output"
      className={`w-2.5 h-2.5 border-2 rounded-full transition-all ${
        selected 
          ? 'bg-emerald-400 border-emerald-600' 
          : 'bg-blue-400 border-blue-600'
      }`}
      style={{ right: -8, top: '50%' }}
    />
  );

  return (
    <div
      className={`relative backdrop-blur-sm rounded-lg shadow-xl transition-all ${
        selected 
          ? 'bg-slate-800/70 border-2 border-blue-500/70 shadow-blue-900/20' 
          : 'bg-slate-800/60 border border-slate-700/70'
      }`}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {Icon && (
              <div className={`p-1.5 rounded-md ${selected ? 'bg-blue-600/30 text-blue-300' : 'bg-blue-500/20 text-blue-400'}`}>
                {Icon}
              </div>
            )}
            <div className="text-sm font-medium text-white">{data?.params?.nodeName || data.label}</div>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => console.log('Expand node')}
              className="p-1 text-slate-400 hover:text-white transition-colors rounded-md hover:bg-slate-700/50"
              title="Expand Node"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => console.log('Configure node')}
              className="p-1 text-slate-400 hover:text-white transition-colors rounded-md hover:bg-slate-700/50"
              title="Configure Node"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => removeNode(id)}
              className="p-1 text-slate-400 hover:text-rose-400 transition-colors rounded-md hover:bg-rose-500/10"
              title="Delete Node"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className={`rounded-md p-2 ${selected ? 'bg-slate-700/70' : 'bg-slate-700/50'}`}>
          <RenderNodeContent
            type={data.type}
            data={data}
            id={id}
            updateNodeData={updateNodeData}
            removeNode={removeNode}
          />
        </div>
      </div>

      {renderInputHandles()}
      {renderOutputHandles()}
    </div>
  );
});

BaseNode.displayName = 'BaseNode';