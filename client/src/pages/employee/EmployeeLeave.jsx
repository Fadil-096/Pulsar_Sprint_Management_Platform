import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Calendar, CheckCircle2, XCircle, Clock, ChevronDown, AlertCircle, FileText, CalendarDays, HeartPulse, Briefcase, Filter, Tag, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ExpandableTextCell from '../../components/ExpandableTextCell';

export default function EmployeeLeave() {
  const { user, token } = useAuth();
  const [searchParams] = useSearchParams();
  const highlightedLeaveId = searchParams.get('leaveId');
  const highlightedRef = useRef(null);

  const [managers, setManagers] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    managerId: '',
    leaveType: 'sick',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [showCautionModal, setShowCautionModal] = useState(false);

  // Filter State
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');

  // Custom Dropdown State
  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsManagerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamically calculate used and remaining balances
  const calculateUsed = (type) => {
    return leaves
      .filter(l => l.leaveType === type && (l.status === 'approved' || l.status === 'accepted' || l.status === 'pending'))
      .reduce((total, l) => total + l.durationDays, 0);
  };

  const usedLeaves = {
    sick: calculateUsed('sick'),
    casual: calculateUsed('casual'),
    emergency: calculateUsed('emergency'),
    planned: calculateUsed('planned')
  };

  const leaveBalances = {
    sick: 10 - usedLeaves.sick,
    casual: 10 - usedLeaves.casual,
    emergency: 10 - usedLeaves.emergency,
    planned: 10 - usedLeaves.planned
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    if (highlightedLeaveId && highlightedRef.current && !loading) {
      setTimeout(() => {
        highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [highlightedLeaveId, loading, leaves]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [managersRes, leavesRes] = await Promise.all([
        axios.get('/api/users/managers', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/api/leaves/employee/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setManagers(managersRes.data);
      setLeaves(leavesRes.data);
      
      if (managersRes.data.length === 1) {
        setFormData(prev => ({ ...prev, managerId: managersRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateWorkingDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate < startDate) return 0;

    let count = 0;
    const curDate = new Date(startDate);
    while (curDate <= endDate) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
      curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  };

  const totalDays = calculateWorkingDays(formData.startDate, formData.endDate);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.managerId) newErrors.managerId = 'Please select a manager.';
    if (!formData.startDate) newErrors.startDate = 'Start date is required.';
    if (!formData.endDate) newErrors.endDate = 'End date is required.';
    if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      newErrors.endDate = 'End Date cannot be before Start Date.';
    }
    if (!formData.reason.trim()) newErrors.reason = 'Reason for leave is required.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    
    if (!validateForm()) {
      setShowCautionModal(true);
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/leaves', formData, { headers: { Authorization: `Bearer ${token}` } });
      setFormData({
        ...formData,
        startDate: '',
        endDate: '',
        reason: ''
      });
      setErrors({});
      fetchData(); // Refresh history
      setSuccessMsg('Leave request submitted successfully! Your manager will be notified.');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || 'Failed to submit leave request' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#D1FAE5] text-[#065F46] flex items-center justify-center gap-1 w-max uppercase tracking-wider"><CheckCircle2 size={12}/> APPROVED</span>;
      case 'rejected':
        return <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#FEE2E2] text-[#991B1B] flex items-center justify-center gap-1 w-max uppercase tracking-wider"><XCircle size={12}/> REJECTED</span>;
      default:
        return <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#92400E] flex items-center justify-center gap-1 w-max uppercase tracking-wider"><Clock size={12}/> PENDING</span>;
    }
  };

  const getLeaveIcon = (type) => {
    switch (type) {
      case 'sick': return <HeartPulse size={20} className="text-orange-500" />;
      case 'casual': return <CalendarDays size={20} className="text-blue-500" />;
      case 'emergency': return <AlertCircle size={20} className="text-semantic-error-text" />;
      case 'planned': return <Briefcase size={20} className="text-green-500" />;
      default: return <FileText size={20} className="text-text-secondary" />;
    }
  };

  const formatDateRange = (start, end) => {
    const sDate = new Date(start);
    const eDate = new Date(end);
    const sMonth = sDate.toLocaleDateString('en-US', { month: 'short' });
    const sDay = sDate.getDate();
    const sYear = sDate.getFullYear();
    const eMonth = eDate.toLocaleDateString('en-US', { month: 'short' });
    const eDay = eDate.getDate();
    const eYear = eDate.getFullYear();

    if (sYear === eYear) {
      if (sMonth === eMonth && sDay === eDay) {
        return `${sMonth} ${sDay}, ${sYear}`;
      }
      return `${sMonth} ${sDay} – ${eMonth} ${eDay}, ${sYear}`;
    }
    return `${sMonth} ${sDay}, ${sYear} – ${eMonth} ${eDay}, ${eYear}`;
  };

  const filteredHistory = leaves.filter(l => {
    const sMatch = filterStatus === 'All' || 
                   (filterStatus === 'Approved' && l.status === 'accepted') ||
                   (filterStatus === 'Rejected' && l.status === 'rejected') ||
                   (filterStatus === 'Pending' && l.status === 'pending');
    const tMatch = filterType === 'All' || l.leaveType.toLowerCase() === filterType.toLowerCase();
    return sMatch && tMatch;
  });

  const recentRequests = [...leaves].sort((a,b) => new Date(b.appliedAt) - new Date(a.appliedAt)).slice(0, 3);

  const leaveTypes = [
    { id: 'sick', label: 'Sick', icon: <HeartPulse size={18} />, color: 'orange' },
    { id: 'casual', label: 'Casual', icon: <CalendarDays size={18} />, color: 'blue' },
    { id: 'emergency', label: 'Emergency', icon: <AlertCircle size={18} />, color: 'red' },
    { id: 'planned', label: 'Planned', icon: <Briefcase size={18} />, color: 'green' }
  ];

  const getColorClasses = (color, isSelected) => {
    if (!isSelected) return 'border-line bg-bg-card text-text-secondary hover:bg-table-row-alt';
    switch (color) {
      case 'orange': return 'border-badge-pending-text/30 bg-badge-pending-bg text-badge-pending-text';
      case 'blue': return 'border-badge-active-text/30 bg-badge-active-bg text-badge-active-text';
      case 'red': return 'border-badge-rejected-text/30 bg-badge-rejected-bg text-badge-rejected-text';
      case 'green': return 'border-badge-completed-text/30 bg-badge-completed-bg text-badge-completed-text';
      default: return 'border-gray-500 bg-bg-secondary text-text-secondary';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Leave Management</h1>
        <p className="text-text-secondary text-sm mt-1">Apply for leave and track your request history.</p>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-6">
        
        {/* LEFT COLUMN: Apply for Leave */}
        <div className="bg-bg-card rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-line-light p-8">
          <div className="mb-6 border-l-4 border-accent-blue pl-4">
            <h2 className="text-xl font-bold text-text-primary">Apply for Leave</h2>
            <p className="text-sm text-text-secondary mt-1">Submit a leave request to your manager for approval.</p>
          </div>

          {successMsg && (
            <div className="mb-6 p-3 bg-green-50 text-green-700 border border-green-200 rounded-2xl text-sm font-medium flex items-center gap-2">
              <CheckCircle2 size={16} />
              {successMsg}
            </div>
          )}
          
          {errors.submit && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-sm font-medium flex items-center gap-2">
              <AlertCircle size={16} />
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold text-text-secondary mb-2 uppercase tracking-wide">Select Manager</label>
              <div className="relative max-w-sm" ref={dropdownRef}>
                <div 
                  className={`w-full p-3 bg-bg-card border ${errors.managerId ? 'border-red-300' : 'border-line'} rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#005AFF]/20 focus:border-[#005AFF] cursor-pointer flex justify-between items-center shadow-sm transition-all`}
                  onClick={() => setIsManagerDropdownOpen(!isManagerDropdownOpen)}
                >
                  <span className={formData.managerId ? 'text-text-primary' : 'text-text-muted'}>
                    {formData.managerId ? managers.find(m => String(m.id) === String(formData.managerId))?.name : '-- Choose Manager --'}
                  </span>
                  <ChevronDown className={`text-text-muted transition-transform ${isManagerDropdownOpen ? 'rotate-180' : ''}`} size={16} />
                </div>
                
                {isManagerDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 py-2 bg-bg-card border border-line rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] max-h-60 overflow-y-auto">
                    <div 
                      className="px-4 py-2.5 text-sm text-text-muted hover:bg-bg-secondary cursor-pointer transition-colors"
                      onClick={() => {
                        setFormData({...formData, managerId: ''});
                        setIsManagerDropdownOpen(false);
                      }}
                    >
                      -- Choose Manager --
                    </div>
                    {managers.map(m => (
                      <div 
                        key={m.id}
                        className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${String(formData.managerId) === String(m.id) ? 'bg-[#005AFF]/10 text-[#005AFF] font-bold border-l-2 border-[#005AFF]' : 'text-text-primary border-l-2 border-transparent hover:bg-bg-secondary'}`}
                        onClick={() => {
                          setFormData({...formData, managerId: m.id});
                          setIsManagerDropdownOpen(false);
                        }}
                      >
                        {m.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {errors.managerId && <p className="text-semantic-error-text text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.managerId}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-text-secondary mb-2 uppercase tracking-wide">Leave Type</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3" role="radiogroup" aria-label="Leave Type">
                {leaveTypes.map(type => {
                  const isSelected = formData.leaveType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setFormData({ ...formData, leaveType: type.id })}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 ${getColorClasses(type.color, isSelected)}`}
                    >
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 flex items-center justify-center w-3.5 h-3.5 bg-white rounded-full shadow-sm">
                          <div className="w-1.5 h-1.5 bg-[#005AFF] rounded-full"></div>
                        </div>
                      )}
                      <div className="mb-2">
                        {type.icon}
                      </div>
                      <span className={`text-[12px] text-center ${isSelected ? 'font-bold' : 'font-medium'}`}>{type.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] font-medium text-text-secondary mt-2 flex items-center gap-1">
                <CheckCircle2 size={12} className="text-green-500" />
                You have {leaveBalances[formData.leaveType]} {leaveTypes.find(t => t.id === formData.leaveType)?.label} Leave days remaining
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase tracking-wide">Start Date</label>
                <input
                  type="date"
                  className={`w-full p-3 bg-bg-card border ${errors.startDate ? 'border-red-300' : 'border-line'} rounded-2xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[#005AFF]/20 focus:border-[#005AFF] shadow-sm transition-all`}
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
                {errors.startDate && <p className="text-semantic-error-text text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.startDate}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase tracking-wide">End Date</label>
                <input
                  type="date"
                  className={`w-full p-3 bg-bg-card border ${errors.endDate ? 'border-red-300' : 'border-line'} rounded-2xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[#005AFF]/20 focus:border-[#005AFF] shadow-sm transition-all`}
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  min={formData.startDate}
                />
                {errors.endDate && <p className="text-semantic-error-text text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.endDate}</p>}
              </div>
            </div>

            {totalDays > 0 && formData.startDate && formData.endDate && (
              <div className="flex justify-end -mt-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-2xl text-blue-700 text-xs font-bold">
                  <Calendar size={14} />
                  Total: {totalDays} working day(s)
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase tracking-wide">Brief Reason for Leave</label>
              <textarea
                rows="3"
                className={`w-full p-3 bg-bg-card border ${errors.reason ? 'border-red-300' : 'border-line'} rounded-2xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[#005AFF]/20 focus:border-[#005AFF] shadow-sm transition-all resize-y min-h-[100px] placeholder:italic placeholder:text-text-muted`}
                placeholder="E.g., Medical appointment, family event..."
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
              />
              {errors.reason && <p className="text-semantic-error-text text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.reason}</p>}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 bg-accent-blue text-white font-bold rounded-2xl text-sm hover:bg-[#0047CC] transition-all shadow-sm hover:shadow disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : 'Submit Leave Request'}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Summary & Recent */}
        <div className="space-y-6">
          {/* Leave Balance Card */}
          <div className="bg-bg-card rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-line-light p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Leave Balance <span className="text-xs font-normal text-text-muted ml-2">(This Year)</span></h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg-card border border-line-light rounded-2xl p-3 border-l-4 border-l-orange-500 shadow-sm hover:shadow transition-shadow">
                <p className="text-[11px] uppercase font-bold text-text-secondary mb-1">Sick Leave</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-text-primary">{leaveBalances.sick}</span>
                  <span className="text-xs text-text-muted">rem</span>
                </div>
                <p className="text-xs text-text-muted mt-1">Used: {usedLeaves.sick}</p>
              </div>
              <div className="bg-bg-card border border-line-light rounded-2xl p-3 border-l-4 border-l-blue-500 shadow-sm hover:shadow transition-shadow">
                <p className="text-[11px] uppercase font-bold text-text-secondary mb-1">Casual Leave</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-text-primary">{leaveBalances.casual}</span>
                  <span className="text-xs text-text-muted">rem</span>
                </div>
                <p className="text-xs text-text-muted mt-1">Used: {usedLeaves.casual}</p>
              </div>
              <div className="bg-bg-card border border-line-light rounded-2xl p-3 border-l-4 border-l-red-500 shadow-sm hover:shadow transition-shadow">
                <p className="text-[11px] uppercase font-bold text-text-secondary mb-1">Emergency</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-text-primary">{leaveBalances.emergency}</span>
                  <span className="text-xs text-text-muted">rem</span>
                </div>
                <p className="text-xs text-text-muted mt-1">Used: {usedLeaves.emergency}</p>
              </div>
              <div className="bg-bg-card border border-line-light rounded-2xl p-3 border-l-4 border-l-green-500 shadow-sm hover:shadow transition-shadow">
                <p className="text-[11px] uppercase font-bold text-text-secondary mb-1">Planned Leave</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-text-primary">{leaveBalances.planned}</span>
                  <span className="text-xs text-text-muted">rem</span>
                </div>
                <p className="text-xs text-text-muted mt-1">Used: {usedLeaves.planned}</p>
              </div>
            </div>
            <p className="text-[10px] text-text-muted italic text-center mt-4">*Configure leave policy in settings</p>
          </div>

          {/* Recent Requests Card */}
          <div className="bg-bg-card rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-line-light p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-text-primary">Recent Requests</h3>
              <a href="#history" className="text-xs font-bold text-semantic-link hover:underline">View All</a>
            </div>
            
            <div className="space-y-3">
              {loading ? (
                <div className="text-xs text-text-secondary text-center py-4">Loading requests...</div>
              ) : recentRequests.length === 0 ? (
                <div className="text-xs text-text-secondary text-center py-4 bg-bg-secondary rounded-xl border border-line-light border-dashed">No recent requests</div>
              ) : (
                recentRequests.map(req => (
                  <div key={req.id} className="flex justify-between items-start pb-3 border-b border-line-light last:border-0 last:pb-0">
                    <div className="flex gap-2.5">
                      <div className="mt-0.5">{getLeaveIcon(req.leaveType)}</div>
                      <div>
                        <p className="text-sm font-bold text-text-primary capitalize">{req.leaveType} Leave</p>
                        <p className="text-xs text-text-secondary mt-0.5">{formatDateRange(req.startDate, req.endDate)} ({req.durationDays} days)</p>
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(req.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FULL LEAVE HISTORY TABLE */}
      <div id="history" className="bg-bg-card rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-line-light overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-line bg-bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-text-primary">All Leave Requests</h2>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-bg-secondary border border-line rounded-2xl px-3 py-1.5 h-10">
              <Filter size={16} className="text-text-muted"/>
              <select 
                className="bg-transparent text-xs font-bold text-text-secondary focus:outline-none cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-bg-secondary border border-line rounded-2xl px-3 py-1.5 h-10">
              <Tag size={16} className="text-text-muted"/>
              <select 
                className="bg-transparent text-xs font-bold text-text-secondary focus:outline-none cursor-pointer"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="sick">Sick</option>
                <option value="casual">Casual</option>
                <option value="emergency">Emergency</option>
                <option value="planned">Planned</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-text-secondary">Loading history...</div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mb-4">
                <Calendar className="text-text-muted" size={32} />
              </div>
              <h3 className="text-[15px] font-bold text-text-primary mb-1">No leave requests found</h3>
              <p className="text-text-secondary text-[13px] max-w-sm">
                {leaves.length === 0 
                  ? "You haven't applied for any leaves yet. When you do, they'll appear here."
                  : "No requests match your current filters. Try adjusting them."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-bg-secondary text-text-secondary text-[11px] uppercase tracking-wider font-semibold border-b border-line">
                <tr>
                  <th className="px-6 py-4 font-semibold group cursor-pointer hover:text-text-primary transition-colors">Leave Type</th>
                  <th className="px-6 py-4 font-semibold group cursor-pointer hover:text-text-primary transition-colors">Dates <span className="opacity-0 group-hover:opacity-100 transition-opacity">▼</span></th>
                  <th className="px-6 py-4 font-semibold group cursor-pointer hover:text-text-primary transition-colors">Days <span className="opacity-0 group-hover:opacity-100 transition-opacity">▼</span></th>
                  <th className="px-6 py-4 font-semibold max-w-[200px]">Reason</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold max-w-[200px]">Manager's Note</th>
                  <th className="px-6 py-4 font-semibold group cursor-pointer hover:text-text-primary transition-colors">Applied On <span className="opacity-0 group-hover:opacity-100 transition-opacity">▼</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredHistory.map((leave, index) => {
                  const isHighlighted = highlightedLeaveId === String(leave.id);
                  const isEven = index % 2 === 0;
                  return (
                    <tr 
                      key={leave.id} 
                      ref={isHighlighted ? highlightedRef : null}
                      className={`hover:bg-table-row-alt hover:cursor-pointer transition-colors ${isEven ? 'bg-bg-card' : 'bg-bg-secondary'} ${isHighlighted ? 'bg-blue-500/20 ring-2 ring-blue-500/50 relative z-10' : ''}`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2.5">
                          {getLeaveIcon(leave.leaveType)}
                          <span className="font-bold text-text-primary capitalize">{leave.leaveType}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-text-primary font-medium">
                        {formatDateRange(leave.startDate, leave.endDate)}
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-medium text-text-primary">{leave.durationDays} days</span>
                      </td>
                      <td className="px-6 py-5 max-w-[280px] whitespace-normal group">
                        <ExpandableTextCell 
                          text={leave.reason} 
                          modalTitle="Leave Reason"
                        />
                      </td>
                      <td className="px-6 py-5">
                        {getStatusBadge(leave.status)}
                      </td>
                      <td className="px-6 py-5 max-w-[250px] whitespace-normal group">
                        {leave.managerRemark ? (
                          <ExpandableTextCell 
                            text={leave.managerRemark} 
                            modalTitle="Manager's Note"
                            maxLength={40}
                          />
                        ) : (
                          <span className="text-text-muted">-</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-text-secondary text-sm font-medium">
                        {leave.appliedAt ? new Date(leave.appliedAt).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCautionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
          <div className="bg-bg-card border border-line-light rounded-3xl shadow-2xl w-full max-w-sm p-6 relative">
            <button 
              onClick={() => setShowCautionModal(false)}
              className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary rounded-full transition-all"
            >
              <X size={20} />
            </button>
            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-14 h-14 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-5 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Caution!</h3>
              <p className="text-[15px] font-medium text-text-secondary leading-relaxed mb-6">
                Please make sure to fill out all required fields before submitting your leave request.
              </p>
              <button 
                onClick={() => setShowCautionModal(false)}
                className="w-full py-3 bg-accent-blue hover:bg-[#0047CC] text-white font-bold rounded-2xl transition-all shadow-[0_4px_14px_rgba(0,90,255,0.3)] hover:shadow-[0_6px_20px_rgba(0,90,255,0.4)]"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
