import fs from 'fs';
let file = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

file = file.replace(
  `  const loadAdminState = async (token = authToken) => {`,
  `  const loadAdminState = async (token = authToken, isInitial = false) => {`
);

file = file.replace(
  `      // Auto-select first session if none selected
      if (!selectedSessionId) {
        const sessionKeys = Object.keys(data.sessions || {});
        if (sessionKeys.length > 0) {
          setSelectedSessionId(sessionKeys[0]);
        }
      }`,
  `      // Auto-select first session on initial load
      if (isInitial) {
        const sessionKeys = Object.keys(data.sessions || {});
        if (sessionKeys.length > 0) {
          setSelectedSessionId(sessionKeys[0]);
        }
      }`
);

file = file.replace(
  `  useEffect(() => {
    if (authToken) {
      loadAdminState();
      // Poll chat sessions every 5s for live incoming messages
      const interval = setInterval(() => {
        loadAdminState();
      }, 5000);`,
  `  useEffect(() => {
    if (authToken) {
      loadAdminState(authToken, true);
      // Poll chat sessions every 5s for live incoming messages
      const interval = setInterval(() => {
        loadAdminState(authToken, false);
      }, 5000);`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', file);
console.log('Fixed polling');
