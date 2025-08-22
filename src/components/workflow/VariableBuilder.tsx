@@ .. @@
   const handleSelectField = (node: any, field: { name: string, type: string }) => {
-    const nodeName = node.data.params?.nodeName || node.id;
-    onSelect(`${nodeName}.${field.name}`);
+    // Generate consistent node name
+    let nodeName = node.data.params?.nodeName;
+    if (!nodeName) {
+      const parts = node.id.split('-');
+      const index = parts.length > 1 ? parts[parts.length - 1] : '0';
+      nodeName = `${node.type}_${index}`;
+    }
+    onSelect(`${nodeName}.${field.name}`);
   };