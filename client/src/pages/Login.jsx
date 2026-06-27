import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Clock, LogIn, LogOut, CheckCircle } from 'lucide-react';
import axios from 'axios';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex h-[28px] w-[56px] shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-opacity-75 ${isDark ? 'bg-[#334155]' : 'bg-[#0066CC]'}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <span className="sr-only">Toggle Theme</span>
      <span
        className={`pointer-events-none absolute flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isDark ? 'translate-x-[14px]' : '-translate-x-[14px]'}`}
      >
        {isDark ? <Moon size={12} className="text-gray-800" /> : <Sun size={12} className="text-[#0066CC]" />}
      </span>
    </button>
  );
};

export default function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  
  // Login form states
  const [email, setEmail] = useState('hari.krishnan@nokia.com');
  const [password, setPassword] = useState('nokia@123');
  const [role, setRole] = useState('manager');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Attendance flow states
  const [authStage, setAuthStage] = useState('login'); // 'login' | 'attendance'
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [now, setNow] = useState(new Date());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Authenticated user data for greeting
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    if (authStage === 'attendance') {
      const interval = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(interval);
    }
  }, [authStage]);

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'manager') {
      setEmail('hari.krishnan@nokia.com');
    } else {
      setEmail('aditya.patel@nokia.com');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password, role);
      setAuthUser(user);
      
      // Transition to Attendance state for both roles
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get('/api/attendance/today', { headers: { Authorization: `Bearer ${token}` } });
        setAttendanceRecord(res.data || null);
      } catch (err) {
        console.error("Failed to fetch attendance", err);
      }
      setAuthStage('attendance');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceAction = async (action) => {
    setProcessing(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post('/api/attendance/action', { action }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendanceRecord(res.data);
      
      if (action === 'skip') {
        navigate('/');
        return;
      }

      const actionText = action === 'check-in' ? 'Checked in' : 'Checked out';
      const timeText = action === 'check-in' ? res.data.check_in : res.data.check_out;
      const formattedTime = new Date(`1970-01-01T${timeText}Z`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      setSuccessMessage(`${actionText} at ${formattedTime}`);
      
      setTimeout(async () => {
        if (action === 'check-out') {
          await logout();
          setAuthStage('login');
          setSuccessMessage(null);
          setAttendanceRecord(null);
        } else {
          navigate('/');
        }
      }, 1500);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(`1970-01-01T${timeString}Z`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const hasCheckedIn = !!(attendanceRecord && attendanceRecord.check_in);
  const hasCheckedOut = !!(attendanceRecord && attendanceRecord.check_out);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg-card text-text-primary">
      {/* LEFT PANEL - Dark Navy Branding */}
      <div className="relative w-full md:w-[55%] flex flex-col items-center justify-center p-12 overflow-hidden" style={{ backgroundColor: '#020024' }}>
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 338.667 79.687" aria-label="Nokia" style={{ height: '48px', width: 'auto', display: 'block' }} fill="#fff">
              <path d="M114.194 1.145c-21.865 0-38.831 15.914-38.831 38.698 0 23.81 16.965 38.699 38.831 38.698s38.866-14.889 38.831-38.698c-.032-21.587-16.965-38.698-38.831-38.698zm0 10.654c15.258 0 27.627 11.484 27.627 28.044 0 16.867-12.369 28.045-27.627 28.045S86.567 56.709 86.567 39.843c0-16.561 12.369-28.044 27.627-28.044zm119.913-9.376v74.839h11.224V2.423zm-30.985 0l-41.655 37.419 41.655 37.42h16.702l-41.718-37.42 41.718-37.419zM296.843 0l-6.092 11.252 20.667 38.388h-41.447l-14.953 27.623h12.348l9.03-16.573h40.895l9.029 16.573h12.347zM0 0v77.263h11.455v-51.06L70.98 79.686V63.667z"/>
            </svg>
            <div className="h-[64px] w-[1px] bg-white/20 mx-6"></div>
            <div className="text-[64px] font-semibold text-[#3B82F6] tracking-tight leading-none" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Sprint
            </div>
          </div>
          <div className="text-[24px] text-white/90 font-light tracking-wide mt-6">
            Sprint Smarter. Deliver Faster.
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Form & Attendance */}
      <div className="relative w-full md:w-[45%] bg-bg-card flex items-center justify-center p-12 md:p-16">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[420px] transition-all duration-300">
          {authStage === 'login' ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-10">
                <h2 className="text-[32px] font-bold text-text-primary tracking-tight mb-2">Sign In</h2>
                <p className="text-[15px] text-text-secondary">Use your Nokia work account credentials</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col">
                <div className="mb-6">
                  <label className="block text-[11px] font-bold text-text-secondary tracking-wider uppercase mb-2">
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    className="w-full px-3.5 py-3 border-[1px] border-line rounded text-[14px] bg-bg-card text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[11px] font-bold text-text-secondary tracking-wider uppercase">
                      Password
                    </label>
                    <a href="#" className="text-[12px] font-semibold text-accent-blue hover:underline">Forgot Password?</a>
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="w-full px-3.5 py-3 border-[1px] border-line rounded text-[14px] bg-bg-card text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-8 flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="showPassword" 
                    className="w-4 h-4 rounded-sm border-line text-accent-blue focus:ring-accent-blue cursor-pointer" 
                    checked={showPassword}
                    onChange={() => setShowPassword(!showPassword)}
                  />
                  <label htmlFor="showPassword" className="text-[13px] text-text-secondary cursor-pointer select-none">Show Password</label>
                </div>

                <div className="mb-8">
                  <label className="block text-[11px] font-bold text-text-secondary tracking-wider uppercase mb-2">
                    Select Role
                  </label>
                  <div className="flex w-full bg-bg-secondary rounded overflow-hidden h-[42px] border-[1px] border-line">
                    <button
                      type="button"
                      className={`flex-1 text-[13px] font-bold tracking-wide transition-colors ${role === 'manager' ? 'bg-accent-blue text-white' : 'text-text-secondary hover:text-text-primary'}`}
                      onClick={() => handleRoleChange('manager')}
                    >
                      MANAGER
                    </button>
                    <button
                      type="button"
                      className={`flex-1 text-[13px] font-bold tracking-wide transition-colors ${role === 'employee' ? 'bg-accent-blue text-white' : 'text-text-secondary hover:text-text-primary'}`}
                      onClick={() => handleRoleChange('employee')}
                    >
                      EMPLOYEE
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-badge-rejected-bg text-badge-rejected-text border-[1px] border-badge-rejected-bg px-3.5 py-2.5 rounded text-[13px] mb-6">
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="w-full py-3.5 bg-accent-blue text-white border-none rounded text-[15px] font-bold tracking-wide transition-colors hover:opacity-90 active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col w-full">
              {successMessage ? (
                <div className="flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in duration-300">
                  <CheckCircle size={56} className="text-semantic-success-text mb-4" />
                  <h2 className="text-xl font-bold text-text-primary">{successMessage}</h2>
                  <p className="text-sm text-text-secondary mt-2">Routing to dashboard...</p>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h2 className="text-[32px] font-bold text-text-primary tracking-tight mb-2">
                      Hi, {authUser?.name?.split(' ')[0]}
                    </h2>
                    <div className="flex items-center text-[15px] text-text-secondary mb-1">
                      <Clock size={16} className="mr-2" />
                      <span>{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} at {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                    
                    <p className="text-[14px] text-text-muted italic mt-4 border-l-2 border-line pl-3">
                      {!hasCheckedIn 
                        ? "You have not checked in yet today."
                        : !hasCheckedOut
                          ? `Checked in at ${formatTime(attendanceRecord.check_in)} — not yet checked out.`
                          : `Attendance recorded for today. Check in: ${formatTime(attendanceRecord.check_in)} · Check out: ${formatTime(attendanceRecord.check_out)}.`
                      }
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full mb-8">
                    {/* Check In Button */}
                    <button
                      onClick={() => handleAttendanceAction('check-in')}
                      disabled={hasCheckedIn || processing}
                      className={`flex flex-col items-center justify-center py-5 px-3 rounded transition-all border-[1px] ${
                        hasCheckedIn 
                          ? 'bg-bg-secondary border-line opacity-60 cursor-not-allowed' 
                          : 'bg-semantic-success-bg/10 border-semantic-success-text/30 hover:bg-semantic-success-bg/20 text-semantic-success-text cursor-pointer hover:shadow-sm'
                      }`}
                    >
                      <LogIn size={24} className={`mb-2 ${hasCheckedIn ? 'text-text-muted' : 'text-semantic-success-text'}`} />
                      <span className={`text-[15px] font-bold ${hasCheckedIn ? 'text-text-secondary' : 'text-semantic-success-text'}`}>Check In</span>
                      {hasCheckedIn && (
                        <span className="text-[11px] text-text-muted mt-1.5 font-medium">
                          Checked in at {formatTime(attendanceRecord.check_in)}
                        </span>
                      )}
                    </button>

                    {/* Check Out Button */}
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={!hasCheckedIn || hasCheckedOut || processing}
                      className={`flex flex-col items-center justify-center py-5 px-3 rounded transition-all border-[1px] ${
                        (!hasCheckedIn || hasCheckedOut)
                          ? 'bg-bg-secondary border-line opacity-60 cursor-not-allowed' 
                          : 'bg-red-50 border-red-200 hover:bg-red-100 text-red-600 cursor-pointer hover:shadow-sm dark:bg-red-900/20 dark:border-red-700/30 dark:text-red-500 dark:hover:bg-red-900/40'
                      }`}
                    >
                      <LogOut size={24} className={`mb-2 ${(!hasCheckedIn || hasCheckedOut) ? 'text-text-muted' : 'text-red-600 dark:text-red-500'}`} />
                      <span className={`text-[15px] font-bold ${(!hasCheckedIn || hasCheckedOut) ? 'text-text-secondary' : 'text-red-600 dark:text-red-500'}`}>Check Out</span>
                      
                      {!hasCheckedIn ? (
                        <span className="text-[11px] text-text-muted mt-1.5 font-medium">Check in first</span>
                      ) : hasCheckedOut ? (
                        <span className="text-[11px] text-text-muted mt-1.5 font-medium">Checked out at {formatTime(attendanceRecord.check_out)}</span>
                      ) : null}
                    </button>
                  </div>

                  {error && (
                    <div className="bg-badge-rejected-bg text-badge-rejected-text border-[1px] border-badge-rejected-bg px-3.5 py-2.5 rounded text-[13px] mb-6 text-center">
                      {error}
                    </div>
                  )}

                  <div className="text-center mt-2">
                    <button
                      onClick={() => handleAttendanceAction('skip')}
                      disabled={processing}
                      className="text-[13px] font-medium text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                    >
                      Skip, go to dashboard &rarr;
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal Overlay */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-bg-card border-[1px] border-line rounded-lg shadow-xl p-6 w-[90%] max-w-[400px] animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-text-primary mb-2">Check Out Confirmation</h3>
            <p className="text-[15px] text-text-secondary mb-6">Are you sure you want to check out for the day? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors"
                disabled={processing}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowConfirmModal(false);
                  handleAttendanceAction('check-out');
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[14px] font-bold rounded transition-colors shadow-sm disabled:opacity-50"
                disabled={processing}
              >
                Yes, Check Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
