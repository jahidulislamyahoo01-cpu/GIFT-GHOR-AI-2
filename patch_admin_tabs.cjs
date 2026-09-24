const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// 1. Add insights tab button in sidebar
const brandingTab = `            <button
              onClick={() => setActiveTab('branding')}`;
const newTab = `            <button
              onClick={() => setActiveTab('insights')}
              className={\`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all \${
                activeTab === 'insights'
                  ? 'bg-[#FDF7EE] text-[#ECA548] border border-[#ECA548]/30'
                  : 'text-gray-600 hover:bg-gray-50'
              }\`}
            >
              <TrendingUp className="w-4 h-4" />
              Insights & Analytics
            </button>

            <button
              onClick={() => setActiveTab('branding')}`;
code = code.replace(brandingTab, newTab);

// 2. Add insights content component render
const brandingContent = `          {/* ----------------- TAB 5: BRANDING CUSTOMIZER ----------------- */}`;
const insightsContent = `          {/* ----------------- TAB: INSIGHTS & ANALYTICS ----------------- */}
          {activeTab === 'insights' && (
            <AdminInsightsView authToken={authToken} />
          )}

          {/* ----------------- TAB 5: BRANDING CUSTOMIZER ----------------- */}`;
code = code.replace(brandingContent, insightsContent);

// 3. Add import
if (!code.includes('TrendingUp')) {
  code = code.replace("Code2,", "Code2, TrendingUp,");
}

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Patched AdminDashboard.tsx to include Insights Tab');
