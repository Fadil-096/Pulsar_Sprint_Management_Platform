import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, Mail, Users as UsersIcon, Eye, EyeOff, ChevronDown } from 'lucide-react';

export default function UserManagement() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'employee', department: '', team: '', sub_team: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await axios.post('/api/admin/users', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'employee', department: '', team: '', sub_team: '' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add user');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 text-text-primary h-full flex flex-col overflow-hidden bg-bg-primary">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <UsersIcon className="text-accent-blue" />
            User Management
          </h1>
          <p className="text-text-secondary">Manage system administrators, managers, and employees.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors">
          <Plus size={18} /> Add User
        </button>
      </div>

      <div className="bg-bg-card border-[1px] border-line rounded-2xl flex-1 flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b-[1px] border-line flex items-center justify-between shrink-0 bg-bg-secondary/30">
          <div className="relative w-[300px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg-primary border-[1px] border-line rounded-xl py-2 pl-9 pr-4 text-[13px] focus:outline-none focus:border-accent-blue text-text-primary transition-colors"
            />
          </div>
          <div className="text-[13px] text-text-secondary">
            Showing {filteredUsers.length} users
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-8 text-center text-text-secondary">Loading users...</div>
          ) : (
            <table className="w-full text-left table-fixed">
              <thead className="sticky top-0 bg-bg-secondary z-10 shadow-sm">
                <tr>
                  <th className="py-3 px-6 text-[11px] font-bold uppercase tracking-wider text-text-secondary border-b-[1px] border-line" style={{width: '33.33%'}}>Name</th>
                  <th className="py-3 px-6 text-[11px] font-bold uppercase tracking-wider text-text-secondary border-b-[1px] border-line text-center" style={{width: '33.33%'}}>Role</th>
                  <th className="py-3 px-6 text-[11px] font-bold uppercase tracking-wider text-text-secondary border-b-[1px] border-line text-right" style={{width: '33.33%'}}>Team & Dept</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-text-secondary text-[14px]">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                      <td className="py-3 px-6">
                        <div className="font-medium text-[14px] text-text-primary">{user.name}</div>
                        <div className="text-[12px] text-text-secondary flex items-center gap-1 mt-0.5">
                          <Mail size={12} /> {user.email}
                        </div>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-xl text-[11px] font-bold tracking-wide uppercase ${user.role === 'manager' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <div className="text-[13px] text-text-primary whitespace-nowrap">{user.team} {user.sub_team ? `/ ${user.sub_team}` : ''} · <span className="text-text-secondary">{user.department || 'No Dept'}</span></div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2330] rounded-2xl w-full max-w-[550px] flex flex-col shadow-2xl">
            <div className="px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#e2e8f0] p-2 rounded-full text-[#1e2330]">
                  <UsersIcon size={18} />
                </div>
                <h2 className="text-[18px] font-bold text-white">Add New User</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="px-6 pb-6 pt-2 flex flex-col gap-5">
              {error && <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">{error}</div>}
              
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <input required type="text" placeholder="e.g. Jane Doe" className="w-full bg-[#181c25] border border-white/5 rounded-2xl px-3 py-2.5 text-[14px] text-white focus:outline-none focus:border-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                  <input required type="email" placeholder="jane@company.com" className="w-full bg-[#181c25] border border-white/5 rounded-2xl px-3 py-2.5 text-[14px] text-white focus:outline-none focus:border-blue-500" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <input required type={showPassword ? "text" : "password"} placeholder="Temporary password" className="w-full bg-[#181c25] border border-white/5 rounded-2xl px-3 py-2.5 pr-10 text-[14px] text-white focus:outline-none focus:border-blue-500" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div className="relative">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Role</label>
                  <div 
                    className="w-full bg-[#181c25] border border-white/5 rounded-2xl px-3 py-2.5 text-[14px] text-white flex justify-between items-center cursor-pointer select-none focus:outline-none focus:border-blue-500"
                    onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  >
                    <span className="capitalize">{formData.role}</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {roleDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-[#181c25] border border-white/5 rounded-2xl shadow-xl overflow-hidden z-10">
                      {['employee', 'manager', 'administrator'].map((roleOption) => (
                        <div
                          key={roleOption}
                          className="px-4 py-3 text-[14px] text-white hover:bg-[#3b82f6] cursor-pointer capitalize transition-colors"
                          onClick={() => {
                            setFormData({...formData, role: roleOption});
                            setRoleDropdownOpen(false);
                          }}
                        >
                          {roleOption}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-[14px] font-medium text-white transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl text-[14px] font-medium bg-[#3b82f6] hover:bg-blue-600 text-white transition-colors disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
