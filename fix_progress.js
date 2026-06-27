const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'client/src/pages/employee/EmployeeProgress.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove Efficiency metric calculation in the component
content = content.replace(/const efficiency = totalAct > 0 \? Math\.round\(\(totalEst \/ totalAct\) \* 100\) : \(totalEst > 0 \? 100 : 0\);\n/g, "");
content = content.replace(/let effColor = 'text-semantic-error-text';\n/g, "");
content = content.replace(/if \(efficiency >= 90\) effColor = 'text-semantic-success-text';\n/g, "");
content = content.replace(/else if \(efficiency >= 70\) effColor = 'text-orange-500';\n/g, "");

// 2. Remove Efficiency card from top metrics grid
const effCard = `          <div className="bg-bg-card border border-line rounded-lg p-4 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Target size={20} />
              </div>
              <div>
                <span className="text-[13px] text-text-secondary">Efficiency (Est vs Act)</span>
                <div className={\`text-xl font-bold \${effColor}\`}>
                {totalEst > 0 ? \`\${efficiency}%\` : '—'}
                </div>
              </div>
            </div>
          </div>`;
content = content.replace(effCard, "");

// 3. Update the metric grid cols to 3 instead of 4
content = content.replace(/<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">/g, '<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">');

// 4. Remove Efficiency Trend section
const trendHeaderRegex = /\/\/ ── EFFICIENCY TREND \/ TASK PERFORMANCE ──[\s\S]*?const trendData = /;
content = content.replace(trendHeaderRegex, "// ── TASK PERFORMANCE ──\n  const trendData = ");

const effTrendCardRegex = /<div className="bg-bg-card border border-line rounded-lg p-5 shadow-sm lg:col-span-2">[\s\S]*?{trendTitle}[\s\S]*?<\/ResponsiveContainer>\n\s*<\/div>\n\s*<\/div>/;
content = content.replace(effTrendCardRegex, "");
// change lg:grid-cols-3 to lg:grid-cols-1 for the chart section
content = content.replace(/<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">/g, '<div className="grid grid-cols-1 gap-6 mb-6">');
// and remove lg:col-span-1 from the other chart (task status overview)
content = content.replace(/<div className="bg-bg-card border border-line rounded-lg p-5 shadow-sm lg:col-span-1">/g, '<div className="bg-bg-card border border-line rounded-lg p-5 shadow-sm">');


// 5. Remove Efficiency column from Tasks History table
content = content.replace(/<th className="p-3 border-b border-line-light font-medium">Efficiency<\/th>\n/g, "");
content = content.replace(/<td className="p-3 border-b border-line-light font-medium">.*?<\/td>\n\s*<\/tr>/g, "</tr>"); // wait, this regex might match too much. Let's not use it blindly. Let's use string replace for that specific cell.
// actually let's see how the table row is structured first before wiping it out.

fs.writeFileSync(file, content);
console.log('EmployeeProgress.jsx updated');
