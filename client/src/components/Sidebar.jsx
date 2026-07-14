import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, KanbanSquare, BarChart2, Settings, ClipboardList, Users, Contact, CalendarCheck, CalendarMinus, CheckSquare, FilePlus, TrendingUp, ChevronDown, ChevronRight, Folder, Archive, CalendarDays } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';


export default function Sidebar() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'administrator';
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
    { id: 'projects', label: 'Projects', icon: <Folder size={20} />, path: '/manager/projects' },
    { id: 'sprints', label: 'Sprints', icon: <KanbanSquare size={20} />, path: '/manager/sprints' },
    { id: 'tasks', label: 'All Tasks', icon: <ClipboardList size={20} />, path: '/manager/tasks' },
    { id: 'calendar', label: 'Calendar', icon: <CalendarDays size={20} />, path: '/manager/calendar' },
    { 
      id: 'team', 
      label: 'Team', 
      icon: <Users size={20} />,
      isMenu: true,
      children: [
        { id: 'employees', label: 'Team Directory', icon: <Contact size={16} />, path: '/manager/team' },
        { id: 'manager-leaves', label: 'Leave Requests', icon: <CalendarMinus size={16} />, path: '/manager/leaves' },
        { id: 'team-attendance', label: 'Attendance Log', icon: <CalendarCheck size={16} />, path: '/manager/attendance' }
      ]
    },
    { id: 'reports', label: 'Reports', icon: <BarChart2 size={20} />, path: '/manager/reports' },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} />, path: '/manager/settings' },
  ];

  const employeeNav = [
    { section: 'Navigation' },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/employee/dashboard' },
    { id: 'my-tasks', label: 'My Tasks', icon: <CheckSquare size={20} />, path: '/employee/tasks' },
    { id: 'calendar', label: 'Calendar', icon: <CalendarDays size={20} />, path: '/employee/calendar' },
    { id: 'leaves', label: 'Leaves', icon: <CalendarMinus size={20} />, path: '/employee/leaves' },
    { id: 'attendance', label: 'Attendance', icon: <CalendarCheck size={20} />, path: '/employee/attendance' },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} />, path: '/employee/settings' },
  ];

  const adminNav = [
    { section: 'Navigation Bar' },
    { id: 'admin-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
    { id: 'admin-projects', label: 'Backlogs', icon: <Archive size={20} />, path: '/manager/projects' },
    { id: 'admin-sprints', label: 'Sprint Management', icon: <KanbanSquare size={20} />, path: '/manager/sprints' },
    { id: 'admin-tasks', label: 'Global Tasks', icon: <ClipboardList size={20} />, path: '/manager/tasks' },
    { id: 'calendar', label: 'Calendar', icon: <CalendarDays size={20} />, path: '/admin/calendar' },
    { 
      id: 'admin-team', 
      label: 'Organization', 
      icon: <Users size={20} />,
      isMenu: true,
      children: [
        { id: 'admin-users', label: 'All Users', icon: <Contact size={16} />, path: '/admin/users' },
        { id: 'admin-leaves', label: 'Leave Requests', icon: <CalendarMinus size={16} />, path: '/admin/leaves' },
        { id: 'admin-departments', label: 'Departments', icon: <TrendingUp size={16} />, path: '/admin/departments' },
        { id: 'admin-attendance', label: 'Attendance Log', icon: <CalendarCheck size={16} />, path: '/admin/attendance' }
      ]
    },
    { id: 'admin-reports', label: 'Analytics', icon: <BarChart2 size={20} />, path: '/manager/reports' },
    { id: 'admin-settings', label: 'Settings', icon: <Settings size={20} />, path: '/admin/settings' },
  ];

  const nav = isAdmin ? adminNav : (isManager ? managerNav : employeeNav);

  const toggleMenu = (id) => {
    const next = new Set(expandedMenus);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedMenus(next);
  };

  return (
    <aside className="w-[240px] bg-bg-sidebar flex-shrink-0 flex flex-col hidden sm:flex pt-6 overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-4">
        {nav.map((item, idx) => {
          if (item.section) {
            return (
              <div key={idx} className="text-[11px] font-bold uppercase tracking-wider text-text-secondary px-6 mb-3 mt-4 first:mt-0">
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
                  className="w-full text-left px-6 py-3.5 text-[14px] font-medium text-gray-400 hover:bg-white/5 hover:text-white hover:text-[15px] hover:tracking-wide transition-all duration-200 flex items-center justify-between border-l-4 border-transparent group"
                >
                  <div className="flex items-center gap-3">
                    {item.icon && <span className="opacity-80">{item.icon}</span>}
                    <span>{item.label}</span>
                  </div>
                  <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                {isExpanded && (
                  <div className="bg-black/20">
                    {item.children.map(child => (
                      <NavLink
                        key={child.id}
                        to={child.path}
                        className={({ isActive }) => `
                          block px-10 py-2.5 text-[13px] font-medium transition-all duration-200 border-l-4 group
                          ${isActive 
                            ? 'bg-accent-blue/10 text-accent-blue border-accent-blue text-[14px] tracking-wide' 
                            : 'text-gray-400 border-transparent hover:bg-white/5 hover:text-white hover:text-[14px] hover:tracking-wide'}
                        `}
                      >
                        <div className="flex items-center gap-2">
                          {child.icon && <span className="opacity-80">{child.icon}</span>}
                          <span>{child.label}</span>
                        </div>
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
                block px-6 py-3.5 text-[14px] font-medium transition-all duration-200 border-l-4 flex items-center justify-between group
                ${isActive 
                  ? 'bg-accent-blue/10 text-accent-blue border-accent-blue text-[15px] tracking-wide' 
                  : 'text-gray-400 border-transparent hover:bg-white/5 hover:text-white hover:text-[15px] hover:tracking-wide'}
              `}
            >
              <div className="flex items-center gap-3">
                {item.icon && <span className="opacity-80">{item.icon}</span>}
                <span>{item.label}</span>
              </div>
              {item.id === 'leaves' && isManager && pendingLeavesCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {pendingLeavesCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

    </aside>
  );
}
