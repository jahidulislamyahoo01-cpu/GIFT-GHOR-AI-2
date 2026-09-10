import fs from 'fs';

let file = fs.readFileSync('server.ts', 'utf-8');

// 1. Add rawContent to uploadedFiles interface
file = file.replace(
  `    uploadedAt: string;\n    summary: string;\n  }>;`,
  `    uploadedAt: string;\n    summary: string;\n    rawContent?: string;\n  }>;`
);

// 2. Add uploadedFiles content to context
const contextMarker = `CRAWLED KNOWLEDGE & STORE POLICIES (FROM WEBSITE):
\${crawledSummary}`;
const contextReplacement = `CRAWLED KNOWLEDGE & STORE POLICIES (FROM WEBSITE):
\${crawledSummary}

UPLOADED TEXT/FILE KNOWLEDGE:
\${db.uploadedFiles.filter(f => f.rawContent).map(f => \`Source: \${f.fileName}\\n\${f.rawContent}\`).join('\\n\\n')}`;

file = file.replace(contextMarker, contextReplacement);

// 3. Update upload-knowledge endpoint to save rawContent
const endpointMarker = `  const newFile = {
    id: 'file-' + Date.now(),
    fileName: fileName || \`catalog_\${Date.now()}.\${fileType || 'txt'}\`,
    fileType: (fileType || 'txt') as any,
    size: rawContent ? rawContent.length : 18500,
    parsedItemsCount: parsedCount,
    uploadedAt: new Date().toISOString(),
    summary,
  };`;

const endpointReplacement = `  const newFile = {
    id: 'file-' + Date.now(),
    fileName: fileName || \`catalog_\${Date.now()}.\${fileType || 'txt'}\`,
    fileType: (fileType || 'txt') as any,
    size: rawContent ? rawContent.length : 18500,
    parsedItemsCount: parsedCount,
    uploadedAt: new Date().toISOString(),
    summary,
    rawContent,
  };`;

file = file.replace(endpointMarker, endpointReplacement);

// add delete endpoint for uploaded files
const deleteFileEndpoint = `
app.delete('/api/admin/uploaded-files/:id', adminAuthMiddleware, (req, res) => {
  const { id } = req.params;
  DB.uploadedFiles = DB.uploadedFiles.filter((f) => f.id !== id);
  saveDB(DB);
  res.json({ success: true, uploadedFiles: DB.uploadedFiles });
});
`;
file = file.replace(`app.post('/api/admin/crawler/start'`, deleteFileEndpoint + `\napp.post('/api/admin/crawler/start'`);


fs.writeFileSync('server.ts', file);
console.log('Fixed upload backend logic');
