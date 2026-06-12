import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Calendar, CheckCircle2, XCircle, Clock, ChevronDown, MessageSquare } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

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
  const [error, setError] = useState('');

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

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (e < s) return 0;
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  };

  const totalDays = calculateDays(formData.startDate, formData.endDate);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('End Date cannot be before Start Date.');
      return;
    }
    if (!formData.reason.trim()) {
      setError('Reason for leave is required.');
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
      fetchData(); // Refresh history
      alert('Leave request submitted successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle2 size={12}/> ACCEPTED</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 flex items-center gap-1"><XCircle size={12}/> REJECTED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 flex items-center gap-1"><Clock size={12}/> PENDING</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-[#020024]">Leave Management</h1>
        <p className="text-gray-500 text-sm mt-1">Apply for leave and track your request history.</p>
      </div>

      {/* Application Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-bold text-[#020024] flex items-center gap-2">
            <Calendar size={20} className="text-[#005AFF]" />
            Apply for Leave
          </h2>
        </div>
        <div className="p-6">
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider text-[11px]">Select Manager</label>
                <div className="relative">
                  <select
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#005AFF]/20 focus:border-[#005AFF] appearance-none"
                    value={formData.managerId}
                    onChange={(e) => setFormData({...formData, managerId: e.target.value})}
                    required
                  >
                    <option value="">-- Choose Manager --</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider text-[11px]">Leave Type</label>
                <div className="relative">
                  <select
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#005AFF]/20 focus:border-[#005AFF] appearance-none"
                    value={formData.leaveType}
                    onChange={(e) => setFormData({...formData, leaveType: e.target.value})}
                    required
                  >
                    <option value="sick">Sick Leave</option>
                    <option value="casual">Casual Leave</option>
                    <option value="emergency">Emergency Leave</option>
                    <option value="planned">Planned Leave</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider text-[11px]">Start Date</label>
                <input
                  type="date"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#005AFF]/20 focus:border-[#005AFF]"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider text-[11px]">End Date</label>
                <input
                  type="date"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#005AFF]/20 focus:border-[#005AFF]"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  min={formData.startDate}
                  required
                />
                {totalDays > 0 && (
                  <p className="text-xs font-bold text-[#005AFF] mt-2">Total: {totalDays} day(s)</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider text-[11px]">Brief Reason for Leave</label>
              <textarea
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#005AFF]/20 focus:border-[#005AFF] min-h-[100px] resize-y"
                placeholder="Please provide a brief reason..."
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                required
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-[#005AFF] text-white font-bold rounded-lg text-sm hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-bold text-[#020024]">Application History</h2>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading history...</div>
          ) : leaves.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No leave requests found.</div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold border-b border-gray-100">Leave Type</th>
                  <th className="px-6 py-4 font-bold border-b border-gray-100">Dates</th>
                  <th className="px-6 py-4 font-bold border-b border-gray-100">Days</th>
                  <th className="px-6 py-4 font-bold border-b border-gray-100 max-w-[200px]">Reason</th>
                  <th className="px-6 py-4 font-bold border-b border-gray-100">Status</th>
                  <th className="px-6 py-4 font-bold border-b border-gray-100">Applied On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leaves.map(leave => {
                  const isHighlighted = highlightedLeaveId === String(leave.id);
                  return (
                    <tr 
                      key={leave.id} 
                      ref={isHighlighted ? highlightedRef : null}
                      className={`hover:bg-gray-50/50 transition-colors ${isHighlighted ? 'bg-blue-50/40 ring-2 ring-blue-200' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <span className="font-bold text-[#020024] capitalize">{leave.leaveType}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {leave.startDate} to {leave.endDate}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium px-2 py-1 bg-gray-100 rounded text-gray-700">{leave.durationDays}</span>
                      </td>
                      <td className="px-6 py-4 max-w-[250px] whitespace-normal">
                        <div className="text-gray-600 break-words">
                          {leave.reason}
                        </div>
                        {leave.managerRemark && leave.status === 'rejected' && (
                          <div className="mt-1 flex items-start gap-1 text-xs text-red-600">
                            <MessageSquare size={12} className="mt-0.5 flex-shrink-0" />
                            <span className="whitespace-normal break-words" title={leave.managerRemark}>{leave.managerRemark}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(leave.status)}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs font-medium">
                        {new Date(leave.appliedAt.replace(' ', 'T') + 'Z').toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
