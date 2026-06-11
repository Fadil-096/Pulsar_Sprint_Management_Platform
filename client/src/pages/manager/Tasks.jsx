import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Filter } from 'lucide-react';

export default function Tasks() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTasks();
  }, [token]);

  const fetchTasks = () => {
    axios.get('/api/tasks', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setTasks(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.sprintId === filter);
  
  // Get unique sprint IDs for the filter dropdown
  const sprintIds = [...new Set(tasks.map(t => t.sprintId))];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'done': return <span className="badge badge-done">Done</span>;
      case 'inprogress': return <span className="badge badge-progress">In Progress</span>;
      case 'blocked': return <span className="badge badge-blocked">Blocked</span>;
      default: return <span className="badge badge-todo">To Do</span>;
    }
  };

  if (loading) return <div>Loading tasks...</div>;

  return (
    <div>
      <div className="page-header flex justify-between items-start mb-6">
        <div>
          <h1 className="text-xl font-medium mb-1">All Tasks</h1>
          <p className="text-text-secondary text-sm">{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-text-tertiary" />
          <select 
            className="input-field py-1.5 w-auto" 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
          >
            <option value="all">All Sprints</option>
            {sprintIds.map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-bg-primary rounded-lg border-[0.5px] border-border-light overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-bg-secondary border-b-[0.5px] border-border-light text-[11px] text-text-secondary uppercase tracking-wider">
              <th className="py-3 px-4 font-medium">Sprint</th>
              <th className="py-3 px-4 font-medium">Task ID</th>
              <th className="py-3 px-4 font-medium">Employee</th>
              <th className="py-3 px-4 font-medium">Title</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Est</th>
              <th className="py-3 px-4 font-medium">Spent</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map(task => (
              <tr key={task.id} className="border-b-[0.5px] border-border-light hover:bg-bg-secondary transition-colors text-[13px]">
                <td className="py-2.5 px-4">{task.sprintId}</td>
                <td className="py-2.5 px-4 font-medium text-blue-600">{task.taskId}</td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center text-[10px] font-medium border-[0.5px] border-blue-200">
                      {task.assigneeInitials}
                    </div>
                    <span>{task.assigneeName.split(' ')[0]}</span>
                  </div>
                </td>
                <td className="py-2.5 px-4">{task.title}</td>
                <td className="py-2.5 px-4">{getStatusBadge(task.status)}</td>
                <td className="py-2.5 px-4">{task.estimatedHours}h</td>
                <td className="py-2.5 px-4">{task.spentHours}h</td>
              </tr>
            ))}
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan="7" className="py-8 text-center text-text-secondary">
                  No tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
