import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Calendar, CheckCircle2, XCircle, Clock, Search, Filter, MessageSquare, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ExpandableTextCell from '../../components/ExpandableTextCell';

export default function ManagerLeaves() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const highlightedLeaveId = searchParams.get('leaveId');
  const highlightedRef = useRef(null);

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState('Pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Rejection Modal
  const [rejectingLeave, setRejectingLeave] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, [token]);

  useEffect(() => {
    if (highlightedLeaveId && highlightedRef.current && !loading) {
      setTimeout(() => {
        highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [highlightedLeaveId, loading, leaves]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/leaves', { headers: { Authorization: `Bearer ${token}` } });
      setLeaves(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      // Optimistic Update
      setLeaves(leaves.map(l => l.id === id ? { ...l, status: 'accepted' } : l));
      await axios.patch(`/api/leaves/${id}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error(err);
      fetchLeaves(); // Revert on failure
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingLeave) return;
    
    try {
      const id = rejectingLeave.id;
      // Optimistic Update
      setLeaves(leaves.map(l => l.id === id ? { ...l, status: 'rejected', manager_remark: rejectReason } : l));
      setRejectingLeave(null);
      
      await axios.patch(`/api/leaves/${id}/reject`, { manager_remark: rejectReason }, { headers: { Authorization: `Bearer ${token}` } });
      setRejectReason('');
    } catch (err) {
      console.error(err);
      fetchLeaves(); // Revert on failure
    }
  };

  const filteredLeaves = leaves.filter(l => {
    if (activeTab === 'Pending' && l.status !== 'pending') return false;
    if (activeTab === 'Accepted' && l.status !== 'accepted') return false;
    if (activeTab === 'Rejected' && l.status !== 'rejected') return false;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return l.employeeName.toLowerCase().includes(term) || 
             l.leaveType.toLowerCase().includes(term) ||
             l.reason.toLowerCase().includes(term);
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1 w-fit"><CheckCircle2 size={12}/> ACCEPTED</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 flex items-center gap-1 w-fit"><XCircle size={12}/> REJECTED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 flex items-center gap-1 w-fit"><Clock size={12}/> PENDING</span>;
    }
  };

  const pendingCount = leaves.filter(l => l.status === 'pending').length;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            Leave Requests
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {pendingCount} Pending
              </span>
            )}
          </h1>
          <p className="text-text-secondary text-sm mt-1">Review and manage time-off requests from your team.</p>
        </div>
      </div>

      <div className="bg-bg-card rounded-xl shadow-sm border border-line-light overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-line-light bg-bg-secondary/50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar w-full md:w-auto">
            {['All', 'Pending', 'Accepted', 'Rejected'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                  activeTab === tab ? 'bg-bg-sidebar text-white' : 'bg-bg-card text-text-secondary border border-line hover:bg-table-row-alt'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input 
                type="text" 
                placeholder="Search by name, type, or reason..."
                className="w-full pl-9 pr-4 py-2 bg-bg-card border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#005AFF]/20 focus:border-[#005AFF]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-text-secondary">Loading requests...</div>
          ) : filteredLeaves.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="text-line" size={24} />
              </div>
              <h3 className="text-lg font-bold text-text-secondary">No requests found</h3>
              <p className="text-text-secondary mt-1">There are no leave requests matching your filters.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-bg-secondary text-text-secondary text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold border-b border-line-light">Employee</th>
                  <th className="px-6 py-4 font-bold border-b border-line-light">Type & Dates</th>
                  <th className="px-6 py-4 font-bold border-b border-line-light max-w-[250px]">Reason</th>
                  <th className="px-6 py-4 font-bold border-b border-line-light">Status</th>
                  <th className="px-6 py-4 font-bold border-b border-line-light text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLeaves.map(leave => {
                  const isHighlighted = highlightedLeaveId === String(leave.id);
                  return (
                    <tr 
                      key={leave.id} 
                      ref={isHighlighted ? highlightedRef : null}
                      className={`hover:bg-table-row-alt/50 transition-colors ${isHighlighted ? 'bg-blue-50/40 ring-2 ring-blue-200' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-accent-blue flex items-center justify-center text-xs font-bold">
                            {leave.employeeInitials}
                          </div>
                          <div>
                            <p className="font-bold text-text-primary">{leave.employeeName}</p>
                            <p className="text-xs text-text-secondary">{leave.role} • {leave.department || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-text-primary capitalize">{leave.leaveType} <span className="text-text-secondary font-normal">({leave.durationDays} days)</span></p>
                        <p className="text-xs text-text-secondary mt-0.5">{leave.startDate} to {leave.endDate}</p>
                      </td>
                      <td className="px-6 py-4 max-w-[250px] whitespace-normal">
                        <ExpandableTextCell 
                          text={leave.reason} 
                          modalTitle="Leave Reason Details"
                          extraDetails={
                            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">
                              Applied: {new Date(leave.appliedAt.replace(' ', 'T') + 'Z').toLocaleDateString()}
                            </p>
                          }
                        />
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(leave.status)}
                        {leave.status === 'rejected' && leave.managerRemark && (
                          <div className="mt-1 flex items-start gap-1 text-xs text-red-600">
                            <MessageSquare size={10} className="mt-0.5 flex-shrink-0" />
                            <span className="whitespace-normal break-words">{leave.managerRemark}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {leave.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleAccept(leave.id)}
                              className="px-3 py-1.5 bg-green-50 text-green-700 font-bold rounded text-xs hover:bg-green-100 transition-colors"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => { setRejectingLeave(leave); setRejectReason(''); }}
                              className="px-3 py-1.5 bg-red-50 text-red-700 font-bold rounded text-xs hover:bg-red-100 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted font-medium italic">No actions</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectingLeave && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
          <div className="bg-bg-card rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-line-light flex justify-between items-center bg-bg-sidebar text-white">
              <h2 className="text-lg font-bold">Reject Leave Request</h2>
              <button onClick={() => setRejectingLeave(null)} className="text-white/70 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 bg-bg-secondary p-3 rounded-lg border border-line-light">
                <p className="text-sm font-bold text-text-primary">{rejectingLeave.employeeName}</p>
                <p className="text-xs text-text-secondary capitalize">{rejectingLeave.leaveType} Leave ({rejectingLeave.startDate} - {rejectingLeave.endDate})</p>
              </div>
              
              <label className="block text-sm font-bold text-text-secondary mb-2">Reason for Rejection (Optional)</label>
              <textarea
                className="w-full p-3 bg-bg-card border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 min-h-[100px] resize-none"
                placeholder="Briefly explain why this request is rejected..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                autoFocus
              />
            </div>
            <div className="p-4 border-t border-line-light bg-bg-secondary flex justify-end gap-3">
              <button 
                onClick={() => setRejectingLeave(null)}
                className="px-4 py-2 text-sm font-bold text-text-secondary hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleRejectConfirm}
                className="px-4 py-2 text-sm font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
