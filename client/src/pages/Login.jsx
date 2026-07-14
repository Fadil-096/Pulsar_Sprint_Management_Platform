import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Clock, LogIn, LogOut, CheckCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { Starfield } from '../components/Starfield';
import { useLoader } from '../context/LoaderContext';


import { AdvancedSpaceBackground } from '../components/AdvancedSpaceBackground';

export default function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { startLoader } = useLoader();
  
  // Login form states
  const [email, setEmail] = useState('shane@arc.com');
  const [password, setPassword] = useState('arc@123');
  const [role, setRole] = useState('manager');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'administrator') {
      setEmail('fadil@arc.com');
      setPassword('arc@123');
    } else if (selectedRole === 'manager') {
      setEmail('shane@arc.com');
      setPassword('arc@123');
    } else {
      setEmail('divi@arc.com');
      setPassword('arc@123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    startLoader();
    try {
      const user = await login(email, password, role);
      // Allow time for the smooth fade-to-black transition before unmounting
      setTimeout(() => {
        navigate('/');
      }, 600);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-black text-text-primary">
      <AdvancedSpaceBackground />
      {/* LEFT PANEL - Dark Navy Branding */}
      <div className="relative w-full md:w-[55%] flex flex-col items-center justify-center p-12 overflow-hidden bg-transparent z-10">
        <div className="relative z-10 flex flex-col items-center justify-center gap-0 pointer-events-none" style={{ marginTop: '40px' }}>
          <img 
            src="/Pulsar_logo_transparent.png" 
            alt="Pulsar" 
            style={{ 
              width: '460px', 
              height: 'auto', 
              imageRendering: '-webkit-optimize-contrast',
              WebkitFontSmoothing: 'antialiased'
            }} 
            className="object-contain" 
          />
          <div style={{ marginTop: '-24px', fontSize: '18px', fontWeight: 400, letterSpacing: '8px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', textAlign: 'center', zIndex: 10, position: 'relative' }}>
            Sprint
          </div>
          <div style={{ marginTop: '12px', fontSize: '20px', fontWeight: 300, letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
            Sprint Smarter. Deliver Faster.
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Form & Attendance */}
      <div className="relative w-full md:w-[45%] flex items-center justify-center p-12 md:p-16 overflow-hidden transition-colors duration-300 bg-transparent z-10">
        <style>{`
          .space-input {
            background: #0a0a0a;
            border: 1px solid #222;
            color: #fff;
            border-radius: 6px;
            transition: all 0.2s ease;
          }
          .space-input::placeholder {
            color: #555;
          }
          .space-input:focus {
            outline: none;
            border: 1px solid #666;
            box-shadow: 0 0 0 1px #666;
          }

          .space-btn {
            background: #fff;
            color: #000;
            font-weight: 500;
            border-radius: 6px;
            transition: all 0.2s ease;
          }
          .space-btn:hover {
            background: #e5e5e5;
          }

          .role-btn {
            background: transparent;
            border: none;
            color: #666;
            transition: all 0.2s ease;
          }
          .role-btn.active {
            background: #222;
            color: #fff;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.5);
          }
        `}</style>

        <div className="w-full max-w-[420px] transition-all duration-300 relative z-10 p-8">

          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-10">
              <h2 className="text-[32px] font-semibold tracking-tight mb-2 text-white">Sign In</h2>
              <p className="text-[15px] text-[#888]">Continue to your workspace.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="mb-6">
                <label className="block text-[12px] font-medium tracking-wide uppercase mb-2 text-[#888]">
                  Email Address
                </label>
                <input 
                  type="email" 
                  className="w-full px-3.5 py-3 space-input text-[14px]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[12px] font-medium tracking-wide uppercase text-[#888]">
                    Password
                  </label>
                  <a href="#" className="text-[12px] font-medium text-[#888] hover:text-white transition-colors">Forgot Password?</a>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="w-full px-3.5 py-3 pr-10 space-input text-[14px]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5 opacity-70" /> : <Eye className="w-5 h-5 opacity-70" />}
                  </button>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-[12px] font-medium tracking-wide uppercase mb-2 text-[#888]">
                  Select Role
                </label>
                <div className="flex w-full rounded-md overflow-hidden h-[42px] p-1" style={{ backgroundColor: '#0a0a0a', border: '1px solid #222' }}>
                  <button
                    type="button"
                    className={`flex-1 text-[12px] font-semibold tracking-wide role-btn mx-0.5 ${role === 'administrator' ? 'active' : ''}`}
                    onClick={() => handleRoleChange('administrator')}
                  >
                    ADMIN
                  </button>
                  <button
                    type="button"
                    className={`flex-1 text-[12px] font-semibold tracking-wide role-btn mx-0.5 ${role === 'manager' ? 'active' : ''}`}
                    onClick={() => handleRoleChange('manager')}
                  >
                    MANAGER
                  </button>
                  <button
                    type="button"
                    className={`flex-1 text-[12px] font-semibold tracking-wide role-btn mx-0.5 ${role === 'employee' ? 'active' : ''}`}
                    onClick={() => handleRoleChange('employee')}
                  >
                    EMPLOYEE
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-badge-rejected-bg text-badge-rejected-text border-[1px] border-badge-rejected-bg px-3.5 py-2.5 rounded-xl text-[13px] mb-6">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                className="w-full py-3.5 space-btn text-[15px]"
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
