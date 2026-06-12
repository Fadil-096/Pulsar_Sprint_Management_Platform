import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, MessageSquare, Calendar, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  } = useNotification();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setIsOpen(false);
    
    const baseRoute = user?.role === 'manager' ? '/manager' : '/employee';
    
    // Route based on type
    if (notification.type === 'leave') {
      navigate(`${baseRoute}/leaves${notification.reference_id ? `?leaveId=${notification.reference_id}` : ''}`);
    } else if (notification.type === 'query' || notification.type === 'sprint' || notification.type === 'task' || notification.type === 'subtask') {
      navigate(`${baseRoute}/${user?.role === 'manager' ? 'sprints' : 'tasks'}`); 
    } else {
      navigate(`${baseRoute}/notifications`);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'leave': return <Calendar size={16} className="text-purple-500" />;
      case 'query': return <MessageSquare size={16} className="text-blue-500" />;
      case 'sprint': 
      case 'task':
      case 'subtask': return <CheckCircle2 size={16} className="text-green-500" />;
      default: return <AlertCircle size={16} className="text-orange-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white/80 hover:text-white transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-bold items-center justify-center text-white border-2 border-[#020024]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 text-gray-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-[#005AFF] hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                No notifications yet.
              </div>
            ) : (
              notifications.slice(0, 10).map(notification => (
                <div 
                  key={notification.id} 
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer flex gap-3 transition-colors ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {notification.senderInitials ? (
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-[#005AFF] flex items-center justify-center text-[10px] font-bold">
                        {notification.senderInitials}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        {getIcon(notification.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#005AFF] flex-shrink-0 mt-1.5"></span>
                      )}
                    </div>
                    <p className="text-[12px] text-gray-500 line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wider">
                      {notification.created_at ? new Date(notification.created_at.replace(' ', 'T') + 'Z').toLocaleString() : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
            <Link 
              to={user?.role === 'manager' ? '/manager/notifications' : '/employee/notifications'} 
              onClick={() => setIsOpen(false)}
              className="text-[12px] font-bold text-[#005AFF] hover:underline uppercase tracking-wider"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
