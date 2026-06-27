import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, KanbanSquare, BarChart2, Settings, ClipboardList, Users, Contact, CalendarCheck, CalendarMinus, CheckSquare, FilePlus, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  const [use12Hour, setUse12Hour] = useState(() => {
    return localStorage.getItem('nokia-sprint-time-format') === '12h';
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFormat = () => {
    const newFormat = !use12Hour;
    setUse12Hour(newFormat);
    localStorage.setItem('nokia-sprint-time-format', newFormat ? '12h' : '24h');
  };

  const fullDay = time.toLocaleDateString('en-GB', { weekday: 'long' });
  const fullDate = time.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const compactDate = `${fullDay.substring(0, 3)}, ${time.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;

  let hours = time.getHours();
  const ampm = use12Hour ? (hours >= 12 ? ' PM' : ' AM') : '';
  if (use12Hour) {
    hours = hours % 12;
    hours = hours ? hours : 12;
  }
  const displayHours = String(hours).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');

  return (
    <div 
      className="flex flex-col items-start justify-center cursor-pointer hover:bg-white/5 p-3 rounded-lg transition-colors border border-white/10 shrink-0 w-full"
      onClick={toggleFormat}
      title="Click to toggle 12h/24h format"
    >
      <div className="text-[11px] text-nav-text opacity-60 font-normal tracking-wide">
        {fullDay}, {fullDate}
      </div>
      <div className="text-[15px] font-semibold text-nav-text flex items-center mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
        <span>{displayHours}</span>
        <span className="opacity-40 mx-[2px] mb-[2px] animate-pulse">:</span>
        <span>{minutes}</span>
        <span className="opacity-40 mx-[2px] mb-[2px] animate-pulse">:</span>
        <span>{seconds}</span>
        {ampm && <span className="text-[11px] ml-1.5 opacity-80 font-medium">{ampm}</span>}
      </div>
    </div>
  );
};

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
    { id: 'tasks', label: 'All Tasks', icon: <ClipboardList size={20} />, path: '/manager/tasks' },
    { 
      id: 'team', 
      label: 'Team', 
      icon: <Users size={20} />,
      isMenu: true,
      children: [
        { id: 'employees', label: 'Team Directory', icon: <Contact size={16} />, path: '/manager/team' },
        { id: 'team-attendance', label: 'Team Attendance', icon: <CalendarCheck size={16} />, path: '/manager/team-attendance' }
      ]
    },
    { id: 'leaves', label: 'Leaves', icon: <CalendarMinus size={20} />, path: '/manager/leaves' },
    { id: 'reports', label: 'Reports', icon: <BarChart2 size={20} />, path: '/manager/reports' },
  ];

  const employeeNav = [
    { section: 'Navigation' },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/employee/dashboard' },
    { id: 'my-tasks', label: 'My Tasks', icon: <CheckSquare size={20} />, path: '/employee/tasks' },
    { id: 'log-task', label: 'Log Task', icon: <FilePlus size={20} />, path: '/employee/log' },
    { id: 'leaves', label: 'Leaves', icon: <CalendarMinus size={20} />, path: '/employee/leaves' },
    { id: 'my-progress', label: 'My Progress', icon: <TrendingUp size={20} />, path: '/employee/progress' },
  ];

  const nav = isManager ? managerNav : employeeNav;

  const toggleMenu = (id) => {
    const next = new Set(expandedMenus);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedMenus(next);
  };

  return (
    <aside className="w-[240px] bg-bg-sidebar flex-shrink-0 flex flex-col hidden sm:flex pt-6">
      {nav.map((item, idx) => {
        if (item.section) {
          return (
            <div key={idx} className="text-[11px] font-bold uppercase tracking-wider text-text-secondary px-6 mb-3">
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
                className="w-full text-left px-6 py-3.5 text-[14px] font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-colors flex items-center justify-between border-l-4 border-transparent"
              >
                <div className="flex items-center gap-3">
                  {item.icon && <span className="opacity-80">{item.icon}</span>}
                  <span>{item.label}</span>
                </div>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {isExpanded && (
                <div className="bg-black/20">
                  {item.children.map(child => (
                    <NavLink
                      key={child.id}
                      to={child.path}
                      className={({ isActive }) => `
                        block px-10 py-2.5 text-[13px] font-medium transition-colors border-l-4
                        ${isActive 
                          ? 'bg-white/10 text-white border-blue-500' 
                          : 'text-gray-400 border-transparent hover:bg-white/5 hover:text-white'
                        }
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
              block px-6 py-3.5 text-[14px] font-medium transition-colors border-l-4 flex items-center justify-between
              ${isActive 
                ? 'bg-white/10 text-white border-blue-500' 
                : 'text-gray-400 border-transparent hover:bg-white/5 hover:text-white'
              }
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
      <div className="mt-auto pb-6 px-6">
        <LiveClock />
      </div>
    </aside>
  );
}
