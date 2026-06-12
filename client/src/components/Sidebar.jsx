import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, KanbanSquare, BarChart2, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function Sidebar() {
  const { user, token } = useAuth();
  const isManager = user?.role === 'manager';
  
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [expandedMenus, setExpandedMenus] = useState(new Set(['team'])); // Auto-expand team menu

  useEffect(() => {
    if (isManager && token) {
      axios.get('/api/leaves', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          const pending = res.data.filter(l => l.status === 'pending').length;
          setPendingLeavesCount(pending);
        })
        .catch(err => console.error(err));
    }
  }, [isManager, token]);

  const managerNav = [
    { section: 'Navigation' },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/manager/dashboard' },
    { id: 'sprints', label: 'Sprints', icon: <KanbanSquare size={20} />, path: '/manager/sprints' },
    { id: 'tasks', label: 'All Tasks', path: '/manager/tasks' },
    { 
      id: 'team', 
      label: 'Team', 
      isMenu: true,
      children: [
        { id: 'employees', label: 'Team Directory', path: '/manager/team' },
        { id: 'team-attendance', label: 'Team Attendance', path: '/manager/team-attendance' }
      ]
    },
    { id: 'leaves', label: 'Leaves', path: '/manager/leaves' },
    { id: 'reports', label: 'Reports', icon: <BarChart2 size={20} />, path: '/manager/reports' },
  ];

  const employeeNav = [
    { section: 'Navigation' },
    { id: 'dashboard', label: 'Dashboard', path: '/employee/dashboard' },
    { id: 'my-tasks', label: 'My Tasks', path: '/employee/tasks' },
    { id: 'log-task', label: 'Log Task', path: '/employee/log' },
    { id: 'leaves', label: 'Leaves', path: '/employee/leaves' },
    { id: 'my-progress', label: 'My Progress', path: '/employee/progress' },
  ];

  const nav = isManager ? managerNav : employeeNav;

  const toggleMenu = (id) => {
    const next = new Set(expandedMenus);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedMenus(next);
  };

  return (
    <aside className="w-[240px] bg-[#020024] flex-shrink-0 flex flex-col hidden sm:flex pt-6">
      {nav.map((item, idx) => {
        if (item.section) {
          return (
            <div key={idx} className="text-[11px] font-bold uppercase tracking-wider text-gray-500 px-6 mb-3">
              {item.section}
            </div>
          );
        }
        
        if (item.isMenu) {
          const isExpanded = expandedMenus.has(item.id);
          return (
            <div key={item.id}>
              <button
                onClick={() => toggleMenu(item.id)}
                className="w-full text-left px-6 py-3.5 text-[14px] font-medium text-gray-400 hover:bg-[#0B1536]/50 hover:text-white transition-colors flex items-center justify-between border-l-4 border-transparent"
              >
                <span>{item.label}</span>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {isExpanded && (
                <div className="bg-[#050B1E]">
                  {item.children.map(child => (
                    <NavLink
                      key={child.id}
                      to={child.path}
                      className={({ isActive }) => `
                        block px-10 py-2.5 text-[13px] font-medium transition-colors border-l-4
                        ${isActive 
                          ? 'bg-[#0B1536] text-white border-blue-600' 
                          : 'text-gray-400 border-transparent hover:bg-[#0B1536]/50 hover:text-white'
                        }
                      `}
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => `
              block px-6 py-3.5 text-[14px] font-medium transition-colors border-l-4 flex items-center justify-between
              ${isActive 
                ? 'bg-[#0B1536] text-white border-blue-600' 
                : 'text-gray-400 border-transparent hover:bg-[#0B1536]/50 hover:text-white'
              }
            `}
          >
            <span>{item.label}</span>
            {item.id === 'leaves' && isManager && pendingLeavesCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {pendingLeavesCount}
              </span>
            )}
          </NavLink>
        );
      })}
    </aside>
  );
}
