import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { X, Calendar, CheckCircle2, AlertCircle, Clock, LayoutDashboard, ChevronRight } from 'lucide-react';


export default function EmployeeDetailDrawer({ employeeId, onClose }) {
  const { token } = useAuth();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!employeeId) return;
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/team/employee/${employeeId}/details`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDetails(res.data);
      } catch (err) {
        setError('Failed to load employee details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [employeeId, token]);

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-xl bg-bg-primary h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header Area */}
        <div className="bg-bg-card border-b border-line p-6 flex flex-col relative shrink-0">
          <button 
            onClick={onClose} 
            className="absolute top-4 left-4 p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary rounded-full transition-colors flex items-center gap-1"
          >
            <X size={20} />
            <span className="text-sm font-medium">Close</span>
          </button>
          
          <div className="flex flex-col items-center mt-6">
            <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-3xl font-bold border-4 border-bg-card shadow-sm mb-4">
              {details?.initials || '?'}
            </div>
            <h2 className="text-2xl font-bold text-text-primary text-center">
              {details?.name || 'Loading...'}
            </h2>
            <div className="text-sm font-medium text-text-secondary mt-1 uppercase tracking-wider">
              {details?.role} • {details?.department}
            </div>
            <div className="mt-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500 flex flex-col items-center">
            <AlertCircle className="mb-2" />
            {error}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            
            {/* Stats Section */}
            <section>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-bg-card p-4 rounded-xl shadow-sm border border-line">
                  <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    <CheckCircle2 size={14} className="text-blue-500" /> Tasks
                  </div>
                  <div className="text-2xl font-black text-text-primary">
                    {details.metrics.tasksDone} <span className="text-sm font-medium text-text-muted">/ {details.metrics.totalTasks}</span>
                  </div>
                </div>
                <div className="bg-bg-card p-4 rounded-xl shadow-sm border border-line">
                  <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    <Calendar size={14} className="text-green-500" /> Attendance
                  </div>
                  <div className="text-2xl font-black text-semantic-success-text">
                    {details.attendanceStats.present} <span className="text-sm font-medium text-text-muted">days</span>
                  </div>
                </div>
                <div className="bg-bg-card p-4 rounded-xl shadow-sm border border-line md:col-span-1 col-span-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    <LayoutDashboard size={14} className="text-orange-500" /> Sprint
                  </div>
                  <div className="text-lg font-bold text-text-primary truncate">
                    {details.activeSprints.length > 0 ? details.activeSprints[0].sprint_id : 'None'}
                  </div>
                </div>
              </div>
            </section>

            {/* Current Sprint Tasks */}
            <section>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">Current Sprint Tasks</h3>
              <div className="bg-bg-card rounded-xl shadow-sm border border-line overflow-hidden">
                {details.sprintTasks.length === 0 ? (
                  <div className="p-6 text-center text-text-muted text-sm italic">No active tasks assigned.</div>
                ) : (
                  <div className="divide-y divide-line-light">
                    {details.sprintTasks.map(task => (
                      <div key={task.task_id} className="p-3 flex items-center justify-between hover:bg-bg-secondary transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${getPriorityColor(task.priority)}`} title={`Priority: ${task.priority}`} />
                          <div className="truncate text-sm font-medium text-text-primary">{task.task_title}</div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 pl-4">
                          <div className="text-xs font-medium text-text-secondary">{task.estimated_hours}h</div>
                          <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${task.status === 'done' ? 'bg-green-100 text-green-700' : task.status === 'inprogress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                            {task.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Recent Activity */}
            <section>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">Recent Activity</h3>
              <div className="bg-bg-card rounded-xl shadow-sm border border-line p-4">
                {details.recentActivity.length === 0 ? (
                  <div className="text-center text-text-muted text-sm italic py-4">No recent activity.</div>
                ) : (
                  <div className="space-y-4">
                    {details.recentActivity.map((act, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5" />
                          {i !== details.recentActivity.length - 1 && <div className="w-px h-full bg-line-light mt-1" />}
                        </div>
                        <div className="pb-1">
                          <div className="text-sm font-medium text-text-primary">{act.action}</div>
                          <div className="text-xs text-text-muted">{new Date(act.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  );
}
