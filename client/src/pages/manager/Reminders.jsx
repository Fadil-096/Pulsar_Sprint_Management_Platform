import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Bell, AlertTriangle, Info, CheckCircle } from 'lucide-react';

export default function Reminders() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const fetchNotifications = () => {
    axios.get('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setNotifications(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const markAsRead = (id) => {
    axios.patch(`/api/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => fetchNotifications())
      .catch(err => console.error(err));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'blocked': return <AlertTriangle className="text-red-600" size={18} />;
      case 'sprint': return <Info className="text-accent-blue" size={18} />;
      default: return <Bell className="text-text-tertiary" size={18} />;
    }
  };

  if (loading) return <div>Loading reminders...</div>;

  return (
    <div>
      <div className="page-header mb-6">
        <h1 className="text-xl font-medium mb-1">Reminders & Notifications</h1>
        <p className="text-text-secondary text-sm">Stay updated on team activity and blocked tasks.</p>
      </div>

      <div className="card max-w-3xl">
        <div className="space-y-3">
          {notifications.map(notif => (
            <div 
              key={notif.id} 
              className={`p-4 border-[0.5px] rounded-md flex gap-4 ${notif.is_read ? 'bg-bg-primary border-line-light' : 'bg-blue-50/30 border-blue-200'}`}
            >
              <div className="mt-1">{getIcon(notif.type)}</div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`text-[14px] ${notif.is_read ? 'font-medium text-text-primary' : 'font-semibold text-blue-900'}`}>
                    {notif.title}
                  </h3>
                  <span className="text-[11px] text-text-tertiary">
                    {new Date(notif.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[13px] text-text-secondary mb-2">{notif.message}</p>
                {!notif.is_read && (
                  <button 
                    onClick={() => markAsRead(notif.id)}
                    className="text-[12px] text-accent-blue font-medium hover:underline flex items-center gap-1"
                  >
                    <CheckCircle size={14} /> Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-8 text-text-secondary">
              <Bell className="mx-auto text-border-medium mb-2" size={32} />
              <p>You're all caught up!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
