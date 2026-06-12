import React, { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Search, ChevronDown, ChevronRight, Download, Calendar, Users, X, Loader2 } from 'lucide-react';

export default function TeamAttendance() {
  const { token } = useAuth();
  
  // Data State
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('this_month');
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI State
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState(new Set());
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Fetch Employees
  useEffect(() => {
    if (!token) return;
    axios.get('/api/users/employees', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setEmployees(res.data))
      .catch(err => console.error(err));
  }, [token]);

  // 2. Fetch Attendance based on Server Filters (Employee + Date Range)
  useEffect(() => {
    if (!token) return;
    setLoading(true);

    const now = new Date();
    let startDate = null;
    let endDate = null;

    if (dateRangeFilter === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (dateRangeFilter === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    }

    let url = '/api/attendance/team?';
    if (selectedEmployeeId !== 'all') url += `userId=${selectedEmployeeId}&`;
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}`;

    axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setAttendance(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [token, selectedEmployeeId, dateRangeFilter]);

  // Sync Search Query with Employee Selection (Shortcut logic)
  useEffect(() => {
    if (searchQuery.length > 2 && selectedEmployeeId === 'all') {
      const term = searchQuery.toLowerCase();
      // Only auto-select if exact name matches to avoid jumping around
      const exactMatch = employees.find(e => e.name.toLowerCase() === term);
      if (exactMatch) {
        setSelectedEmployeeId(exactMatch.id.toString());
        setSearchQuery(''); // clear search as it transferred to dropdown
      }
    }
  }, [searchQuery, employees, selectedEmployeeId]);

  // Local Filtering (Search term over fetched data)
  const filteredAttendance = useMemo(() => {
    if (!searchQuery) return attendance;
    const term = searchQuery.toLowerCase();
    return attendance.filter(a => 
      a.user_name.toLowerCase().includes(term) || 
      a.date.includes(term)
    );
  }, [attendance, searchQuery]);

  // Grouped Data for "All Employees" View
  const groupedData = useMemo(() => {
    if (selectedEmployeeId !== 'all') return null;
    
    const groups = {};
    filteredAttendance.forEach(record => {
      if (!groups[record.user_id]) {
        groups[record.user_id] = {
          user_id: record.user_id,
          name: record.user_name,
          initials: record.user_initials,
          role: record.user_role,
          records: [],
          stats: { present: 0, absent: 0, halfday: 0, onleave: 0 }
        };
      }
      groups[record.user_id].records.push(record);
      
      if (record.status === 'Present') groups[record.user_id].stats.present++;
      else if (record.status === 'Absent') groups[record.user_id].stats.absent++;
      else if (record.status === 'Half-Day') groups[record.user_id].stats.halfday++;
      else groups[record.user_id].stats.onleave++;
    });
    
    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredAttendance, selectedEmployeeId]);

  // Stats for "Individual" View
  const individualStats = useMemo(() => {
    if (selectedEmployeeId === 'all') return null;
    let present = 0, absent = 0, halfday = 0, onleave = 0, totalHours = 0;
    
    filteredAttendance.forEach(a => {
      if (a.status === 'Present') present++;
      else if (a.status === 'Absent') absent++;
      else if (a.status === 'Half-Day') halfday++;
      else onleave++;
      
      totalHours += parseFloat(a.total_hours || 0);
    });
    
    const totalDays = present + absent + halfday + onleave;
    const avgHours = totalDays > 0 ? (totalHours / totalDays).toFixed(1) : 0;
    
    return { present, absent, halfday, onleave, totalHours: totalHours.toFixed(1), avgHours };
  }, [filteredAttendance, selectedEmployeeId]);

  const toggleUserExpanded = (userId) => {
    const next = new Set(expandedUsers);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setExpandedUsers(next);
  };

  const selectedEmployeeData = employees.find(e => e.id.toString() === selectedEmployeeId);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present': return 'bg-green-100 text-green-800';
      case 'Absent': return 'bg-red-100 text-red-800';
      case 'Half-Day': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800'; // On Leave
    }
  };

  const exportCSV = () => {
    if (filteredAttendance.length === 0) return;
    const headers = "Employee,Date,Check-In,Check-Out,Total Hours,Status\n";
    const rows = filteredAttendance.map(a => 
      `"${a.user_name}","${a.date}","${a.check_in || ''}","${a.check_out || ''}","${a.total_hours || 0}","${a.status}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `team_attendance_${dateRangeFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderAttendanceRow = (record) => (
    <tr key={record.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0 text-[13px]">
      <td className="px-6 py-3 font-medium text-gray-700">{record.date}</td>
      <td className="px-6 py-3 text-gray-600">{record.check_in || '-'}</td>
      <td className="px-6 py-3 text-gray-600">{record.check_out || '-'}</td>
      <td className="px-6 py-3 font-mono text-xs font-bold text-[#020024]">{record.total_hours > 0 ? `${record.total_hours}h` : '-'}</td>
      <td className="px-6 py-3">
        <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded ${getStatusBadge(record.status)}`}>
          {record.status}
        </span>
      </td>
    </tr>
  );

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#020024] tracking-tight">Team Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage attendance records across the team</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Employee Selector */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors min-w-[200px] justify-between"
            >
              <div className="flex items-center gap-2">
                {selectedEmployeeId === 'all' ? (
                  <><Users size={16} className="text-[#005AFF]" /> <span>All Employees</span></>
                ) : selectedEmployeeData ? (
                  <>
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[9px] font-bold">
                      {selectedEmployeeData.initials}
                    </div>
                    <span>{selectedEmployeeData.name}</span>
                  </>
                ) : 'Select Employee'}
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                <div className="max-h-80 overflow-y-auto">
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 ${selectedEmployeeId === 'all' ? 'bg-blue-50/50' : ''}`}
                    onClick={() => { setSelectedEmployeeId('all'); setDropdownOpen(false); }}
                  >
                    <Users size={16} className="text-[#005AFF]" />
                    <span className="font-semibold text-gray-800">All Employees</span>
                  </button>
                  {employees.map(emp => (
                    <button
                      key={emp.id}
                      onClick={() => { setSelectedEmployeeId(emp.id.toString()); setDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-100 last:border-0 ${selectedEmployeeId === emp.id.toString() ? 'bg-blue-50/50' : ''}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center text-[10px] font-bold border border-blue-100">
                        {emp.initials}
                      </div>
                      <div>
                        <div className="font-medium text-[#020024]">{emp.name}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">{emp.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-3 py-2 shadow-sm">
            <Calendar size={16} className="text-gray-400" />
            <select 
              className="text-sm bg-transparent outline-none font-medium text-[#020024] cursor-pointer"
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
            >
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="all_time">All Time</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search name or date..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#005AFF] w-56 shadow-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center items-center">
          <Loader2 className="animate-spin text-[#005AFF]" size={32} />
        </div>
      ) : selectedEmployeeId === 'all' && groupedData ? (
        /* ================= GROUPED VIEW ================= */
        <div className="space-y-4">
          {groupedData.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center text-gray-500 border border-gray-200">
              No attendance records found for this period.
            </div>
          ) : (
            groupedData.map(group => {
              const isExpanded = expandedUsers.has(group.user_id);
              return (
                <div key={group.user_id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all">
                  {/* Header Row */}
                  <div 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleUserExpanded(group.user_id)}
                  >
                    <div className="flex items-center gap-4">
                      <button className="p-1 text-gray-400 hover:text-[#005AFF] hover:bg-blue-50 rounded">
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </button>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-bold border border-blue-200 shadow-sm">
                          {group.initials}
                        </div>
                        <div>
                          <div className="font-bold text-[#020024] text-base">{group.name}</div>
                          <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mt-0.5">{group.role}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-3 sm:mt-0 pl-14 sm:pl-0">
                      <div className="bg-green-50 border border-green-100 text-green-800 px-3 py-1 rounded text-xs font-bold">Present: {group.stats.present}</div>
                      <div className="bg-red-50 border border-red-100 text-red-800 px-3 py-1 rounded text-xs font-bold">Absent: {group.stats.absent}</div>
                      <div className="bg-amber-50 border border-amber-100 text-amber-800 px-3 py-1 rounded text-xs font-bold">Half-Day: {group.stats.halfday}</div>
                    </div>
                  </div>

                  {/* Expanded Table */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                      <table className="w-full text-left bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                        <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-2.5 font-bold">Date</th>
                            <th className="px-6 py-2.5 font-bold">Check-In</th>
                            <th className="px-6 py-2.5 font-bold">Check-Out</th>
                            <th className="px-6 py-2.5 font-bold">Total Hours</th>
                            <th className="px-6 py-2.5 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.records.map(renderAttendanceRow)}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ================= INDIVIDUAL VIEW ================= */
        <Fragment>
          {individualStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Present</div>
                <div className="text-2xl font-black text-green-600">{individualStats.present} <span className="text-sm font-medium text-gray-400">days</span></div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Absent</div>
                <div className="text-2xl font-black text-red-600">{individualStats.absent} <span className="text-sm font-medium text-gray-400">days</span></div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Logged</div>
                <div className="text-2xl font-black text-[#005AFF]">{individualStats.totalHours} <span className="text-sm font-medium text-gray-400">hours</span></div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Daily Average</div>
                <div className="text-2xl font-black text-[#020024]">{individualStats.avgHours} <span className="text-sm font-medium text-gray-400">hours/day</span></div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[11px] text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-bold">Date</th>
                    <th className="px-6 py-4 font-bold">Check-In</th>
                    <th className="px-6 py-4 font-bold">Check-Out</th>
                    <th className="px-6 py-4 font-bold">Total Hours</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map(renderAttendanceRow)}
                  {filteredAttendance.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center text-gray-500 bg-gray-50/50">
                        No attendance records found for the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Fragment>
      )}
    </div>
  );
}
