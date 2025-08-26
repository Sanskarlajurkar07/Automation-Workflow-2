{/* Output Variable Field - SIGNIFICANTLY enlarged for better visibility */}
        <div className="space-y-2">
          <label className="block text-base font-medium text-gray-700 mb-1">Output Value *</label>
          
          <div className="variable-input-container bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg" 
               style={{ border: '1px solid #bfdbfe' }}>
            {/* Connected Nodes Info */}
            {connectedNodes.length > 0 && (
              <div className="mb-3 p-3 bg-white/90 rounded-md border border-blue-200">
                <div className="text-xs font-medium text-blue-700 mb-2">Available Variables:</div>
                <div className="flex flex-wrap gap-2">
                  {connectedNodes.map((node: any) => {
                    const parts = node.id.split('-');
                    const index = parts.length > 1 ? parts[parts.length - 1] : '0';
                    const nodeName = node.data.params?.nodeName || `${node.type}_${index}`;
                    const fieldName = node.type === 'input' ? 'text' : 'response';
                    return (
                      <button
                        key={node.id}
                        onClick={() => {
                          updateNodeData(id, { output: `{{ ${nodeName}.${fieldName} }}` });
                        }}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                      >
                        {{ {nodeName}.{fieldName} }}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Made the input field much larger and more prominent */}
            <div className="relative rounded-md overflow-visible mb-3 z-10" 
                 style={{ border: '2px solid #93c5fd', borderRadius: '0.375rem' }}>
              <div className="autocomplete-wrapper" style={{ position: 'relative', zIndex: 30 }}>
                <AutocompleteInput
                  value={data.params?.output || ''}
                  onChange={handleVariableChange}
                  placeholder='Type "{{" to utilize variables E.g., Question: {{ input_0.text }}'
                  className="bg-white text-base py-3.5 z-20 border-none"
                />
              </div>
            </div>
            
            {/* Variable preview - Bigger button */}
            {data.params?.output && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800 mb-2 px-3 py-1.5 hover:bg-blue-50 rounded-md transition-colors"
                  style={{ border: 'none' }}
                >
                  <Eye className="w-4 h-4 mr-1.5" />
                  {showPreview ? "Hide preview" : "Show variable preview"}
                </button>
                
                {showPreview && (
                  <div className="p-3 bg-white/90 rounded-md" style={{ border: '1px solid #bfdbfe' }}>
                    <VariableHighlighter 
                      text={data.params.output} 
                      className="text-base text-gray-700"
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Validation feedback - Increased padding */}
            {data.params?.output && !validateVariable(data.params.output) && (
              <div className="flex items-start mt-3 p-3 bg-red-50 rounded-md text-sm text-red-700"
                   style={{ border: '1px solid #fecaca' }}>
                <AlertTriangle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0 text-red-500" />
                <div>
                  <p className="font-medium">Invalid format</p>
                  <p className="mt-1">Use the format <code className="px-1.5 py-0.5 bg-red-100 rounded">&#123;&#123; input_0.text &#125;&#125;</code></p>
                  <p className="mt-1">For AI models use: <code className="px-1.5 py-0.5 bg-red-100 rounded">&#123;&#123; openai_0.response &#125;&#125;</code></p>
                </div>
              </div>
            )}
            
            {!data.params?.output && (
              <div className="flex items-start mt-3 p-3 bg-yellow-50 rounded-md text-sm text-yellow-700"
                   style={{ border: '1px solid #fef3c7' }}>
                <AlertTriangle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0 text-yellow-500" />
                <div>
                  <p className="font-medium">Required field</p>
                  <p className="mt-1">Select an input source using the Variables button</p>
                </div>
              </div>
            )}
          </div>
        </div>