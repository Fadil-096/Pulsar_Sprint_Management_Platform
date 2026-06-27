const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'client/src/pages/manager/Team.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove import
content = content.replace("import { calculateEfficiency } from '../../utils/efficiency';", "");

// 2. Remove sort config
content = content.replace(/if \(sortConfig\.key === 'efficiency'\) {[\s\S]*?}\n\s*if \(sortConfig\.key/g, "if (sortConfig.key");
content = content.replace(/if \(sortConfig\.key === 'efficiency'\) {[\s\S]*?}\n\s*return/g, "return");

// 3. Remove from description text
content = content.replace("View workload, efficiency, and attendance across the team.", "View workload and attendance across the team.");

// 4. Remove eff var in grid
content = content.replace(/const eff = calculateEfficiency\(member\.metrics\.totalEstHours, member\.metrics\.totalSpentHours\);\n/g, "");

// 5. Remove efficiency block from grid view
const gridBlock = `                        <div className="bg-bg-card p-3">
                          <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Efficiency</div>
                          <div className={\`flex items-center gap-1 text-base font-bold leading-none \${eff ? eff.color : 'text-text-muted'}\`}>
                            {eff ? eff.label : '—'}
                            {eff?.trend === 'up' && <ArrowUpRight size={14} />}
                            {eff?.trend === 'down' && <ArrowDownRight size={14} />}
                          </div>
                        </div>`;
content = content.replace(gridBlock, "");
// change grid-cols-2 to grid-cols-1 if we want? wait, it was grid-cols-2 for Tasks, Hours, Efficiency, Sprint. Wait, Hours was also removed?
// Wait, I saw "Hours" in Team.jsx grid view:
/*
                        <div className="bg-bg-card p-3">
                          <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Hours</div>
                          <div className="text-base font-bold text-text-primary leading-none">{member.metrics.totalSpentHours}h</div>
                        </div>
*/
// Let's remove Hours from here too because it uses totalSpentHours which is now 0 or undefined.
const hoursBlock = `                        <div className="bg-bg-card p-3">
                          <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Hours</div>
                          <div className="text-base font-bold text-text-primary leading-none">{member.metrics.totalSpentHours}h</div>
                        </div>`;
content = content.replace(hoursBlock, "");
// So now Tasks and Sprint remain. The grid is grid-cols-2, so 2 items fit perfectly.

// 6. Remove Efficiency header from table
content = content.replace(/<th className="px-6 py-4 font-bold cursor-pointer hover:bg-gray-100" onClick={\(\) => handleSort\('efficiency'\)}>Efficiency<\/th>\n/g, "");

// Also remove Hours Worked header?
content = content.replace(/<th className="px-6 py-4 font-bold cursor-pointer hover:bg-gray-100" onClick={\(\) => handleSort\('hours'\)}>Hours Worked<\/th>\n/g, "");

// 7. Remove Efficiency cell from table
// We also need to remove Hours Worked cell.
content = content.replace(/<td className="px-6 py-4 font-mono">\n\s*<div className="flex items-center gap-1">\n\s*<Clock size={14} className="text-blue-500" \/>\n\s*\{member\.metrics\.totalSpentHours\}h\n\s*<\/div>\n\s*<\/td>\n/g, "");

const effCell = `                      <td className="px-6 py-4 font-medium">
                        <div className={\`inline-flex items-center gap-1 \${eff ? eff.color : 'text-text-muted'}\`}>
                          {eff ? eff.label : '—'}
                          {eff?.trend === 'up' && <ArrowUpRight size={14} />}
                          {eff?.trend === 'down' && <ArrowDownRight size={14} />}
                        </div>
                      </td>`;
content = content.replace(effCell, "");
content = content.replace(effCell + '\n', "");

fs.writeFileSync(file, content);
console.log('Team.jsx updated');
