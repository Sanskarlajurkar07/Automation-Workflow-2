@@ .. @@
         {/* Main Prompt Area - Enhanced UI */}
         <div className="space-y-2 relative mt-4">
          {/* Connected Input Nodes Warning */}
          {getConnectedNodes().length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-800">You are not using any of the connected input nodes:</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {getConnectedNodes().map((node: any) => {
                      const parts = node.id.split('-');
                      const index = parts.length > 1 ? parts[parts.length - 1] : '0';
                      const nodeName = node.data.params?.nodeName || `${node.type}_${index}`;
                      return (
                        <span key={node.id} className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs">
                          {nodeName} ×
                        </span>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-xs text-orange-700">
                    <span className="font-medium">Drag a variable field</span> from the above into input area or type <span className="font-mono bg-orange-100 px-1 rounded">"&#123;&#123;"</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
           <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-md border border-purple-200 shadow-sm">
             <div className="flex items-center justify-between mb-2">
               <label className="text-sm font-medium text-purple-700 flex items-center">
                 <Zap className="w-4 h-4 mr-1.5 text-purple-600" />
                 <span>Craft your prompt</span>
               </label>
               
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const connectedNodes = getConnectedNodes();
                    if (connectedNodes.length > 0) {
                      const firstNode = connectedNodes[0] as any;
                      const parts = firstNode.id.split('-');
                      const index = parts.length > 1 ? parts[parts.length - 1] : '0';
                      const nodeName = firstNode.data.params?.nodeName || `${firstNode.type}_${index}`;
                      const fieldName = firstNode.type === 'input' ? 'text' : 'response';
                      const currentPrompt = data.params?.prompt || data.prompt || '';
                      updateNodeData(id, { 
                        prompt: currentPrompt + (currentPrompt ? ' ' : '') + `{{ ${nodeName}.${fieldName} }}`
                      });
                    }
                  }}
                  className="px-3 py-1.5 bg-purple-500 text-white text-xs font-medium rounded-md hover:bg-purple-600 transition-colors"
                >
                  Insert Variable
                </button>
                 <span className="text-xs text-purple-600 font-medium">
                   {(data.params?.prompt || data.prompt) ? `${(data.params?.prompt || data.prompt || '').length} chars` : ''}
                 </span>
             <div className="relative rounded-md overflow-hidden mb-3 transition-all duration-200 border-2 border-purple-300 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/30">
               <AutocompleteInput
                 value={data.params?.prompt || data.prompt || ''}
                 onChange={(value) => updateNodeData(id, { prompt: value })}
                placeholder="Type '{{' to utilize variables E.g., Question: {{ input_0.text }}"
                 multiline={true}
                 rows={6}
                 className="bg-white border-none shadow-none text-gray-800 focus:ring-0 resize-none"
               />
             </div>