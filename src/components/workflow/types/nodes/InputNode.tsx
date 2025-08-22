@@ .. @@
+import React, { useEffect } from 'react';
 import { Handle, Position } from 'reactflow';
 import { Trash2, Settings } from 'lucide-react';
 import { useFlowStore } from '../../../../store/flowStore';
 
 interface InputNodeProps {
   id: string;
   data: {
     params?: {
       fieldName?: string;
       type?: string;
       showSettings?: boolean;
+      nodeName?: string;
     };
   };
   selected?: boolean;
 }
 
 const InputNode: React.FC<InputNodeProps> = ({ id, data, selected }) => {
   const removeNode = useFlowStore((state) => state.removeNode);
   const updateNodeData = useFlowStore((state) => state.updateNodeData);
 
+  // Set default node name if not set
+  useEffect(() => {
+    if (!data.params?.nodeName) {
+      const parts = id.split('-');
+      const index = parts.length > 1 ? parts[parts.length - 1] : '0';
+      updateNodeData(id, { nodeName: `input_${index}` });
+    }
+  }, [id, data.params?.nodeName, updateNodeData]);
+
   const handleDelete = () => {
     removeNode(id);
   };
 
   const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
     updateNodeData(id, { type: e.target.value });
   };
 
-  const variableName = data.params?.fieldName || id.replace('input-', 'input_');
+  const variableName = data.params?.nodeName || data.params?.fieldName || `input_${id.split('-').pop() || '0'}`;
 
   return (
-    <div
-      className={`relative bg-white rounded-lg shadow-md border-2 ${
+    <div className={`bg-white rounded-lg shadow-lg overflow-hidden w-[320px] ${
         selected ? 'border-blue-500' : 'border-gray-200'
-      }`}
-    >
-      <div className="p-4">
-        {/* Header */}
-        <div className="flex items-center justify-between mb-2">
-          <div className="text-sm font-medium text-gray-900">Input</div>
-          <button
-            onClick={handleDelete}
-            className="text-gray-400 hover:text-red-500"
-            title="Delete"
-          >
-            <Trash2 className="w-4 h-4" />
-          </button>
+      }`}>
+      {/* Header */}
+      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3">
+        <div className="flex items-center justify-between">
+          <div className="flex items-center space-x-3">
+            <div className="p-1 bg-white/20 backdrop-blur-sm rounded-lg w-9 h-9 flex items-center justify-center">
+              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
+                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
+              </svg>
+            </div>
+            <div>
+              <h3 className="font-medium text-white">Input Node</h3>
+              <p className="text-xs text-blue-50/80">{variableName}</p>
+            </div>
+          </div>
+          <div className="flex items-center space-x-2">
+            <button
+              onClick={() => updateNodeData(id, { showSettings: !data.params?.showSettings })}
+              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
+              title="Settings"
+            >
+              <Settings className="w-4 h-4" />
+            </button>
+            <button
+              onClick={handleDelete}
+              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-red-400/20 transition-colors"
+              title="Delete"
+            >
+              <Trash2 className="w-4 h-4" />
+            </button>
+          </div>
         </div>
+      </div>
 
-        {/* Variable Name */}
-        <div className="mb-3">
+      {/* Content */}
+      <div className="p-4 space-y-4">
+        {/* Node Name */}
+        <div className="space-y-2">
+          <label className="block text-xs font-medium text-gray-500">Node Name</label>
+          <input
+            type="text"
+            value={variableName}
+            onChange={(e) => updateNodeData(id, { nodeName: e.target.value })}
+            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
+          />
+        </div>
+
+        {/* Variable Reference */}
+        <div className="space-y-2">
           <label className="block text-xs text-gray-500 mb-1">Variable Name</label>
-          <input
-            type="text"
-            value={variableName}
-            readOnly
-            className="w-full text-sm border border-gray-200 rounded px-2 py-1 bg-gray-50"
-          />
+          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
+            <code className="text-sm font-mono text-blue-800">
+              {'{{ '}{variableName}{'.text }}'}
+            </code>
+            <p className="text-xs text-blue-600 mt-1">Use this variable in other nodes</p>
+          </div>
         </div>
 
         {/* Type Dropdown */}
-        <div>
+        <div className="space-y-2">
           <label className="block text-xs text-gray-500 mb-1">Type</label>
           <select
             value={data.params?.type || 'Text'}
             onChange={handleTypeChange}
-            className="w-full text-sm border border-gray-200 rounded px-2 py-1"
+            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
           >
             <option value="Text">Text</option>
             <option value="Image">Image</option>
             <option value="Formatted Text">Formatted Text</option>
             <option value="Audio">Audio</option>
             <option value="JSON">JSON</option>
             <option value="File">File</option>
           </select>
         </div>
+
+        {/* Info Card */}
+        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
+          <p className="text-xs text-gray-600">
+            This input will be available as <code className="px-1 py-0.5 bg-gray-200 rounded font-mono">{'{{ '}{variableName}{'.text }}'}</code> in connected nodes.
+          </p>
+        </div>
       </div>
 
       {/* Handle */}
       <Handle
         type="source"
         position={Position.Right}
-        className="w-3 h-3 bg-blue-500 border-2 border-white rounded-full"
-        style={{ right: -6 }}
+        className="w-3 h-3 -mr-0.5 bg-blue-500 border-2 border-white rounded-full"
+        style={{ top: '50%' }}
       />
     </div>
   );
 };
 
 export default InputNode;