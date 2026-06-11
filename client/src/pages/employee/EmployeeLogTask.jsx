import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export default function EmployeeLogTask() {
  const { user, token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [hours, setHours] = useState('');
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (user?.id) {
      axios.get(`/api/tasks/employee/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          const activeTasks = res.data.filter(t => t.sprintStatus === 'active' && t.status !== 'done');
          setTasks(activeTasks);
          if (activeTasks.length > 0) {
            setSelectedTask(activeTasks[0].taskId);
            setStatus(activeTasks[0].status);
          }
        });
    }
  }, [user, token]);

  const handleTaskChange = (taskId) => {
    setSelectedTask(taskId);
    const task = tasks.find(t => t.taskId === taskId);
    if (task) setStatus(task.status);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    try {
      const task = tasks.find(t => t.taskId === selectedTask);
      
      // Update status if changed
      if (status !== task.status) {
        await axios.patch(`/api/tasks/${selectedTask}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      }

      // Update hours if added
      if (hours && !isNaN(hours)) {
        const newSpent = task.spentHours + parseFloat(hours);
        await axios.put(`/api/tasks/${selectedTask}`, { spentHours: newSpent }, { headers: { Authorization: `Bearer ${token}` } });
      }

      setMessage({ text: 'Task updated successfully!', type: 'success' });
      setHours('');
      
      // Refresh task list
      const res = await axios.get(`/api/tasks/employee/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setTasks(res.data.filter(t => t.sprintStatus === 'active' && t.status !== 'done'));
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Failed to update task', type: 'error' });
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="page-header mb-6">
        <h1 className="text-xl font-medium mb-1">Log Task Progress</h1>
        <p className="text-text-secondary text-sm">Update your task status and log hours spent.</p>
      </div>

      <div className="card">
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-text-secondary">
            You have no active tasks to update.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-[12px] text-text-secondary mb-1">Select Task</label>
              <select 
                className="input-field" 
                value={selectedTask}
                onChange={(e) => handleTaskChange(e.target.value)}
                required
              >
                {tasks.map(t => (
                  <option key={t.id} value={t.taskId}>{t.taskId} - {t.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[12px] text-text-secondary mb-1">Log Hours</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="e.g. 2.5"
                  step="0.5"
                  min="0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[12px] text-text-secondary mb-1">Status</label>
                <select 
                  className="input-field" 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                >
                  <option value="todo">To Do</option>
                  <option value="inprogress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>

            {message.text && (
              <div className={`mb-4 px-3.5 py-2.5 rounded-md text-[13px] border-[0.5px] ${message.type === 'success' ? 'bg-green-50 text-green-800 border-[#C0DD97]' : 'bg-amber-50 text-amber-600 border-[#FAC775]'}`}>
                {message.text}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button type="submit" className="btn btn-primary">Update Task</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
