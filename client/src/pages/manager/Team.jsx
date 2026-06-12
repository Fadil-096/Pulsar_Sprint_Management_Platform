import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Mail, Briefcase, Users as UsersIcon, LayoutGrid, List, Calendar, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { calculateEfficiency } from '../../utils/efficiency';
import EmployeeProfileModal from '../../components/EmployeeProfileModal';

export default function Team() {
  const { token } = useAuth();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters and UI State
  const [timeRange, setTimeRange] = useState('this_month');
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [hoveredMemberId, setHoveredMemberId] = useState(null);
  
  // Table sorting
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/team/stats?timeRange=${timeRange}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setTeam(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [token, timeRange]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter out any old state data that doesn't have the new metrics object
  const validTeam = Array.isArray(team) ? team.filter(member => member && member.metrics) : [];

  const sortedTeam = [...validTeam].sort((a, b) => {
    let aVal, bVal;
    
    // Extract sort values based on key
    if (sortConfig.key === 'efficiency') {
      const aEff = calculateEfficiency(a.metrics.totalEstHours, a.metrics.totalSpentHours)?.score || 0;
      const bEff = calculateEfficiency(b.metrics.totalEstHours, b.metrics.totalSpentHours)?.score || 0;
      aVal = aEff;
      bVal = bEff;
    } else if (sortConfig.key === 'tasks') {
      aVal = a.metrics.tasksDone;
      bVal = b.metrics.tasksDone;
    } else if (sortConfig.key === 'hours') {
      aVal = a.metrics.totalSpentHours;
      bVal = b.metrics.totalSpentHours;
    } else {
      aVal = a[sortConfig.key];
      bVal = b[sortConfig.key];
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading && validTeam.length === 0) return (
    <div className="p-12 flex justify-center items-center">
      <Loader2 className="animate-spin text-[#005AFF]" size={32} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#020024] tracking-tight">Team Directory</h1>
          <p className="text-sm text-gray-500 mt-1">View workload, efficiency, and attendance across the team.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button 
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-white shadow-sm text-[#005AFF]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-[#005AFF]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List size={18} />
            </button>
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-3 py-1.5 shadow-sm">
            <Calendar size={16} className="text-gray-400" />
            <select 
              className="text-sm bg-transparent outline-none font-medium text-[#020024] cursor-pointer"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="this_month">This Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="all_time">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {loading && validTeam.length === 0 ? (
        <div className="p-12 flex justify-center items-center">
           <Loader2 className="animate-spin text-[#005AFF]" size={32} />
        </div>
      ) : viewMode === 'card' ? (
        /* ================= CARD VIEW ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {sortedTeam.map(member => {
            const eff = calculateEfficiency(member.metrics.totalEstHours, member.metrics.totalSpentHours);
            const isHovered = hoveredMemberId === member.id;
            
            return (
              <div 
                key={member.id} 
                className={`relative cursor-pointer transition-all ${isHovered ? 'z-50' : 'z-10'}`}
                onClick={() => setSelectedEmployee(member)}
                onMouseEnter={() => setHoveredMemberId(member.id)}
                onMouseLeave={() => setHoveredMemberId(null)}
              >
                {/* Compact Chip */}
                <div className={`bg-white rounded-xl shadow-sm border p-4 flex items-center gap-3 transition-all h-full ${isHovered ? 'border-blue-400 shadow-md ring-2 ring-blue-50' : 'border-gray-200'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border transition-colors shrink-0 ${isHovered ? 'bg-blue-100 text-blue-900 border-blue-200' : 'bg-blue-50 text-blue-800 border-blue-100'}`}>
                    {member.initials}
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-sm font-bold transition-colors truncate ${isHovered ? 'text-[#005AFF]' : 'text-[#020024]'}`}>{member.name}</h3>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider truncate">{member.role === 'manager' ? 'Manager' : 'Developer'}</div>
                  </div>
                </div>

                {/* Hover Tooltip (Popup Details) */}
                {isHovered && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[300px] bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-200 overflow-visible pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Tooltip Arrow */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-gray-200 rotate-45"></div>
                    
                    {/* Tooltip Content (Relative to stay above arrow) */}
                    <div className="relative bg-white rounded-xl overflow-hidden">
                      {/* Header */}
                      <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center text-sm font-bold border border-blue-100 shrink-0">
                          {member.initials}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#020024] leading-tight">{member.name}</h3>
                          <div className="text-xs text-gray-500 mt-0.5">{member.role === 'manager' ? 'Manager' : 'Developer'}</div>
                        </div>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 gap-px bg-gray-100">
                        <div className="bg-white p-3">
                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tasks</div>
                          <div className="text-base font-bold text-[#020024] leading-none">{member.metrics.tasksDone} <span className="text-[10px] text-gray-400 font-medium">/ {member.metrics.totalTasks}</span></div>
                        </div>
                        <div className="bg-white p-3">
                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Hours</div>
                          <div className="text-base font-bold text-[#020024] leading-none">{member.metrics.totalSpentHours}h</div>
                        </div>
                        <div className="bg-white p-3">
                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Efficiency</div>
                          <div className={`flex items-center gap-1 text-base font-bold leading-none ${eff ? eff.color : 'text-gray-400'}`}>
                            {eff ? eff.label : '—'}
                            {eff?.trend === 'up' && <ArrowUpRight size={14} />}
                            {eff?.trend === 'down' && <ArrowDownRight size={14} />}
                          </div>
                        </div>
                        <div className="bg-white p-3">
                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sprint</div>
                          {member.activeSprints && member.activeSprints.length > 0 ? (
                            <div className="text-xs font-bold text-[#020024] truncate leading-none mt-1" title={member.activeSprints.map(s => s.name).join(', ')}>
                              {member.activeSprints[0].id}
                              {member.activeSprints.length > 1 && <span className="text-blue-600 font-medium ml-1">+{member.activeSprints.length - 1}</span>}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 italic leading-none mt-1">None</div>
                          )}
                        </div>
                      </div>

                      {/* Footer (Attendance) */}
                      <div className="p-3 bg-gray-50/50 flex items-center justify-between">
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Attendance</div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-green-600 font-bold">{member.attendance?.present || 0} P</span>
                          <span className="text-gray-300">|</span>
                          <span className="text-red-600 font-bold">{member.attendance?.absent || 0} A</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= TABLE VIEW ================= */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[11px] text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-bold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>Employee</th>
                  <th className="px-6 py-4 font-bold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('tasks')}>Tasks Completed</th>
                  <th className="px-6 py-4 font-bold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('hours')}>Hours Worked</th>
                  <th className="px-6 py-4 font-bold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('efficiency')}>Efficiency</th>
                  <th className="px-6 py-4 font-bold">Attendance</th>
                  <th className="px-6 py-4 font-bold">Current Sprint</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedTeam.map(member => {
                  const eff = calculateEfficiency(member.metrics.totalEstHours, member.metrics.totalSpentHours);
                  return (
                    <tr 
                      key={member.id} 
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedEmployee(member)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center text-xs font-bold border border-blue-100">
                            {member.initials}
                          </div>
                          <div>
                            <div className="font-bold text-[#020024]">{member.name}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">{member.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-[#020024]">{member.metrics.tasksDone}</span> <span className="text-xs text-gray-400">/ {member.metrics.totalTasks}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-[#020024]">{member.metrics.totalSpentHours}h</td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-1 font-bold ${eff ? eff.color : 'text-gray-400'}`}>
                          {eff ? eff.label : '—'}
                          {eff?.trend === 'up' && <ArrowUpRight size={14} />}
                          {eff?.trend === 'down' && <ArrowDownRight size={14} />}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">
                        <span className="text-green-600">{member.attendance?.present || 0}P</span> <span className="text-gray-300 mx-1">|</span> <span className="text-red-600">{member.attendance?.absent || 0}A</span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {member.activeSprints && member.activeSprints.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {member.activeSprints.map(s => (
                              <span key={s.id} className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{s.id}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Not assigned</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedEmployee && (
        <EmployeeProfileModal 
          employee={selectedEmployee} 
          onClose={() => setSelectedEmployee(null)} 
        />
      )}
    </div>
  );
}
