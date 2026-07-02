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
  const [email, setEmail] = useState('lars.henrik@nokia.com');
  const [password, setPassword] = useState('Nokia@123');
  const [role, setRole] = useState('manager');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'administrator') {
      setEmail('admin@nokia.com');
      setPassword('NokiaAdmin!2026');
    } else if (selectedRole === 'manager') {
      setEmail('lars.henrik@nokia.com');
      setPassword('Nokia@123');
    } else {
      setEmail('sami.kapanen@nokia.com');
      setPassword('Nokia@123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password, role);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };


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
                      className={`flex-1 text-[13px] font-bold tracking-wide transition-colors ${role === 'administrator' ? 'bg-accent-blue text-white' : 'text-text-secondary hover:text-text-primary'}`}
                      onClick={() => handleRoleChange('administrator')}
                    >
                      ADMIN
                    </button>
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
        </div>
      </div>
    </div>
  );
}
