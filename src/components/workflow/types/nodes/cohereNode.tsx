@@ .. @@
         {/* Main Prompt */}
         <div className="space-y-2">
           <div
             className="flex items-center justify-between cursor-pointer"
             onClick={() => toggleSectionExpand('prompt')}
           >
             <label className="block text-sm font-medium text-gray-700 flex items-center">
               <Zap className="w-4 h-4 mr-2 text-yellow-500" />
               <span>Prompt</span>
             </label>
             <button className="text-gray-400">
               {expandedSections.prompt ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
             </button>
           </div>
           
           {expandedSections.prompt && (
             <div className="pt-2 space-y-2">
+              {/* Insert Variable Button */}
+              <div className="flex justify-end mb-2">
+                <button
+                  type="button"
+                  onClick={() => {
+                    const connectedNodes = getConnectedNodes();
+                    if (connectedNodes.length > 0) {
+                      const firstNode = connectedNodes[0] as any;
+                      const parts = firstNode.id.split('-');
+                      const index = parts.length > 1 ? parts[parts.length - 1] : '0';
+                      const nodeName = firstNode.data.params?.nodeName || `${firstNode.type}_${index}`;
+                      const fieldName = firstNode.type === 'input' ? 'text' : 'response';
+                      const currentPrompt = data.params?.prompt || '';
+                      updateNodeData(id, { 
+                        prompt: currentPrompt + (currentPrompt ? ' ' : '') + `{{ ${nodeName}.${fieldName} }}`
+                      });
+                    }
+                  }}
+                  className="px-3 py-1.5 bg-yellow-500 text-white text-xs font-medium rounded-md hover:bg-yellow-600 transition-colors"
+                >
+                  Insert Variable
+                </button>
+              </div>
+              
               <div className="relative">
                 <AutocompleteInput
                   value={data.params?.prompt || ''}
                   onChange={(value) => updateNodeData(id, { prompt: value })}
-                  placeholder="Enter your prompt here... Use variables from other nodes"
+                  placeholder="Type '{{' to utilize variables E.g., Question: {{ input_0.text }}"
                   multiline={true}
                   rows={5}
                 />
               </div>