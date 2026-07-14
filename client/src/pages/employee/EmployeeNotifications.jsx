import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Bell, CheckCircle2, MessageSquare, Calendar, AlertCircle, Trash2, Search, Filter, CheckSquare, X } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import { useNavigate } from 'react-router-dom';

export default function EmployeeNotifications() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { 
    notifications, 
    markAsRead, 
    markSelectedAsRead, 
    deleteNotifications 
  } = useNotification();
  
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleBulkMarkRead = async () => {
    await markSelectedAsRead(selectedIds);
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    setShowConfirmModal(true);
  };

  const confirmBulkDelete = async () => {
    await deleteNotifications(selectedIds);
    setSelectedIds([]);
    setShowConfirmModal(false);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id));
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'Unread' && n.is_read) return false;
    if (activeTab === 'Queries' && n.type !== 'query') return false;
    if (activeTab === 'Leave Updates' && n.type !== 'leave') return false;
    if (activeTab === 'Sprint & Tasks' && !['sprint', 'task', 'subtask'].includes(n.type)) return false;
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

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) markAsRead(notification.id);
    
    if (notification.type === 'leave') {
      navigate(`/employee/leaves${notification.reference_id ? `?leaveId=${notification.reference_id}` : ''}`);
    } else if (['query', 'sprint', 'task', 'subtask'].includes(notification.type)) {
      navigate('/employee/tasks');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Notifications</h1>
          <p className="text-text-secondary text-sm mt-1">Stay updated with your tasks, sprints, and leave requests.</p>
        </div>
      </div>

      <div className="bg-bg-card rounded-2xl shadow-sm border border-line-light overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-line-light bg-gray-50/50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar w-full md:w-auto">
            {['All', 'Unread', 'Queries', 'Leave Updates', 'Sprint & Tasks', 'General'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedIds([]); }}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                  activeTab === tab ? 'bg-bg-sidebar text-white' : 'bg-bg-card text-text-secondary border border-line hover:bg-gray-50'
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
                placeholder="Search notifications..."
                className="w-full pl-9 pr-4 py-2 bg-bg-card border border-line rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#005AFF]/20 focus:border-[#005AFF]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-2 border border-line text-text-secondary rounded-2xl hover:bg-gray-50 bg-bg-card">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* List Header & Bulk Actions */}
        {filteredNotifications.length > 0 && (
          <div className={`px-4 py-3 border-b flex items-center justify-between transition-colors ${selectedIds.length > 0 ? 'bg-blue-50 border-blue-100' : 'bg-bg-secondary border-line-light'}`}>
            <div className="flex items-center gap-4">
              <input 
                type="checkbox" 
                checked={selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-accent-blue rounded-xl border-line focus:ring-[#005AFF]"
              />
              <span className={`text-sm font-bold ${selectedIds.length > 0 ? 'text-blue-800' : 'text-text-secondary uppercase tracking-wider text-[11px]'}`}>
                {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'Select All'}
              </span>
            </div>
            
            {selectedIds.length > 0 && (
              <div className="flex gap-2">
                <button onClick={handleBulkMarkRead} className="px-3 py-1.5 bg-bg-card text-blue-700 text-xs font-bold rounded-xl border border-blue-200 shadow-sm hover:bg-blue-50">
                  Mark as Read
                </button>
                <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-bg-card text-red-600 text-xs font-bold rounded-xl border border-red-200 shadow-sm hover:bg-red-50">
                  Delete
                </button>
              </div>
            )}
          </div>
        )}

        {/* List */}
        <div className="divide-y divide-gray-100">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="text-gray-300" size={24} />
              </div>
              <h3 className="text-lg font-bold text-text-secondary">All Caught Up!</h3>
              <p className="text-text-secondary mt-1">No notifications found for this filter.</p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-4 flex items-start gap-4 transition-colors hover:bg-gray-50 ${!notification.is_read ? 'bg-blue-50/20' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="mt-1 flex items-center h-full" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(notification.id)}
                    onChange={() => toggleSelect(notification.id)}
                    className="w-4 h-4 text-accent-blue rounded-xl border-line focus:ring-[#005AFF]"
                  />
                </div>
                
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center">
                    {getIcon(notification.type)}
                  </div>
                </div>

                <div className="flex-1 min-w-0 cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {!notification.is_read && <span className="w-2 h-2 rounded-full bg-accent-blue"></span>}
                      <span className="text-sm font-bold text-text-primary">{notification.title}</span>
                      <span className="px-2 py-0.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-bg-secondary text-text-secondary">
                        {notification.type}
                      </span>
                    </div>
                    <span className="text-xs text-text-muted font-medium">
                      {notification.created_at ? new Date(notification.created_at.replace(' ', 'T') + 'Z').toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{notification.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Notifications?"
        bodyText="This will permanently delete the selected notifications. This action cannot be undone."
        confirmText="Delete Notifications"
        iconType="danger"
      />
    </div>
  );
}
