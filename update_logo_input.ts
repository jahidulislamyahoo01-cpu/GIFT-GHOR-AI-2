import fs from 'fs';
let file = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

const target = `
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Store Logo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={branding.logoUrl}
                    onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                    placeholder="https://giftghor.world/assets/logo.png"
                    className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Leave blank to use the official Gift Ghor gift-box icon.
                  </p>
                </div>
`;

const replacement = `
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Store Logo (Upload Image)
                  </label>
                  <div className="flex items-center gap-4">
                    {branding.logoUrl ? (
                      <div className="w-12 h-12 rounded-xl border border-[#ECECEC] bg-white overflow-hidden shrink-0 flex items-center justify-center">
                        <img src={branding.logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl border border-[#ECECEC] bg-gray-50 shrink-0 flex items-center justify-center text-gray-400">
                        <span className="text-[10px]">No logo</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              alert("File is too large. Please upload an image under 2MB.");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setBranding({ ...branding, logoUrl: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-3 py-2 text-[#262626] file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[#FDF7EE] file:text-[#ECA548] hover:file:bg-[#faeedd] cursor-pointer"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        Upload a PNG or JPG. Leave blank for default icon. Max 2MB.
                      </p>
                    </div>
                  </div>
                </div>
`;

if (file.includes(target.trim())) {
  file = file.replace(target.trim(), replacement.trim());
  fs.writeFileSync('src/components/AdminDashboard.tsx', file);
  console.log('Logo input replaced successfully.');
} else {
  console.log('Target not found.');
}
