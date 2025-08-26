@@ .. @@
             <button
               onClick={() => setShowVariableManager(true)}
               className="flex items-center justify-center w-10 h-10 rounded-md bg-theme-medium/30 text-theme-medium-dark hover:bg-theme-medium/40 hover:text-theme-medium transition-all"
-              title="Manage workflow variables"
+              title="Variable Manager - View all available variables"
             >
               <Clipboard size={18} />
             </button>
             
             <button
               onClick={() => setShowVarPreview(true)}
               className="flex items-center justify-center w-10 h-10 rounded-md bg-theme-medium/30 text-theme-medium-dark hover:bg-theme-medium/40 hover:text-theme-medium transition-all"
-              title="View variable connections"
+              title="Connection View - See all node connections"
             >
               <Link size={18} />
             </button>