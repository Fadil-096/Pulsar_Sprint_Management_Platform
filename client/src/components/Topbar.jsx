import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, Sun, Moon } from 'lucide-react';
import NotificationBell from './NotificationBell';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex h-[28px] w-[56px] shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 ${isDark ? 'bg-[#1E293B]' : 'bg-[#0066CC]'}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <span className="sr-only">Toggle Theme</span>
      <span
        className={`pointer-events-none absolute flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${isDark ? 'translate-x-[14px]' : '-translate-x-[14px]'}`}
      >
        {isDark ? <Moon size={12} className="text-gray-800" /> : <Sun size={12} className="text-[#0066CC]" />}
      </span>
    </button>
  );};

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

  const fullDay = time.toLocaleDateString('en-GB', { weekday: 'short' });
  const fullDate = time.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

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
      className="flex flex-col items-end justify-center cursor-pointer hover:opacity-80 transition-opacity hidden md:flex mr-2 pr-4 border-r border-nav-text/20"
      onClick={toggleFormat}
      title="Click to toggle 12h/24h format"
    >
      <div className="text-[10px] text-nav-text opacity-70 font-medium tracking-wide uppercase">
        {fullDay}, {fullDate}
      </div>
      <div className="text-[14px] font-bold text-nav-text flex items-center" style={{ fontVariantNumeric: 'tabular-nums' }}>
        <span>{displayHours}</span>
        <span className="opacity-40 mx-[1px] mb-[1px] animate-pulse">:</span>
        <span>{minutes}</span>
        <span className="opacity-40 mx-[1px] mb-[1px] animate-pulse">:</span>
        <span>{seconds}</span>
        {ampm && <span className="text-[10px] ml-1 opacity-80 font-bold">{ampm}</span>}
      </div>
    </div>
  );
};



export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between px-6 h-[64px] bg-nav-bg sticky top-0 z-50 text-nav-text">
      <div className="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 338.667 79.687" aria-label="Nokia" style={{ height: '20px', width: 'auto', display: 'block' }} className="fill-nav-text">
          <path d="M114.194 1.145c-21.865 0-38.831 15.914-38.831 38.698 0 23.81 16.965 38.699 38.831 38.698s38.866-14.889 38.831-38.698c-.032-21.587-16.965-38.698-38.831-38.698zm0 10.654c15.258 0 27.627 11.484 27.627 28.044 0 16.867-12.369 28.045-27.627 28.045S86.567 56.709 86.567 39.843c0-16.561 12.369-28.044 27.627-28.044zm119.913-9.376v74.839h11.224V2.423zm-30.985 0l-41.655 37.419 41.655 37.42h16.702l-41.718-37.42 41.718-37.419zM296.843 0l-6.092 11.252 20.667 38.388h-41.447l-14.953 27.623h12.348l9.03-16.573h40.895l9.029 16.573h12.347zM0 0v77.263h11.455v-51.06L70.98 79.686V63.667z"/>
        </svg>
        <div className="h-[20px] w-[1px] bg-nav-text opacity-20 mx-4"></div>
        <div className="text-[18px] font-semibold text-accent-blue tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          Sprint
        </div>
      </div>
      
      <div className="flex items-center gap-4 lg:gap-5">

        <LiveClock />

        <ThemeToggle />
        
        <NotificationBell />

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-blue text-white flex items-center justify-center text-[12px] font-bold shadow-sm">
            {user?.initials}
          </div>
          <span className="text-[14px] font-medium tracking-wide select-none">{user?.name}</span>
        </div>
        
        <div className="hidden sm:block ml-2 mr-2 w-px h-6 bg-nav-text opacity-20"></div>

        <span className="border-[1px] border-nav-text opacity-80 text-nav-text text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-widest hidden sm:inline-block">
          {user?.role === 'administrator' ? 'Admin' : user?.role === 'manager' ? 'Manager' : 'Employee'}
        </span>
        <button 
          onClick={logout} 
          className="ml-2 bg-bg-card text-text-primary border border-line px-4 py-1.5 rounded-sm text-[13px] font-bold hover:bg-sidebar-active-bg transition-colors shadow-sm"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
