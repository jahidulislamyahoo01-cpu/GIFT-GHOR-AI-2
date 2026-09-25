const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const sitemapEndpoint = `// PUBLIC API ENDPOINTS`;
const addSitemap = `
// Sitemap XML endpoint
app.get('/api/sitemaps.xml', (req, res) => {
  const sitemapXml = \`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://giftghor.world/</loc>
    <lastmod>\${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  \${DB.products.map(p => \`
  <url>
    <loc>https://giftghor.world/product/\${p.id}</loc>
    <lastmod>\${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\`).join('')}
</urlset>\`;

  res.header('Content-Type', 'application/xml');
  res.send(sitemapXml);
});

// PUBLIC API ENDPOINTS`;

if (!code.includes('/api/sitemaps.xml')) {
  code = code.replace(sitemapEndpoint, addSitemap);
  fs.writeFileSync('server.ts', code);
  console.log('Added /api/sitemaps.xml endpoint');
} else {
  console.log('/api/sitemaps.xml already exists');
}
