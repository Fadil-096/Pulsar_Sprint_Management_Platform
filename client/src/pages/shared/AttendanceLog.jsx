import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, CheckCircle2, XCircle, Users, Search, User, ChevronRight, Activity, ChevronDown } from 'lucide-react';

export default function AttendanceLog() {
  const { token, user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('All');

  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMonthDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'administrator';

  useEffect(() => {
    if (token) {
      const fetchData = async () => {
        try {
          if (isManagerOrAdmin) {
            const [attRes, empRes] = await Promise.all([
              axios.get('/api/attendance/logs', { headers: { Authorization: `Bearer ${token}` } }),
              axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setAttendance(attRes.data);
            setEmployees(empRes.data);
          } else {
            const attRes = await axios.get('/api/attendance/logs', { headers: { Authorization: `Bearer ${token}` } });
            setAttendance(attRes.data);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [token, isManagerOrAdmin]);

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateHours = (inTime, outTime) => {
    if (!inTime || !outTime) return '-';
    const diff = new Date(outTime) - new Date(inTime);
    const totalMinutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0 && minutes === 0) return '0m';
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const safeAttendance = Array.isArray(attendance) ? attendance : [];
  
  const availableMonths = useMemo(() => {
    const months = new Set();
    safeAttendance.forEach(a => {
      if (a?.date) {
        months.add(a.date.substring(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [safeAttendance]);

  // Memoize search and filtered results
  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employees;
    const lowerQuery = searchQuery.toLowerCase();
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(lowerQuery) || 
      emp.email.toLowerCase().includes(lowerQuery)
    );
  }, [employees, searchQuery]);

  const selectedEmployeeLogs = useMemo(() => {
    let logs = [];
    if (!isManagerOrAdmin) {
      logs = safeAttendance; // Employee sees their own logs
    } else {
      if (!selectedEmployeeId) return []; // Manager hasn't selected anyone
      logs = safeAttendance.filter(a => String(a?.user_id) === String(selectedEmployeeId));
    }
    
    if (selectedMonth !== 'All') {
      logs = logs.filter(a => a?.date?.startsWith(selectedMonth));
    }
    
    return logs;
  }, [safeAttendance, selectedEmployeeId, isManagerOrAdmin, selectedMonth]);

  const selectedEmployeeData = useMemo(() => {
    return employees.find(e => String(e.id) === String(selectedEmployeeId));
  }, [employees, selectedEmployeeId]);

  const todayStr = new Date().toISOString().split('T')[0];
  const totalCheckedInToday = safeAttendance.filter(a => a?.date === todayStr && !a?.check_out_time).length;
  const totalCheckedOutToday = safeAttendance.filter(a => a?.date === todayStr && a?.check_out_time).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-text-secondary">
        <Activity className="w-8 h-8 animate-spin mr-3 text-accent-blue" />
        <span className="font-medium text-lg">Loading Attendance Records...</span>
      </div>
    );
  }

  // --- Employee View (Single Pane) ---
  if (!isManagerOrAdmin) {
    return (
      <div className="max-w-5xl mx-auto pb-12">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">My Attendance</h1>
            <p className="text-sm text-text-secondary mt-1">View your personal check-in history and tracked hours.</p>
          </div>
          
          <div className="relative" ref={dropdownRef}>
            <div 
              className="flex items-center gap-2 bg-bg-secondary border border-line rounded-2xl px-3 py-1.5 h-10 cursor-pointer hover:bg-bg-secondary/80 transition-colors"
              onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
            >
              <Calendar size={16} className="text-text-muted"/>
              <span className="text-xs font-bold text-text-secondary">
                {selectedMonth === 'All' ? 'All Months' : new Date(selectedMonth + "-01").toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
              <ChevronDown size={14} className={`text-text-muted transition-transform ml-1 ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
            
            {isMonthDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-bg-card border border-line rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] overflow-hidden z-50">
                <div 
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${selectedMonth === 'All' ? 'bg-[#005AFF]/10 text-accent-blue font-bold border-l-2 border-accent-blue' : 'text-text-primary border-l-2 border-transparent hover:bg-bg-secondary'}`}
                  onClick={() => {
                    setSelectedMonth('All');
                    setIsMonthDropdownOpen(false);
                  }}
                >
                  All Months
                </div>
                {availableMonths.map(m => {
                  const label = new Date(m + "-01").toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  return (
                    <div 
                      key={m}
                      className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${selectedMonth === m ? 'bg-[#005AFF]/10 text-accent-blue font-bold border-l-2 border-accent-blue' : 'text-text-primary border-l-2 border-transparent hover:bg-bg-secondary'}`}
                      onClick={() => {
                        setSelectedMonth(m);
                        setIsMonthDropdownOpen(false);
                      }}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <AttendanceTable logs={selectedEmployeeLogs} formatTime={formatTime} calculateHours={calculateHours} />
      </div>
    );
  }

  // --- Manager/Admin View (Two-Pane) ---
  return (
    <div className="max-w-7xl mx-auto pb-12 h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-6 flex items-end justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Team Attendance Directory</h1>
          <p className="text-sm text-text-secondary mt-1">Select an employee to view their detailed attendance history.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative" ref={dropdownRef}>
            <div 
              className="flex items-center gap-2 bg-bg-secondary border border-line rounded-2xl px-3 py-1.5 h-10 cursor-pointer hover:bg-bg-secondary/80 transition-colors"
              onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
            >
              <Calendar size={16} className="text-text-muted"/>
              <span className="text-xs font-bold text-text-secondary">
                {selectedMonth === 'All' ? 'All Months' : new Date(selectedMonth + "-01").toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
              <ChevronDown size={14} className={`text-text-muted transition-transform ml-1 ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
            
            {isMonthDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-bg-card border border-line rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] overflow-hidden z-50">
                <div 
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${selectedMonth === 'All' ? 'bg-[#005AFF]/10 text-accent-blue font-bold border-l-2 border-accent-blue' : 'text-text-primary border-l-2 border-transparent hover:bg-bg-secondary'}`}
                  onClick={() => {
                    setSelectedMonth('All');
                    setIsMonthDropdownOpen(false);
                  }}
                >
                  All Months
                </div>
                {availableMonths.map(m => {
                  const label = new Date(m + "-01").toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  return (
                    <div 
                      key={m}
                      className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${selectedMonth === m ? 'bg-[#005AFF]/10 text-accent-blue font-bold border-l-2 border-accent-blue' : 'text-text-primary border-l-2 border-transparent hover:bg-bg-secondary'}`}
                      onClick={() => {
                        setSelectedMonth(m);
                        setIsMonthDropdownOpen(false);
                      }}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="bg-bg-card border border-line-light px-4 py-2 rounded-2xl shadow-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent-blue" />
            <span className="text-sm font-semibold text-text-primary">{totalCheckedInToday} <span className="text-text-secondary font-normal">Active Today</span></span>
          </div>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* LEFT PANE: Employee Directory */}
        <div className="w-1/3 bg-bg-card rounded-2xl shadow-sm border border-line-light flex flex-col overflow-hidden">
          <div className="p-4 border-b border-line-light bg-bg-secondary/30 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input 
                type="text" 
                placeholder="Search team..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-bg-primary border border-line rounded-2xl text-sm text-text-primary focus:border-accent-blue focus:ring-1 focus:ring-accent-blue outline-none transition-all placeholder:text-text-tertiary"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-10 text-text-secondary text-sm">No employees found.</div>
            ) : (
              <ul className="space-y-1">
                {filteredEmployees.map(emp => {
                  const isSelected = String(emp.id) === String(selectedEmployeeId);
                  // Determine if they are active today
                  const empTodayLog = safeAttendance.find(a => String(a?.user_id) === String(emp.id) && a?.date === todayStr);
                  const isActive = empTodayLog && !empTodayLog.check_out_time;

                  return (
                    <li key={emp.id}>
                      <button
                        onClick={() => setSelectedEmployeeId(emp.id)}
                        className={`w-full text-left flex items-center justify-between p-3 rounded-2xl transition-all outline-none focus:outline-none focus-visible:outline-none focus:ring-0 ${
                          isSelected 
                            ? 'bg-accent-blue/10 border border-accent-blue shadow-[0_0_12px_rgba(0,102,204,0.4)]' 
                            : 'hover:bg-bg-secondary/60 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${isSelected ? 'bg-accent-blue text-white' : 'bg-bg-secondary text-text-secondary'}`}>
                            {emp.initials || emp.name.charAt(0)}
                          </div>
                          <div className="truncate">
                            <div className={`font-semibold text-sm truncate ${isSelected ? 'text-accent-blue' : 'text-text-primary'}`}>
                              {emp.name}
                            </div>
                            <div className="text-xs text-text-tertiary truncate">{emp.role}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          {isActive && <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>}
                          {isSelected && <ChevronRight className="w-4 h-4 text-accent-blue" />}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Attendance Details */}
        <div className="w-2/3 bg-bg-card rounded-2xl shadow-sm border border-line-light flex flex-col overflow-hidden">
          {!selectedEmployeeId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-text-secondary bg-bg-secondary/10">
              <div className="w-20 h-20 bg-bg-secondary/50 rounded-full flex items-center justify-center mb-4 border border-line-light">
                <User className="w-10 h-10 opacity-40" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">No Employee Selected</h3>
              <p className="text-sm">Select a team member from the directory to view their attendance history.</p>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-line-light bg-bg-secondary/30 shrink-0 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent-blue text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {selectedEmployeeData?.initials || selectedEmployeeData?.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-bold text-text-primary text-lg">{selectedEmployeeData?.name}</h2>
                    <div className="text-sm text-text-secondary flex items-center gap-2">
                      <span>{selectedEmployeeData?.email}</span>
                      <span>•</span>
                      <span className="capitalize">{selectedEmployeeData?.department || selectedEmployeeData?.role}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text-secondary font-bold uppercase tracking-wide mb-1">Total Logs</div>
                  <div className="text-xl font-bold text-text-primary">{selectedEmployeeLogs.length}</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <AttendanceTable logs={selectedEmployeeLogs} formatTime={formatTime} calculateHours={calculateHours} />
              </div>
            </>
          )}
        </div>
        
      </div>
    </div>
  );
}

// Separate component for the table to avoid code duplication
function AttendanceTable({ logs, formatTime, calculateHours }) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-bg-secondary sticky top-0 z-10 shadow-sm">
        <tr>
          <th className="px-6 py-4 font-semibold text-text-secondary text-xs uppercase tracking-wider">Date</th>
          <th className="px-6 py-4 font-semibold text-text-secondary text-xs uppercase tracking-wider">Check-In</th>
          <th className="px-6 py-4 font-semibold text-text-secondary text-xs uppercase tracking-wider">Check-Out</th>
          <th className="px-6 py-4 font-semibold text-text-secondary text-xs uppercase tracking-wider">Total Hours</th>
          <th className="px-6 py-4 font-semibold text-text-secondary text-xs uppercase tracking-wider">Status</th>
          <th className="px-6 py-4 font-semibold text-text-secondary text-xs uppercase tracking-wider">Remark</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line-light">
        {logs.map(record => {
          const todayStr = new Date().toISOString().split('T')[0];
          const isPastDate = record.date < todayStr;
          const isMissedCheckout = !record.check_out_time && isPastDate;
          
          let effectiveOutTime = record.check_out_time;
          let displayOutTime = formatTime(record.check_out_time);
          
          if (isMissedCheckout && record.check_in_time) {
            const inDate = new Date(record.check_in_time);
            inDate.setHours(23, 59, 0, 0);
            effectiveOutTime = inDate.toISOString();
            displayOutTime = formatTime(effectiveOutTime);
          }

          return (
          <tr key={record.id} className="hover:bg-bg-secondary/40 transition-colors group">
            <td className="px-6 py-4 font-medium text-text-primary">{record.date}</td>
            <td className="px-6 py-4 text-text-secondary font-mono text-xs">{formatTime(record.check_in_time)}</td>
            <td className="px-6 py-4 text-text-secondary font-mono text-xs">{displayOutTime}</td>
            <td className="px-6 py-4">
              {effectiveOutTime ? (
                <span className="font-semibold text-text-primary bg-bg-secondary px-2 py-1 rounded-2xl">{calculateHours(record.check_in_time, effectiveOutTime)}</span>
              ) : <span className="text-text-tertiary">-</span>}
            </td>
            <td className="px-6 py-4">
              <span className={`px-2.5 py-1 text-xs font-bold rounded-full border inline-flex items-center gap-1.5 ${
                record.check_out_time || isMissedCheckout
                  ? 'bg-line-light border-line text-text-secondary' 
                  : 'bg-green-500/10 border-green-500/20 text-green-600'
              }`}>
                {!record.check_out_time && !isMissedCheckout && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>}
                {record.check_out_time || isMissedCheckout ? 'Completed' : 'Active Shift'}
              </span>
            </td>
            <td className="px-6 py-4">
              {isMissedCheckout ? (
                <span className="text-orange-500 font-medium text-xs bg-orange-500/10 px-2 py-1 rounded-full border border-orange-500/20 whitespace-nowrap">Missed Checkout</span>
              ) : (
                <span className="text-text-tertiary">-</span>
              )}
            </td>
          </tr>
        )})}
        
        {logs.length === 0 && (
          <tr>
            <td colSpan="6" className="px-6 py-16 text-center text-text-secondary">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20 text-accent-blue" />
              <p className="font-medium text-text-primary">No attendance records found</p>
              <p className="text-sm mt-1">This user hasn't recorded any shifts yet.</p>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
