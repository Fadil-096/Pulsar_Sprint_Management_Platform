import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Topbar() {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="flex items-center justify-between px-6 h-[64px] bg-[#020024] border-b-[1px] border-[#1A2342] sticky top-0 z-50 text-white">
      <div className="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 338.667 79.687" aria-label="Nokia" style={{ height: '20px', width: 'auto', display: 'block' }} fill="#fff">
          <path d="M114.194 1.145c-21.865 0-38.831 15.914-38.831 38.698 0 23.81 16.965 38.699 38.831 38.698s38.866-14.889 38.831-38.698c-.032-21.587-16.965-38.698-38.831-38.698zm0 10.654c15.258 0 27.627 11.484 27.627 28.044 0 16.867-12.369 28.045-27.627 28.045S86.567 56.709 86.567 39.843c0-16.561 12.369-28.044 27.627-28.044zm119.913-9.376v74.839h11.224V2.423zm-30.985 0l-41.655 37.419 41.655 37.42h16.702l-41.718-37.42 41.718-37.419zM296.843 0l-6.092 11.252 20.667 38.388h-41.447l-14.953 27.623h12.348l9.03-16.573h40.895l9.029 16.573h12.347zM0 0v77.263h11.455v-51.06L70.98 79.686V63.667z"/>
        </svg>
        <div className="h-[20px] w-[1px] bg-white/20 mx-4"></div>
        <div className="text-[18px] font-semibold text-blue-600 tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          Sprint
        </div>
      </div>
      
      <div className="flex items-center gap-5">
        <span className="border-[1px] border-white/30 text-white text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-widest">
          {user?.role === 'manager' ? 'Manager' : 'Employee'}
        </span>
        <div className="relative" ref={profileRef}>
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[12px] font-bold">
              {user?.initials}
            </div>
            <span className="text-[14px] font-medium tracking-wide select-none">{user?.name}</span>
          </div>
          
          {profileOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-white rounded-md shadow-xl py-1 border border-gray-100 z-50 text-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
              <Link 
                to={`/${user?.role === 'manager' ? 'manager' : 'employee'}/attendance`} 
                className="block px-4 py-2.5 text-[13px] font-medium hover:bg-gray-50 transition-colors"
                onClick={() => setProfileOpen(false)}
              >
                Attendance Log
              </Link>
              <Link 
                to={`/${user?.role === 'manager' ? 'manager' : 'employee'}/settings`} 
                className="block px-4 py-2.5 text-[13px] font-medium hover:bg-gray-50 transition-colors"
                onClick={() => setProfileOpen(false)}
              >
                Settings
              </Link>
            </div>
          )}
        </div>
        <NotificationBell />
        <button 
          onClick={logout} 
          className="ml-2 bg-white text-blue-600 px-4 py-1.5 rounded-sm text-[13px] font-bold hover:bg-gray-100 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
