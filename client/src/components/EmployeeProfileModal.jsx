import { X, ExternalLink, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { calculateEfficiency } from '../utils/efficiency';

export default function EmployeeProfileModal({ employee, onClose }) {
  if (!employee) return null;

  const eff = calculateEfficiency(employee.metrics.totalEstHours, employee.metrics.totalSpentHours);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#f8f9fc] rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-2xl font-bold border-2 border-blue-200">
              {employee.initials}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#020024]">{employee.name}</h2>
              <div className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-wider">{employee.role} • {employee.department}</div>
              <div className="text-xs text-gray-400 mt-0.5">{employee.team} ({employee.subTeam})</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          
          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                <CheckCircle2 size={14} className="text-blue-500" />
                Tasks
              </div>
              <div className="text-2xl font-black text-[#020024]">{employee.metrics.tasksDone} <span className="text-sm font-medium text-gray-400">/ {employee.metrics.totalTasks}</span></div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                <Clock size={14} className="text-blue-500" />
                Hours Logged
              </div>
              <div className="text-2xl font-black text-[#020024]">{employee.metrics.totalSpentHours}h</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Efficiency
              </div>
              <div className={`text-2xl font-black ${eff ? eff.color : 'text-gray-400'}`}>
                {eff ? eff.label : '—'}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                <Calendar size={14} className="text-blue-500" />
                Present
              </div>
              <div className="text-2xl font-black text-green-600">{employee.attendance.present} <span className="text-sm font-medium text-gray-400">days</span></div>
            </div>
          </div>

          {/* Sprints & Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Active Sprints</h3>
              {employee.activeSprints && employee.activeSprints.length > 0 ? (
                <div className="space-y-2">
                  {employee.activeSprints.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-100">
                      <span className="font-medium text-sm text-[#020024]">{s.name} ({s.id})</span>
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Active</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400 italic">Not assigned to any active sprints.</div>
              )}
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Quick Links</h3>
              <div className="space-y-2">
                <a href={`/manager/tasks?employee=${employee.name}`} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded-md border border-gray-100 transition-colors group">
                  <span className="font-medium text-sm">View Full Task History</span>
                  <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-600" />
                </a>
                <a href="/manager/team-attendance" className="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded-md border border-gray-100 transition-colors group">
                  <span className="font-medium text-sm">View Detailed Attendance</span>
                  <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-600" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
