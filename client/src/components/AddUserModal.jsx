import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { X, UserPlus, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';

export default function AddUserModal({ onClose, onSuccess }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    team: '',
    subTeam: '',
    department: 'Engineering'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.name || !formData.email || !formData.password) {
      setError('Name, email, and password are required.');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/users', formData, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setSuccess('User created successfully!');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while creating the user.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div 
        className="bg-bg-card rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-line-light flex items-center justify-between bg-bg-secondary">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-accent-blue flex items-center justify-center">
              <UserPlus size={16} />
            </div>
            <h2 className="text-lg font-bold text-text-primary">Add New User</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-text-muted hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium flex items-center gap-2">
              <CheckCircle2 size={16} />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-bg-secondary border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="e.g. Jane Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-bg-secondary border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="jane@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase tracking-wide">Password</label>
                <input
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-bg-secondary border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Temporary password"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase tracking-wide">Role</label>
                <div className="relative">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-bg-secondary border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase tracking-wide">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-bg-secondary border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="e.g. Engineering"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase tracking-wide">Team (Optional)</label>
                <input
                  type="text"
                  name="team"
                  value={formData.team}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-bg-secondary border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="e.g. Frontend"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase tracking-wide">Sub Team (Optional)</label>
                <input
                  type="text"
                  name="subTeam"
                  value={formData.subTeam}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-bg-secondary border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="e.g. Core UI"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-line-light mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-bold text-text-secondary bg-bg-card border border-line rounded-lg hover:bg-table-row-alt transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || success}
                className="px-6 py-2 text-sm font-bold text-white bg-accent-blue rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
