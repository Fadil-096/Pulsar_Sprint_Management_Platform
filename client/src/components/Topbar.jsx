import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import NotificationBell from './NotificationBell';
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
  const { user, logout, token } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutConfirm, setShowCheckOutConfirm] = useState(false);
  const [showCheckInToast, setShowCheckInToast] = useState(false);
  const [showCheckOutToast, setShowCheckOutToast] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    if (token) {
      axios.get('/api/attendance/today', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          setAttendance(res.data);
          if (!res.data.check_in_time) {
            setShowCheckInModal(true);
          }
        })
        .catch(err => console.error(err));
    }
  }, [token]);

  const handleCheckIn = async () => {
    try {
      await axios.post('/api/attendance/check-in', {}, { headers: { Authorization: `Bearer ${token}` } });
      const res = await axios.get('/api/attendance/today', { headers: { Authorization: `Bearer ${token}` } });
      setAttendance(res.data);
      setShowCheckInModal(false);
      setShowCheckInToast(true);
      setTimeout(() => setShowCheckInToast(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to check in');
    }
  };

  const handleCheckOutClick = () => {
    setShowCheckOutConfirm(true);
  };

  const confirmCheckOut = async () => {
    setShowCheckOutConfirm(false);
    try {
      await axios.post('/api/attendance/check-out', {}, { headers: { Authorization: `Bearer ${token}` } });
      const res = await axios.get('/api/attendance/today', { headers: { Authorization: `Bearer ${token}` } });
      setAttendance(res.data);
      setShowCheckOutToast(true);
      setTimeout(() => setShowCheckOutToast(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to check out');
    }
  };

  return (
    <nav className="flex items-center justify-between px-6 h-[64px] bg-nav-bg sticky top-0 z-50 text-nav-text">
      <div className="flex items-center">
        <img 
          src="/Pulsar_logo_dark.png" 
          alt="Pulsar" 
          style={{ height: '52px', width: 'auto' }} 
          className="hidden dark:block mix-blend-lighten contrast-125 brightness-125 origin-left object-contain translate-y-1" 
        />
        <div className="dark:hidden text-[20px] font-bold text-[#020024] tracking-widest" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          PULSAR
        </div>
        <div className="h-[20px] w-[1px] bg-nav-text opacity-20 mx-4"></div>
        <div className="text-[18px] font-semibold text-accent-blue tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          Sprint
        </div>
      </div>
      
      <div className="flex items-center gap-4 lg:gap-5">
        
        {/* Check In / Out Widget */}
        <div className="hidden md:flex items-center">
          {attendance?.check_in_time && !attendance?.check_out_time ? (
            <button 
              onClick={handleCheckOutClick}
              className="bg-orange-500/10 text-orange-400 border border-orange-500 px-3 py-1 rounded-xl text-xs font-bold hover:bg-orange-500 hover:text-white hover:shadow-[0_0_12px_rgba(249,115,22,0.4)] transition-all outline-none focus:outline-none"
            >
              Check Out
            </button>
          ) : attendance?.check_out_time ? (
            <span className="text-green-500 text-xs font-bold px-3 py-1 bg-green-500/10 rounded-xl border border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.2)]">Checked Out</span>
          ) : (
            <button 
              onClick={() => setShowCheckInModal(true)}
              className="bg-accent-blue/10 text-accent-blue border border-accent-blue px-3 py-1 rounded-xl text-xs font-bold hover:bg-accent-blue hover:text-white hover:shadow-[0_0_12px_rgba(37,99,235,0.4)] transition-all outline-none focus:outline-none"
            >
              Check In
            </button>
          )}
        </div>

        <LiveClock />
        
        <NotificationBell />

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-blue text-white flex items-center justify-center text-[12px] font-bold shadow-sm">
            {user?.initials}
          </div>
          <span className="text-[14px] font-medium tracking-wide select-none">{user?.name}</span>
        </div>
        
        <div className="hidden sm:block ml-2 mr-2 w-px h-6 bg-nav-text opacity-20"></div>

        <span className="border-[1px] border-nav-text opacity-80 text-nav-text text-[10px] font-bold px-2.5 py-1 rounded-xl uppercase tracking-widest hidden sm:inline-block">
          {user?.role === 'administrator' ? 'Admin' : user?.role === 'manager' ? 'Manager' : 'Employee'}
        </span>
        <button 
          onClick={logout} 
          className="ml-2 bg-white text-black px-4 py-1.5 rounded-[4px] text-[13px] font-semibold hover:bg-[#e5e5e5] transition-all shadow-sm"
        >
          Sign out
        </button>
      </div>

      {/* Forced Check-In Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-bg-card border border-line rounded-2xl w-full max-w-md shadow-2xl p-6 text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-accent-blue/10 text-accent-blue rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Welcome Back, {user?.name.split(' ')[0]}!</h2>
            <p className="text-text-secondary mb-6">Please check in to start your work day.</p>
            
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setShowCheckInModal(false)}
                className="px-6 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-secondary rounded-2xl transition-colors"
              >
                Remind Me Later
              </button>
              <button 
                onClick={handleCheckIn}
                className="px-8 py-2.5 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-2xl font-bold shadow-md transition-colors"
              >
                Check In Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check Out Confirmation Modal */}
      {showCheckOutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-bg-primary border border-line p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-accent-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-accent-blue" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Check Out?</h2>
            <p className="text-text-secondary mb-6">Are you sure you want to end your shift and check out for the day?</p>
            
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setShowCheckOutConfirm(false)}
                className="flex-1 py-2.5 rounded-2xl border border-line text-text-primary font-bold hover:bg-bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmCheckOut}
                className="flex-1 py-2.5 rounded-2xl bg-accent-blue text-white font-bold shadow-lg shadow-accent-blue/20 hover:brightness-110 transition-all"
              >
                Yes, Check Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check In Success Toast */}
      <div 
        className={`fixed left-1/2 transform -translate-x-1/2 z-[200] transition-all duration-500 ease-in-out ${
          showCheckInToast 
            ? 'top-6 opacity-100 scale-100 pointer-events-auto' 
            : '-top-10 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-[0_4px_20px_rgba(34,197,94,0.4)] flex items-center gap-3">
          <div className="bg-white/20 p-1 rounded-full flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-wide">
            Hi {user?.name?.split(' ')[0] || user?.name}, you've successfully checked in
          </span>
        </div>
      </div>

      {/* Check Out Success Toast */}
      <div 
        className={`fixed left-1/2 transform -translate-x-1/2 z-[200] transition-all duration-500 ease-in-out ${
          showCheckOutToast 
            ? 'top-6 opacity-100 scale-100 pointer-events-auto' 
            : '-top-10 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-orange-500 text-white px-6 py-3 rounded-full shadow-[0_4px_20px_rgba(249,115,22,0.4)] flex items-center gap-3">
          <div className="bg-white/20 p-1 rounded-full flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-wide">
            Hi {user?.name?.split(' ')[0] || user?.name}, you've successfully checked out
          </span>
        </div>
      </div>
    </nav>
  );
}
