import fs from 'fs';
let file = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

file = file.replace(
  `  const loadAdminState = async (token = authToken, isInitial = false) => {`,
  `  const loadAdminState = async (token = authToken, isInitial = false, isPolling = false) => {`
);

file = file.replace(
  `      setStats(data.stats);
      setBranding(data.branding);
      setDeliveryPolicy(data.deliveryPolicy);
      setProducts(data.products || []);
      setCrawledPages(data.crawledPages || []);
      setUploadedFiles(data.uploadedFiles || []);
      setFaqs(data.faqs || []);
      setSessions(data.sessions || {});`,
  `      setStats(data.stats);
      setSessions(data.sessions || {});
      
      // Do not overwrite user input fields during background polling
      if (!isPolling) {
        setBranding(data.branding);
        setDeliveryPolicy(data.deliveryPolicy);
        setProducts(data.products || []);
        setCrawledPages(data.crawledPages || []);
        setUploadedFiles(data.uploadedFiles || []);
        setFaqs(data.faqs || []);
      }`
);

file = file.replace(
  `      const interval = setInterval(() => {
        loadAdminState(authToken, false);
      }, 5000);`,
  `      const interval = setInterval(() => {
        loadAdminState(authToken, false, true);
      }, 5000);`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', file);
console.log('Fixed polling user input overwrite');
