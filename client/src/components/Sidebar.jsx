import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, KanbanSquare, BarChart2, Settings } from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  const managerNav = [
    { section: 'Navigation' },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/manager/dashboard' },
    { id: 'sprints', label: 'Sprints', icon: <KanbanSquare size={20} />, path: '/manager/sprints' },
    { id: 'tasks', label: 'All Tasks', path: '/manager/tasks' },
    { id: 'employees', label: 'Team', path: '/manager/team' },
    { id: 'leaves', label: 'Leaves', path: '/manager/leaves' },
    { id: 'reports', label: 'Reports', icon: <BarChart2 size={20} />, path: '/manager/reports' },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} />, path: '/manager/settings' },
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
        
        return (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => `
              block px-6 py-3.5 text-[14px] font-medium transition-colors border-l-4
              ${isActive 
                ? 'bg-[#0B1536] text-white border-blue-600' 
                : 'text-gray-400 border-transparent hover:bg-[#0B1536]/50 hover:text-white'
              }
            `}
          >
            {item.label}
          </NavLink>
        );
      })}
    </aside>
  );
}
