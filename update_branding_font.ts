import fs from 'fs';
const file = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

const target = `
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Welcome Greeting (Bengali / English)
`;

const replacement = `
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Widget Font Family
                  </label>
                  <select
                    value={branding.fontFamily || 'sans-serif'}
                    onChange={(e) => setBranding({ ...branding, fontFamily: e.target.value })}
                    className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                  >
                    <option value="sans-serif">System Default (Sans-serif)</option>
                    <option value="'Inter', sans-serif">Inter</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                    <option value="'Poppins', sans-serif">Poppins</option>
                    <option value="'Noto Sans Bengali', sans-serif">Noto Sans Bengali</option>
                    <option value="'Playfair Display', serif">Playfair Display (Serif)</option>
                    <option value="monospace">Monospace</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Welcome Greeting (Bengali / English)
`;

if (file.includes(target.trim())) {
  const newFile = file.replace(target.trim(), replacement.trim());
  fs.writeFileSync('src/components/AdminDashboard.tsx', newFile);
  console.log("Branding font selector added");
} else {
  console.log("Could not find target");
}
