const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'client/src/pages/manager/Team.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Swap modal imports
content = content.replace("import EmployeeProfileModal from '../../components/EmployeeProfileModal';", "import EmployeeDetailDrawer from '../../components/EmployeeDetailDrawer';");

// 2. Add useRef and setTimeout logic for hover delay
// First, import useRef if not present
if (!content.includes('useRef')) {
  content = content.replace("import { useState, useEffect }", "import { useState, useEffect, useRef }");
}

const stateRegex = /const \[hoveredMemberId, setHoveredMemberId\] = useState\(null\);/;
const replacementState = `const [hoveredMemberId, setHoveredMemberId] = useState(null);
  const hoverTimeoutRef = useRef(null);

  const handleMouseEnter = (id) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredMemberId(id);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredMemberId(null);
  };`;
content = content.replace(stateRegex, replacementState);

// 3. Update the handlers on the card
content = content.replace(/onMouseEnter=\{\(\) => setHoveredMemberId\(member\.id\)\}/g, "onMouseEnter={() => handleMouseEnter(member.id)}");
content = content.replace(/onMouseLeave=\{\(\) => setHoveredMemberId\(null\)\}/g, "onMouseLeave={handleMouseLeave}");

// 4. Update Hover Tooltip styles to be left-anchored and have the specific animation
// Currently: className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[300px] bg-bg-card rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-line overflow-visible pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200"
// We want: left-0, top-full mt-2, animation: fade-in, translate-y-1 (which is 4px) -> 0.
const currentTooltipClass = "absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[300px] bg-bg-card rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-line overflow-visible pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200";
const newTooltipClass = "absolute left-0 top-full mt-2 w-[300px] bg-bg-card rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-line overflow-visible pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-200";
content = content.replace(currentTooltipClass, newTooltipClass);

// Also remove the tooltip arrow, or move it. The arrow was:
// <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-bg-card border-t border-l border-line rotate-45"></div>
// If we left-anchor, the arrow should be left-anchored too, e.g. left-6
const currentArrow = '<div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-bg-card border-t border-l border-line rotate-45"></div>';
const newArrow = '<div className="absolute -top-2 left-6 w-4 h-4 bg-bg-card border-t border-l border-line rotate-45"></div>';
content = content.replace(currentArrow, newArrow);

// 5. Replace EmployeeProfileModal usage with EmployeeDetailDrawer
// <EmployeeProfileModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} onUpdate={fetchTeam} onDelete={fetchTeam} />
// We just need EmployeeDetailDrawer
const modalRegex = /<EmployeeProfileModal[\s\S]*?\/>/;
const newDrawer = `<EmployeeDetailDrawer employeeId={selectedEmployee?.id} onClose={() => setSelectedEmployee(null)} />`;
content = content.replace(modalRegex, newDrawer);


fs.writeFileSync(file, content);
console.log('Team.jsx updated successfully for hover/click refactoring');
