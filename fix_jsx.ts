import fs from 'fs';
let file = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

const target = `{currentSession.orderExtracted && currentSession.orderExtracted.customerPhone && (
                    <div className="bg-emerald-50/60 px-4 md:px-5 py-2.5 md:py-2.5 border-b border-emerald-100 flex flex-col md:flex-row items-start md:items-center justify-between text-xs text-emerald-950 gap-2 md:gap-0">`;

const replacement = `{currentSession.orderExtracted && currentSession.orderExtracted.customerPhone && (
                    <>
                    <div className="bg-emerald-50/60 px-4 md:px-5 py-2.5 md:py-2.5 border-b border-emerald-100 flex flex-col md:flex-row items-start md:items-center justify-between text-xs text-emerald-950 gap-2 md:gap-0">`;

file = file.replace(target, replacement);

const targetEnd = `                      )}
                    </div>
                  )}

                  {/* Message stream */}`;

const replacementEnd = `                      )}
                    </div>
                    </>
                  )}

                  {/* Message stream */}`;

file = file.replace(targetEnd, replacementEnd);
fs.writeFileSync('src/components/AdminDashboard.tsx', file);
console.log('Fixed JSX wrapping');
