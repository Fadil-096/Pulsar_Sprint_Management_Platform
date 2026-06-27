const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'client/src/pages/manager/Team.jsx');
let content = fs.readFileSync(file, 'utf8');

// Update state and hover logic
const stateRegex = /const \[hoveredMemberId, setHoveredMemberId\] = useState\(null\);\n\s*const hoverTimeoutRef = useRef\(null\);/;
const replacementState = `const [hoveredMemberId, setHoveredMemberId] = useState(null);
  const [flipTooltip, setFlipTooltip] = useState(false);
  const hoverTimeoutRef = useRef(null);`;
content = content.replace(stateRegex, replacementState);

const handleMouseEnterRegex = /const handleMouseEnter = \(id\) => \{\n\s*if \(hoverTimeoutRef\.current\) clearTimeout\(hoverTimeoutRef\.current\);\n\s*hoverTimeoutRef\.current = setTimeout\(\(\) => \{\n\s*setHoveredMemberId\(id\);\n\s*\}, 150\);\n\s*\};/;
const replacementMouseEnter = `const handleMouseEnter = (id, e) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    // Check if we need to flip the tooltip (if close to bottom of screen)
    // Tooltip height is roughly 160px.
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const shouldFlip = spaceBelow < 180;
    
    hoverTimeoutRef.current = setTimeout(() => {
      setFlipTooltip(shouldFlip);
      setHoveredMemberId(id);
    }, 150);
  };`;
content = content.replace(handleMouseEnterRegex, replacementMouseEnter);

// Update card event handler to pass event
content = content.replace(/onMouseEnter=\{\(\) => handleMouseEnter\(member\.id\)\}/g, "onMouseEnter={(e) => handleMouseEnter(member.id, e)}");

// Update tooltip position based on flipTooltip state
const tooltipRegex = /className="absolute left-0 top-full mt-2 w-\[300px\] bg-bg-card rounded-xl shadow-\[0_10px_40px_-10px_rgba\(0,0,0,0\.15\)\] border border-line overflow-visible pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-200"/;
const replacementTooltip = "className={`absolute left-0 w-[300px] bg-bg-card rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-line overflow-visible pointer-events-none animate-in fade-in duration-200 z-50 ${flipTooltip ? 'bottom-full mb-2 slide-in-from-top-1' : 'top-full mt-2 slide-in-from-bottom-1'}`}";
content = content.replace(tooltipRegex, replacementTooltip);

const arrowRegex = /<div className="absolute -top-2 left-6 w-4 h-4 bg-bg-card border-t border-l border-line rotate-45"><\/div>/;
const replacementArrow = "{/* Tooltip Arrow */}\n                    <div className={`absolute left-6 w-4 h-4 bg-bg-card border-line rotate-45 ${flipTooltip ? '-bottom-2 border-b border-r' : '-top-2 border-t border-l'}`}></div>";
content = content.replace(arrowRegex, replacementArrow);
// also remove the old Tooltip Arrow comment since we replaced it with the logic
content = content.replace("{/* Tooltip Arrow */}\n                    {/* Tooltip Arrow */}", "{/* Tooltip Arrow */}"); // cleanup duplicate if any


fs.writeFileSync(file, content);
console.log('Team.jsx updated successfully with tooltip flip logic');
