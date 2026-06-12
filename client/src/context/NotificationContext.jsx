import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`/api/notifications?_t=${Date.now()}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }, [token, user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      // Optimistic update
      setNotifications(prev => {
        const updated = prev.map(n => n.id === id ? { ...n, is_read: 1 } : n);
        setUnreadCount(updated.filter(n => !n.is_read).length);
        return updated;
      });
      await axios.put(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error marking as read:', err);
      fetchNotifications(); // Revert on failure
    }
  };

  const markSelectedAsRead = async (selectedIds) => {
    try {
      // Optimistic update
      setNotifications(prev => {
        const updated = prev.map(n => selectedIds.includes(n.id) ? { ...n, is_read: 1 } : n);
        setUnreadCount(updated.filter(n => !n.is_read).length);
        return updated;
      });
      await Promise.all(selectedIds.map(id => 
        axios.put(`/api/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } })
      ));
    } catch (err) {
      console.error('Error marking selected as read:', err);
      fetchNotifications(); // Revert on failure
    }
  };

  const markAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications(prev => {
        const updated = prev.map(n => ({ ...n, is_read: 1 }));
        setUnreadCount(0);
        return updated;
      });
      await axios.put('/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error marking all as read:', err);
      fetchNotifications(); // Revert on failure
    }
  };

  const deleteNotifications = async (selectedIds) => {
    try {
      // Optimistic update
      setNotifications(prev => {
        const updated = prev.filter(n => !selectedIds.includes(n.id));
        setUnreadCount(updated.filter(n => !n.is_read).length);
        return updated;
      });
      await axios.delete('/api/notifications', { 
        data: { ids: selectedIds },
        headers: { Authorization: `Bearer ${token}` } 
      });
    } catch (err) {
      console.error('Error deleting notifications:', err);
      fetchNotifications(); // Revert on failure
    }
  };

  const value = {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markSelectedAsRead,
    markAllAsRead,
    deleteNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
