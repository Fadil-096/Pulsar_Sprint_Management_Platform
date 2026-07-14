import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { X, ExternalLink, Calendar, CheckCircle2, Clock, Edit2, AlertCircle, Trash2 } from 'lucide-react';


export default function EmployeeProfileModal({ employee, onClose, onUpdate, onDelete }) {
  const { token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [formData, setFormData] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    newPassword: '',
    role: employee?.role || 'employee',
    department: employee?.department || '',
    team: employee?.team || '',
    subTeam: employee?.subTeam || ''
  });

  if (!employee) return null;



  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      setError('');
      setLoading(true);
      await axios.put(`/api/users/${employee.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update employee');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setError('');
      setLoading(true);
      await axios.delete(`/api/users/${employee.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onDelete) onDelete();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove employee');
      setLoading(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#f8f9fc] rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-bg-card border-b border-line p-6 flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-2xl font-bold border-2 border-blue-200">
              {employee.initials}
            </div>
            <div>
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="text-2xl font-bold text-text-primary bg-bg-secondary border border-line rounded-xl px-2 py-1 w-64 focus:outline-none focus:border-blue-500"
                    placeholder="Full Name"
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="text-sm bg-bg-secondary border border-line rounded-xl px-2 py-1 w-64 focus:outline-none focus:border-blue-500"
                    placeholder="Email"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-text-primary">{employee.name}</h2>
                  <div className="text-sm font-medium text-text-secondary mt-1 uppercase tracking-wider">{employee.role} • {employee.department}</div>
                  <div className="text-xs text-text-muted mt-0.5">{employee.team} ({employee.subTeam})</div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-text-muted hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Edit Profile"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Remove Employee"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 text-text-muted hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">

          {error && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-sm font-medium flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {confirmDelete && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-red-800">Remove {employee.name}?</p>
                <p className="text-xs text-red-600 mt-0.5">This action cannot be undone.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-xs font-bold text-text-secondary bg-bg-card border border-line rounded-2xl hover:bg-table-row-alt"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 rounded-2xl hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Removing...' : 'Yes, Remove'}
                </button>
              </div>
            </div>
          )}

          {isEditing ? (
            <div className="bg-bg-card p-6 rounded-2xl shadow-sm border border-line">
              <h3 className="text-sm font-bold text-text-primary mb-4 uppercase tracking-wider">Organizational Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase tracking-wide">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full p-2 bg-bg-secondary border border-line rounded-2xl text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase tracking-wide">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full p-2 bg-bg-secondary border border-line rounded-2xl text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Engineering"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase tracking-wide">Team</label>
                  <input
                    type="text"
                    name="team"
                    value={formData.team}
                    onChange={handleChange}
                    className="w-full p-2 bg-bg-secondary border border-line rounded-2xl text-sm focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Frontend"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase tracking-wide">Sub Team</label>
                  <input
                    type="text"
                    name="subTeam"
                    value={formData.subTeam}
                    onChange={handleChange}
                    className="w-full p-2 bg-bg-secondary border border-line rounded-2xl text-sm focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Core UI"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase tracking-wide">New Password <span className="normal-case text-text-muted font-normal">(leave blank to keep current)</span></label>
                  <input
                    type="text"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full p-2 bg-bg-secondary border border-line rounded-2xl text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Enter new password..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-line-light">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-bold text-text-secondary bg-bg-card border border-line rounded-2xl hover:bg-table-row-alt"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-2 text-sm font-bold text-white bg-accent-blue rounded-2xl hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Top Metrics Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bg-card p-4 rounded-2xl shadow-sm border border-line">
                  <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    <CheckCircle2 size={14} className="text-blue-500" />
                    Tasks
                  </div>
                  <div className="text-2xl font-black text-text-primary">{employee.metrics.tasksDone} <span className="text-sm font-medium text-text-muted">/ {employee.metrics.totalTasks}</span></div>
                </div>
                <div className="bg-bg-card p-4 rounded-2xl shadow-sm border border-line">
                  <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    <Calendar size={14} className="text-blue-500" />
                    Present
                  </div>
                  <div className="text-2xl font-black text-semantic-success-text">{employee.attendance.present} <span className="text-sm font-medium text-text-muted">days</span></div>
                </div>
              </div>

              {/* Sprints & Quick Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-bg-card p-5 rounded-2xl shadow-sm border border-line">
                  <h3 className="text-sm font-bold text-text-primary mb-3 uppercase tracking-wider">Active Sprints</h3>
                  {employee.activeSprints && employee.activeSprints.length > 0 ? (
                    <div className="space-y-2">
                      {employee.activeSprints.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-2 bg-bg-secondary rounded-2xl border border-line-light">
                          <span className="font-medium text-sm text-text-primary">{s.name} ({s.id})</span>
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Active</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-text-muted italic">Not assigned to any active sprints.</div>
                  )}
                </div>

                <div className="bg-bg-card p-5 rounded-2xl shadow-sm border border-line">
                  <h3 className="text-sm font-bold text-text-primary mb-3 uppercase tracking-wider">Quick Links</h3>
                  <div className="space-y-2">
                    <a href={`/manager/tasks?employee=${employee.name}`} className="flex items-center justify-between p-3 bg-bg-secondary hover:bg-blue-50 hover:text-blue-700 rounded-2xl border border-line-light transition-colors group">
                      <span className="font-medium text-sm">View Full Task History</span>
                      <ExternalLink size={16} className="text-text-muted group-hover:text-blue-600" />
                    </a>
                    <a href="/manager/team-attendance" className="flex items-center justify-between p-3 bg-bg-secondary hover:bg-blue-50 hover:text-blue-700 rounded-2xl border border-line-light transition-colors group">
                      <span className="font-medium text-sm">View Detailed Attendance</span>
                      <ExternalLink size={16} className="text-text-muted group-hover:text-blue-600" />
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
