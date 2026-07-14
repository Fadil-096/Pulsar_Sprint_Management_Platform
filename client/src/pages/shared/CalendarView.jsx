import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, Plus, Bell, X, Trash2 } from 'lucide-react';

const CalendarView = () => {
  const { token, user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sprints, setSprints] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [reminderForm, setReminderForm] = useState({ title: '', description: '', reminder_date: new Date().toISOString().split('T')[0] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sprintsRes, leavesRes, remindersRes] = await Promise.all([
        axios.get('/api/sprints', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(user.role === 'employee' ? `/api/leaves/employee/${user.id}` : '/api/leaves', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get('/api/reminders', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
      ]);
      
      const validSprints = (sprintsRes.data || []).filter(s => (s.startDate || s.start_date) && (s.endDate || s.end_date)).flatMap(s => [
        {
          ...s,
          type: 'sprint_start',
          start: new Date(s.startDate || s.start_date),
          end: new Date(s.startDate || s.start_date)
        },
        {
          ...s,
          type: 'sprint_end',
          start: new Date(s.endDate || s.end_date),
          end: new Date(s.endDate || s.end_date)
        }
      ]);

      const plannerEvents = (sprintsRes.data || []).filter(s => s.plannerDate || s.planner_date).map(s => ({
        ...s,
        type: 'planner_event',
        start: new Date(s.plannerDate || s.planner_date),
        end: new Date(s.plannerDate || s.planner_date)
      }));
      
      const validLeaves = (leavesRes.data || []).filter(l => l.status === 'accepted' && (l.startDate || l.start_date) && (l.endDate || l.end_date)).map(l => ({
        ...l,
        type: 'leave',
        start: new Date(l.startDate || l.start_date),
        end: new Date(l.endDate || l.end_date)
      }));

      const validReminders = (remindersRes.data || []).map(r => ({
        ...r,
        type: 'reminder',
        start: new Date(r.reminder_date),
        end: new Date(r.reminder_date)
      }));

      // Combine reminders and planner events so they both get rendered seamlessly
      setSprints(validSprints);
      setLeaves(validLeaves);
      setReminders([...validReminders, ...plannerEvents]);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token, currentDate]);

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!reminderForm.title || !reminderForm.reminder_date) return;
    
    try {
      setIsSubmitting(true);
      await axios.post('/api/reminders', reminderForm, { headers: { Authorization: `Bearer ${token}` } });
      setShowAddReminder(false);
      setReminderForm({ title: '', description: '', reminder_date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (error) {
      console.error('Error adding reminder', error);
      alert('Failed to add reminder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = (event, e) => {
    e.stopPropagation();
    
    let eventId = event.id;
    if (event.type === 'sprint') eventId = event.sprintId || event.sprint_id || event.id;
    
    let eventTitle = event.title;
    if (event.type === 'sprint') {
      eventTitle = event.sprintName || event.name || event.sprint_name || `Sprint ${eventId}`;
    } else if (event.type === 'leave') {
      eventTitle = `${event.leave_type || event.leaveType} Leave${event.employeeInitials ? ` (${event.employeeInitials})` : ''}`;
    } else if (event.type === 'reminder') {
      eventTitle = event.title || 'Reminder';
    }

    setDeleteConfirm({
      id: eventId,
      type: event.type,
      title: eventTitle || 'Event'
    });
  };

  const confirmDeleteEvent = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'reminder') {
        await axios.delete(`/api/reminders/${deleteConfirm.id}`, { headers: { Authorization: `Bearer ${token}` } });
      } else if (deleteConfirm.type === 'sprint') {
        await axios.delete(`/api/sprints/${deleteConfirm.id}`, { headers: { Authorization: `Bearer ${token}` } });
      } else if (deleteConfirm.type === 'leave') {
        await axios.delete(`/api/leaves/${deleteConfirm.id}`, { headers: { Authorization: `Bearer ${token}` } });
      }
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      console.error(`Error deleting ${deleteConfirm.type}:`, err);
    }
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const today = () => setCurrentDate(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const startDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: startDayOfMonth === 0 ? 6 : startDayOfMonth - 1 }, (_, i) => i);

  const allEvents = [...sprints, ...leaves, ...reminders];

  const getEventsForDay = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    date.setHours(0, 0, 0, 0);
    
    return allEvents.filter(event => {
      const eventStart = new Date(event.start);
      eventStart.setHours(0, 0, 0, 0);
      
      const eventEnd = new Date(event.end);
      eventEnd.setHours(23, 59, 59, 999);
      
      return date >= eventStart && date <= eventEnd;
    });
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-primary text-text-primary relative">
      <div className="px-8 py-6 border-b border-line flex items-center justify-between bg-bg-card shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-text-secondary mt-1">View all sprints, leaves, and schedules.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowAddReminder(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-2xl text-sm font-bold shadow-md hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} /> Add Reminder
          </button>
          <div className="flex items-center gap-2 bg-bg-secondary p-1 rounded-2xl border border-line ml-4">
            <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-2xl transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold w-32 text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-2xl transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
          <button onClick={today} className="px-4 py-2 bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 rounded-2xl text-sm font-bold transition-colors">
            Today
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/50 backdrop-blur-sm z-10">
            <Loader2 className="animate-spin text-accent-blue" size={32} />
          </div>
        ) : null}
        
        <div className="bg-bg-card border border-line rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
          <div 
            className="border-b border-line shrink-0"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
          >
            {weekDays.map(day => (
              <div key={day} className="py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-widest border-r border-line last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          
          <div 
            className="flex-1 bg-line gap-px overflow-y-auto"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gridAutoRows: 'minmax(120px, 1fr)' }}
          >
            {blanks.map((_, i) => (
              <div key={`blank-${i}`} className="bg-bg-card/40 p-2 min-h-[120px]"></div>
            ))}
            
            {days.map(day => {
              const dayEvents = getEventsForDay(day);
              const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
              
              return (
                <div key={day} className="bg-bg-card p-2 min-h-[120px] transition-colors hover:bg-bg-secondary/30 relative group flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${isToday ? 'bg-accent-blue text-white shadow-md' : 'text-text-primary'}`}>
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold text-text-muted bg-white/5 border border-line px-1.5 py-0.5 rounded-xl">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto scrollbar-hide">
                    {dayEvents.map((event, idx) => {
                      const isSprintStart = event.type === 'sprint_start';
                      const isSprintEnd = event.type === 'sprint_end';
                      const isLeave = event.type === 'leave';
                      const isReminder = event.type === 'reminder';
                      const isPlanner = event.type === 'planner_event';
                      
                      let colorClasses = '';
                      let dotColor = '';
                      let eventTitle = '';
                      
                      const sprintName = event.sprintName || event.name || event.sprint_name || `Sprint ${event.sprintId || event.sprint_id}`;
                      
                      if (isSprintStart) {
                        colorClasses = 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20';
                        dotColor = 'bg-blue-500';
                        eventTitle = `Start: ${sprintName}`;
                      } else if (isSprintEnd) {
                        colorClasses = 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20';
                        dotColor = 'bg-red-500';
                        eventTitle = `End: ${sprintName}`;
                      } else if (isLeave) {
                        colorClasses = 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20';
                        dotColor = 'bg-orange-500';
                        eventTitle = `${event.leave_type || event.leaveType} Leave${event.employeeInitials ? ` (${event.employeeInitials})` : ''}`;
                      } else if (isReminder) {
                        colorClasses = 'bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20';
                        dotColor = 'bg-purple-500';
                        eventTitle = event.title;
                      } else if (isPlanner) {
                        colorClasses = 'bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20';
                        dotColor = 'bg-teal-500';
                        eventTitle = `${event.sprintName || event.sprint_name || `Sprint ${event.sprintId || event.sprint_id}`} - Planner Phase`;
                      }
                      
                      return (
                        <div 
                          key={`${event.type}-${event.id || event.sprintId || event.sprint_id || idx}`}
                          className={`
                            px-2 py-1 rounded-xl text-xs font-medium cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-sm
                            ${colorClasses} flex items-center justify-between
                          `}
                          title={!isLeave ? (isReminder && event.description ? `${eventTitle}: ${event.description}` : eventTitle) : undefined}
                          onMouseEnter={(e) => {
                            if (isLeave && event.employeeName) {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTooltip({
                                show: true,
                                text: event.employeeName,
                                x: rect.left + rect.width / 2,
                                y: rect.top - 4
                              });
                            }
                          }}
                          onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {isReminder ? <Bell size={10} className="text-purple-500 shrink-0" /> : <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`}></span>}
                            <span className="truncate">{eventTitle}</span>
                          </div>
                          {isReminder && (
                            <button 
                              onClick={(e) => handleDeleteEvent(event, e)}
                              className="transition-colors ml-2 shrink-0 p-0.5 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-purple-400/60"
                              title={`Delete ${event.type}`}
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="mt-6 flex items-center gap-6 justify-center pb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-xs font-medium text-text-secondary">Sprint Starts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-xs font-medium text-text-secondary">Sprint Ends</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            <span className="text-xs font-medium text-text-secondary">Leaves</span>
          </div>
          <div className="flex items-center gap-2">
            <Bell size={12} className="text-purple-500" />
            <span className="text-xs font-medium text-text-secondary">Reminders</span>
          </div>
        </div>
      </div>

      {/* Add Reminder Modal */}
      {showAddReminder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card border border-line rounded-2xl w-full max-w-md shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between p-5 border-b border-line">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Bell size={18} className="text-purple-500" /> Add Reminder
              </h2>
              <button onClick={() => setShowAddReminder(false)} className="text-text-tertiary hover:text-text-primary transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddReminder} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Title <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={reminderForm.title}
                  onChange={(e) => setReminderForm({...reminderForm, title: e.target.value})}
                  className="w-full bg-bg-secondary border border-line rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-accent-blue"
                  placeholder="E.g., Team Sync Meeting"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Date <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  required
                  value={reminderForm.reminder_date}
                  onChange={(e) => setReminderForm({...reminderForm, reminder_date: e.target.value})}
                  className="w-full bg-bg-secondary border border-line rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-accent-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Description (Optional)</label>
                <textarea 
                  value={reminderForm.description}
                  onChange={(e) => setReminderForm({...reminderForm, description: e.target.value})}
                  className="w-full bg-bg-secondary border border-line rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-accent-blue resize-none"
                  rows="3"
                  placeholder="Additional details..."
                />
              </div>
              
              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddReminder(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-sm font-medium shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card border border-line rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in-up">
            <div className="p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2 capitalize">Delete {deleteConfirm.type}?</h3>
              <p className="text-sm text-text-secondary">Are you sure you want to delete <span className="font-bold text-text-primary">"{deleteConfirm.title}"</span>? This action cannot be undone.</p>
            </div>
            <div className="p-4 border-t border-line flex justify-end gap-3 bg-bg-secondary/50 rounded-b-xl">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteEvent}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-sm font-medium shadow-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Custom Global Tooltip */}
      {tooltip.show && (
        <div 
          className="fixed z-[9999] bg-[#1e2330] text-white text-[11px] font-bold py-1 px-3 rounded-lg shadow-xl border border-white/10 whitespace-nowrap pointer-events-none -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
          <div className="w-2 h-2 bg-[#1e2330] border-r border-b border-white/10 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
