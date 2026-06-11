import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('kaisa.laine@nokia.com'); // Using seed user for easy login
  const [password, setPassword] = useState('Nokia@123');
  const [role, setRole] = useState('manager');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  // According to seed.js, we have manager (kaisa.laine@nokia.com) and employee (mikko.virtanen@nokia.com)
  // Let's set defaults based on role selection to match the seed data
  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'manager') {
      setEmail('kaisa.laine@nokia.com');
    } else {
      setEmail('mikko.virtanen@nokia.com');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, role);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white text-text-primary">
      {/* LEFT PANEL - Dark Navy Branding */}
      <div className="relative w-full md:w-[55%] flex flex-col items-center justify-center p-12 overflow-hidden" style={{ backgroundColor: '#020024' }}>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 338.667 79.687" aria-label="Nokia" style={{ height: '32px', width: 'auto', display: 'block' }} fill="#fff">
              <path d="M114.194 1.145c-21.865 0-38.831 15.914-38.831 38.698 0 23.81 16.965 38.699 38.831 38.698s38.866-14.889 38.831-38.698c-.032-21.587-16.965-38.698-38.831-38.698zm0 10.654c15.258 0 27.627 11.484 27.627 28.044 0 16.867-12.369 28.045-27.627 28.045S86.567 56.709 86.567 39.843c0-16.561 12.369-28.044 27.627-28.044zm119.913-9.376v74.839h11.224V2.423zm-30.985 0l-41.655 37.419 41.655 37.42h16.702l-41.718-37.42 41.718-37.419zM296.843 0l-6.092 11.252 20.667 38.388h-41.447l-14.953 27.623h12.348l9.03-16.573h40.895l9.029 16.573h12.347zM0 0v77.263h11.455v-51.06L70.98 79.686V63.667z"/>
            </svg>
            <div className="h-[42px] w-[1px] bg-white/20 mx-5"></div>
            <div className="text-[42px] font-semibold text-blue-600 tracking-tight leading-none" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Sprint
            </div>
          </div>
          
          <div className="text-[18px] text-white/90 font-light tracking-wide mt-2">
            Sprint Smarter. Deliver Faster.
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Form */}
      <div className="w-full md:w-[45%] bg-white flex items-center justify-center p-12 md:p-16">
        <div className="w-full max-w-[420px]">
          <div className="mb-10">
            <h2 className="text-[32px] font-bold text-gray-900 tracking-tight mb-2">Sign In</h2>
            <p className="text-[15px] text-gray-500">Use your Nokia work account credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="mb-6">
              <label className="block text-[11px] font-bold text-gray-500 tracking-wider uppercase mb-2">
                Email Address
              </label>
              <input 
                type="email" 
                className="w-full px-3.5 py-3 border-[1px] border-gray-200 rounded text-[14px] bg-white text-gray-900 focus:outline-none focus:border-blue-600 transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[11px] font-bold text-gray-500 tracking-wider uppercase">
                  Password
                </label>
                <a href="#" className="text-[12px] font-semibold text-blue-600 hover:underline">Forgot Password?</a>
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                className="w-full px-3.5 py-3 border-[1px] border-gray-200 rounded text-[14px] bg-white text-gray-900 focus:outline-none focus:border-blue-600 transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="mb-8 flex items-center gap-2">
              <input 
                type="checkbox" 
                id="showPassword" 
                className="w-4 h-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer" 
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
              />
              <label htmlFor="showPassword" className="text-[13px] text-gray-500 cursor-pointer select-none">Show Password</label>
            </div>

            <div className="mb-8">
              <label className="block text-[11px] font-bold text-gray-500 tracking-wider uppercase mb-2">
                Select Role
              </label>
              <div className="flex w-full bg-[#f4f4f5] rounded overflow-hidden h-[42px] border-[1px] border-gray-200">
                <button
                  type="button"
                  className={`flex-1 text-[13px] font-bold tracking-wide transition-colors ${role === 'manager' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => handleRoleChange('manager')}
                >
                  MANAGER
                </button>
                <button
                  type="button"
                  className={`flex-1 text-[13px] font-bold tracking-wide transition-colors ${role === 'employee' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => handleRoleChange('employee')}
                >
                  EMPLOYEE
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 border-[1px] border-red-200 px-3.5 py-2.5 rounded text-[13px] mb-6">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full py-3.5 bg-blue-600 text-white border-none rounded text-[15px] font-bold tracking-wide transition-colors hover:bg-blue-700 active:bg-blue-800"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
