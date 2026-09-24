import fs from 'fs';
const file = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

const target = `
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Welcome Greeting (Bengali / English)
`;

const replacement = `
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Primary Theme Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={branding.primaryColor || '#ECA548'}
                        onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={branding.primaryColor || '#ECA548'}
                        onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                        className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-3 py-2 text-[#262626]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Header Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={branding.headerTextColor || '#262626'}
                        onChange={(e) => setBranding({ ...branding, headerTextColor: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={branding.headerTextColor || '#262626'}
                        onChange={(e) => setBranding({ ...branding, headerTextColor: e.target.value })}
                        className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-3 py-2 text-[#262626]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Welcome Greeting (Bengali / English)
`;

if (file.includes(target.trim())) {
  const newFile = file.replace(target.trim(), replacement.trim());
  fs.writeFileSync('src/components/AdminDashboard.tsx', newFile);
  console.log("Branding updated");
} else {
  console.log("Could not find target");
}
