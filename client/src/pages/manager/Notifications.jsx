import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Bell, CheckCircle2, MessageSquare, Calendar, AlertCircle, Trash2, Search, Filter, CheckSquare, X } from 'lucide-react';

export default function Notifications() {
  const { token } = useAuth();
  const { 
    notifications, 
    markAsRead, 
    markSelectedAsRead, 
    deleteNotifications 
  } = useNotification();
  
  const [leaves, setLeaves] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const fetchLeaves = async () => {
    if (!token) return;
    try {
      const leaveRes = await axios.get('/api/leaves', { headers: { Authorization: `Bearer ${token}` } });
      setLeaves(leaveRes.data);
    } catch (err) {
      console.error('Failed to fetch leaves', err);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [token]);

  const handleBulkMarkRead = async () => {
    await markSelectedAsRead(selectedIds);
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm("Delete selected notifications?")) return;
    await deleteNotifications(selectedIds);
    setSelectedIds([]);
  };

  const handleActionLeave = async (id, status) => {
    try {
      await axios.put(`/api/leaves/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedLeave(null);
      fetchLeaves();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id));
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'Unread' && n.is_read) return false;
    if (activeTab === 'Queries' && n.type !== 'query') return false;
    if (activeTab === 'Leave Requests' && n.type !== 'leave') return false;
    if (activeTab === 'Sprint' && !['sprint', 'task', 'subtask'].includes(n.type)) return false;
    if (activeTab === 'General' && !['system', 'general'].includes(n.type)) return false;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return n.title.toLowerCase().includes(term) || n.message.toLowerCase().includes(term) || (n.senderName && n.senderName.toLowerCase().includes(term));
    }
    return true;
  });

  const getIcon = (type) => {
    switch(type) {
      case 'leave': return <Calendar size={18} className="text-purple-500" />;
      case 'query': return <MessageSquare size={18} className="text-blue-500" />;
      case 'sprint': 
      case 'task':
      case 'subtask': return <CheckCircle2 size={18} className="text-green-500" />;
      default: return <AlertCircle size={18} className="text-orange-500" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#020024]">Notifications Manager</h1>
          <p className="text-gray-500 text-sm mt-1">Manage team updates, queries, and leave requests.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('Leave Requests')}
            className="px-4 py-2 bg-purple-50 text-purple-700 font-bold rounded-lg text-sm border border-purple-100 hover:bg-purple-100 transition-colors"
          >
            Pending Leaves ({leaves.filter(l => l.status === 'pending').length})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar w-full md:w-auto">
            {['All', 'Unread', 'Queries', 'Leave Requests', 'Sprint', 'General'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedIds([]); }}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                  activeTab === tab ? 'bg-[#020024] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search notifications..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#005AFF]/20 focus:border-[#005AFF]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 bg-white">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <span className="text-sm font-bold text-blue-800">{selectedIds.length} selected</span>
            <div className="flex gap-2">
              <button onClick={handleBulkMarkRead} className="px-3 py-1.5 bg-white text-blue-700 text-xs font-bold rounded border border-blue-200 shadow-sm hover:bg-blue-50">
                Mark as Read
              </button>
              <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-white text-red-600 text-xs font-bold rounded border border-red-200 shadow-sm hover:bg-red-50">
                Delete
              </button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="divide-y divide-gray-100">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="text-gray-300" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-700">All Caught Up!</h3>
              <p className="text-gray-500 mt-1">No notifications found for this filter.</p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-4 flex items-start gap-4 transition-colors hover:bg-gray-50 ${!notification.is_read ? 'bg-blue-50/20' : ''}`}
                onClick={() => {
                  if (!notification.is_read) markAsRead(notification.id);
                  if (notification.type === 'leave' && notification.reference_id) {
                    const l = leaves.find(x => x.id.toString() === notification.reference_id.toString());
                    if (l) setSelectedLeave(l);
                  }
                }}
              >
                <div className="mt-1 flex items-center h-full" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(notification.id)}
                    onChange={() => toggleSelect(notification.id)}
                    className="w-4 h-4 text-[#005AFF] rounded border-gray-300 focus:ring-[#005AFF]"
                  />
                </div>
                
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {getIcon(notification.type)}
                  </div>
                </div>

                <div className="flex-1 min-w-0 cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {!notification.is_read && <span className="w-2 h-2 rounded-full bg-[#005AFF]"></span>}
                      <span className="text-sm font-bold text-[#020024]">{notification.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                        {notification.type}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">
                      {notification.created_at ? new Date(notification.created_at.replace(' ', 'T') + 'Z').toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Leave Request Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#020024] text-white">
              <h2 className="text-lg font-bold">Leave Request Details</h2>
              <button onClick={() => setSelectedLeave(null)} className="text-white/70 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-[#005AFF] flex items-center justify-center font-bold text-lg">
                  {selectedLeave.employeeInitials}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedLeave.employeeName}</h3>
                  <p className="text-sm text-gray-500">{selectedLeave.role} • {selectedLeave.department}</p>
                </div>
                <div className="ml-auto">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    selectedLeave.status === 'approved' ? 'bg-green-100 text-green-700' :
                    selectedLeave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedLeave.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Leave Type</label>
                  <p className="font-medium text-gray-900 capitalize">{selectedLeave.leave_type}</p>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Duration</label>
                  <p className="font-medium text-gray-900">{selectedLeave.duration_days} Day(s)</p>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Start Date</label>
                  <p className="font-medium text-gray-900">{selectedLeave.start_date}</p>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase">End Date</label>
                  <p className="font-medium text-gray-900">{selectedLeave.end_date}</p>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase">Reason provided</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-100 min-h-[80px]">
                  {selectedLeave.reason}
                </div>
              </div>
            </div>

            {selectedLeave.status === 'pending' && (
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
                <button 
                  onClick={() => handleActionLeave(selectedLeave.id, 'rejected')}
                  className="px-5 py-2 text-sm font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Reject
                </button>
                <button 
                  onClick={() => handleActionLeave(selectedLeave.id, 'approved')}
                  className="px-5 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-colors"
                >
                  Approve Leave
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
