import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Mail, Briefcase, Users as UsersIcon, LayoutGrid, List, Calendar, ArrowUpRight, ArrowDownRight, Loader2, UserPlus } from 'lucide-react';

import EmployeeDetailDrawer from '../../components/EmployeeDetailDrawer';
import AddUserModal from '../../components/AddUserModal';

export default function Team() {
  const { token } = useAuth();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters and UI State
  const [timeRange, setTimeRange] = useState('this_month');
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [hoveredMemberId, setHoveredMemberId] = useState(null);
  const [flipTooltip, setFlipTooltip] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const handleMouseEnter = (id, e) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    // Check if we need to flip the tooltip (if close to bottom of screen)
    // Tooltip height is roughly 160px.
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const shouldFlip = spaceBelow < 180;
    
    // Check if we need to align right (if close to right of screen)
    const spaceRight = window.innerWidth - rect.left;
    const shouldAlignRight = spaceRight < 320;
    
    hoverTimeoutRef.current = setTimeout(() => {
      setFlipTooltip(shouldFlip);
      setAlignRight(shouldAlignRight);
      setHoveredMemberId(id);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredMemberId(null);
  };
  
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  
  // Table sorting
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  const fetchTeam = () => {
    setLoading(true);
    axios.get(`/api/team/stats?timeRange=${timeRange}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setTeam(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTeam();
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
      <Loader2 className="animate-spin text-accent-blue" size={32} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Team Directory</h1>
          <p className="text-sm text-text-secondary mt-1">View workload and attendance across the team.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-bg-secondary p-1 rounded-lg border border-line">
            <button 
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-bg-card shadow-sm text-accent-blue' : 'text-text-secondary hover:text-gray-700'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-bg-card shadow-sm text-accent-blue' : 'text-text-secondary hover:text-gray-700'}`}
            >
              <List size={18} />
            </button>
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center gap-2 bg-bg-card border border-line rounded-md px-3 py-1.5 shadow-sm">
            <Calendar size={16} className="text-text-muted" />
            <select 
              className="text-sm bg-transparent outline-none font-medium text-text-primary cursor-pointer"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="this_month">This Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="all_time">All Time</option>
            </select>
          </div>

          {/* Add Team Member Button */}
          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-2 bg-accent-blue hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-bold shadow-sm transition-colors"
          >
            <UserPlus size={16} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {loading && validTeam.length === 0 ? (
        <div className="p-12 flex justify-center items-center">
           <Loader2 className="animate-spin text-accent-blue" size={32} />
        </div>
      ) : viewMode === 'card' ? (
        /* ================= CARD VIEW ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {sortedTeam.map(member => {
                        const isHovered = hoveredMemberId === member.id;
            
            return (
              <div 
                key={member.id} 
                className={`relative cursor-pointer transition-all ${isHovered ? 'z-50' : 'z-10'}`}
                onClick={() => setSelectedEmployee(member)}
                onMouseEnter={(e) => handleMouseEnter(member.id, e)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Compact Chip */}
                <div className={`bg-bg-card rounded-xl shadow-sm border p-4 flex items-center gap-3 transition-all duration-300 h-full ${isHovered ? 'border-accent-blue shadow-lg ring-4 ring-accent-blue/10 bg-gradient-to-br from-bg-card to-blue-50/10' : 'border-line hover:border-blue-300 hover:shadow-md'}`}>
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold border transition-colors shrink-0 ${isHovered ? 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-900 border-blue-300 shadow-inner' : 'bg-blue-50/50 text-blue-800 border-blue-100'}`}>
                    {member.initials}
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-[15px] font-bold transition-colors truncate ${isHovered ? 'text-accent-blue' : 'text-text-primary'}`}>{member.name}</h3>
                    <div className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider truncate mt-0.5">{member.role === 'manager' ? 'Manager' : 'Developer'}</div>
                  </div>
                </div>

                {/* Hover Tooltip (Popup Details) */}
                {isHovered && (
                  <div className={`absolute ${alignRight ? 'right-0' : 'left-0'} w-[300px] bg-bg-card/95 backdrop-blur-sm rounded-xl shadow-2xl border border-line overflow-visible pointer-events-none animate-in fade-in zoom-in-95 duration-200 ease-out z-50 ${flipTooltip ? 'bottom-full mb-3 origin-bottom' : 'top-full mt-3 origin-top'}`}>
                    {/* Tooltip Arrow */}
                    <div className={`absolute ${alignRight ? 'right-8' : 'left-8'} w-4 h-4 bg-bg-card border-line rotate-45 ${flipTooltip ? '-bottom-2 border-b border-r' : '-top-2 border-t border-l'}`}></div>
                    
                    {/* Tooltip Content (Relative to stay above arrow) */}
                    <div className="relative bg-bg-card rounded-xl overflow-hidden">
                      {/* Header */}
                      <div className="p-4 border-b border-line-light flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center text-sm font-bold border border-blue-100 shrink-0">
                          {member.initials}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-text-primary leading-tight">{member.name}</h3>
                          <div className="text-xs text-text-secondary mt-0.5">{member.role === 'manager' ? 'Manager' : 'Developer'}</div>
                        </div>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 gap-px bg-bg-secondary">
                        <div className="bg-bg-card p-3">
                          <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Tasks</div>
                          <div className="text-base font-bold text-text-primary leading-none">{member.metrics.tasksDone} <span className="text-[10px] text-text-muted font-medium">/ {member.metrics.totalTasks}</span></div>
                        </div>


                        <div className="bg-bg-card p-3">
                          <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Sprint</div>
                          {member.activeSprints && member.activeSprints.length > 0 ? (
                            <div className="text-xs font-bold text-text-primary truncate leading-none mt-1" title={member.activeSprints.map(s => s.name).join(', ')}>
                              {member.activeSprints[0].id}
                              {member.activeSprints.length > 1 && <span className="text-accent-blue font-medium ml-1">+{member.activeSprints.length - 1}</span>}
                            </div>
                          ) : (
                            <div className="text-xs text-text-muted italic leading-none mt-1">None</div>
                          )}
                        </div>
                      </div>

                      {/* Footer (Attendance) */}
                      <div className="p-3 bg-bg-secondary/50 flex items-center justify-between">
                        <div className="text-[10px] font-bold text-text-secondary uppercase">Attendance</div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-semantic-success-text font-bold">{member.attendance?.present || 0} P</span>
                          <span className="text-line">|</span>
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
        <div className="bg-bg-card rounded-xl shadow-sm border border-line overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-secondary text-[11px] text-text-secondary uppercase tracking-wider border-b border-line">
                <tr>
                  <th className="px-6 py-4 font-bold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>Employee</th>
                  <th className="px-6 py-4 font-bold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('tasks')}>Tasks Completed</th>
                                                      <th className="px-6 py-4 font-bold">Attendance</th>
                  <th className="px-6 py-4 font-bold">Current Sprint</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedTeam.map(member => {
                                    return (
                    <tr 
                      key={member.id} 
                      className="hover:bg-table-row-alt/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedEmployee(member)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center text-xs font-bold border border-blue-100">
                            {member.initials}
                          </div>
                          <div>
                            <div className="font-bold text-text-primary">{member.name}</div>
                            <div className="text-[10px] text-text-secondary uppercase tracking-wider">{member.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-text-primary">{member.metrics.tasksDone}</span> <span className="text-xs text-text-muted">/ {member.metrics.totalTasks}</span>
                      </td>

                      <td className="px-6 py-4 text-xs font-medium">
                        <span className="text-semantic-success-text">{member.attendance?.present || 0}P</span> <span className="text-line mx-1">|</span> <span className="text-red-600">{member.attendance?.absent || 0}A</span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {member.activeSprints && member.activeSprints.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {member.activeSprints.map(s => (
                              <span key={s.id} className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{s.id}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-text-muted italic">Not assigned</span>
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
        <EmployeeDetailDrawer employeeId={selectedEmployee?.id} onClose={() => setSelectedEmployee(null)} />
      )}

      {showAddUserModal && (
        <AddUserModal 
          onClose={() => setShowAddUserModal(false)}
          onSuccess={() => {
            setShowAddUserModal(false);
            fetchTeam();
          }}
        />
      )}
    </div>
  );
}
