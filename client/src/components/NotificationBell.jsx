import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, MessageSquare, Calendar, AlertCircle, Clock, ArrowRight, BellRing } from 'lucide-react';
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
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
    
    const baseRoute = user?.role === 'manager' ? '/manager' : '/employee';
    
    if (notification.type === 'leave') {
      navigate(`${baseRoute}/leaves${notification.reference_id ? `?leaveId=${notification.reference_id}` : ''}`);
    } else if (notification.type === 'query' || notification.type === 'sprint' || notification.type === 'task' || notification.type === 'subtask') {
      navigate(`${baseRoute}/${user?.role === 'manager' ? 'sprints' : 'tasks'}`); 
    } else {
      navigate(`${baseRoute}/notifications`);
    }
  };

  const getTypeConfig = (type) => {
    switch(type) {
      case 'leave': return { 
        icon: <Calendar size={12} className="text-white" />, 
        color: 'bg-purple-500', 
        badgeLabel: 'Leave', 
        badgeColor: 'text-badge-planner-text bg-badge-planner-bg border-badge-planner-text/30' 
      };
      case 'query': return { 
        icon: <MessageSquare size={12} className="text-white" />, 
        color: 'bg-orange-500', 
        badgeLabel: 'Query', 
        badgeColor: 'text-badge-created-text bg-badge-created-bg border-badge-created-text/30' 
      };
      case 'sprint': return { 
        icon: <CheckCircle2 size={12} className="text-white" />, 
        color: 'bg-blue-500', 
        badgeLabel: 'Sprint', 
        badgeColor: 'text-badge-active-text bg-badge-active-bg border-badge-active-text/30' 
      };
      case 'task':
      case 'subtask': return { 
        icon: <CheckCircle2 size={12} className="text-white" />, 
        color: 'bg-green-500', 
        badgeLabel: 'Completed', 
        badgeColor: 'text-badge-completed-text bg-badge-completed-bg border-badge-completed-text/30' 
      };
      default: return { 
        icon: <AlertCircle size={12} className="text-white" />, 
        color: 'bg-gray-500', 
        badgeLabel: 'System', 
        badgeColor: 'text-text-secondary bg-bg-secondary border-line' 
      };
    }
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString.replace(' ', 'T') + 'Z');
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }
    if (diffInSeconds < 172800) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
        <div 
          className="absolute right-0 mt-3 w-[400px] bg-bg-card rounded-xl border border-line z-50 overflow-hidden transform origin-top-right transition-all duration-150 ease-out shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[16px] text-text-primary">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-badge-active-bg text-badge-active-text text-xs font-bold rounded-full border border-badge-active-text/30">
                  {unreadCount} New
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[13px] font-medium text-accent-blue hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          {/* List Area */}
          <div className="max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#D1D5DB transparent' }}>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center mb-3">
                  <BellRing size={24} className="text-gray-300" />
                </div>
                <h4 className="text-[14px] font-bold text-text-primary">You're all caught up!</h4>
                <p className="text-[13px] text-text-secondary mt-1">No new notifications right now</p>
              </div>
            ) : (
              <div className="py-1">
                {notifications.slice(0, 10).map((notification, index) => {
                  const config = getTypeConfig(notification.type);
                  return (
                    <div key={notification.id}>
                      <div 
                        onClick={() => handleNotificationClick(notification)}
                        className={`group relative px-5 py-3.5 cursor-pointer flex gap-4 transition-colors hover:bg-bg-secondary ${
                          !notification.is_read ? 'bg-table-row-alt' : 'bg-bg-card opacity-90'
                        }`}
                      >
                        {/* Type Border Accent */}
                        <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${!notification.is_read ? config.color : 'bg-transparent group-hover:bg-line'}`} />
                        
                        {/* Avatar / Icon */}
                        <div className="relative flex-shrink-0 mt-0.5">
                          {notification.senderInitials ? (
                            <div className="w-10 h-10 rounded-full bg-accent-blue text-white flex items-center justify-center text-[13px] font-bold shadow-sm">
                              {notification.senderInitials}
                            </div>
                          ) : (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${config.color}`}>
                              {config.icon}
                            </div>
                          )}
                          {/* Small overlap badge for avatar */}
                          {notification.senderInitials && (
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${config.color}`}>
                              {config.icon}
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`text-[14px] ${!notification.is_read ? 'font-semibold text-text-primary' : 'font-medium text-text-primary opacity-90'}`}>
                                {notification.title}
                              </p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${config.badgeColor}`}>
                                {config.badgeLabel}
                              </span>
                            </div>
                            {/* Unread Dot */}
                            {!notification.is_read && (
                              <span className="w-2 h-2 rounded-full bg-accent-blue flex-shrink-0 mt-1.5"></span>
                            )}
                          </div>
                          <p className="text-[13px] text-text-secondary leading-[1.4] line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1 mt-1.5 text-[11px] text-text-muted">
                            <Clock size={11} />
                            <span>{getRelativeTime(notification.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Divider */}
                      {index < Math.min(notifications.length - 1, 9) && (
                        <div className="mx-4 h-[1px] bg-line-light"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="border-t border-line bg-bg-card transition-colors hover:bg-bg-secondary">
            <Link 
              to={user?.role === 'manager' ? '/manager/notifications' : '/employee/notifications'} 
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-1 w-full py-3.5 text-[13px] font-medium text-accent-blue"
            >
              View all notifications <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
