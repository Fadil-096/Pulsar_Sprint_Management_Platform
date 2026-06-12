import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, AlertCircle } from 'lucide-react';

export default function SprintTimer({ sprint, compact = false }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [elapsed, setElapsed] = useState(null);
  const [status, setStatus] = useState('normal'); // normal, warning, critical, expired

  useEffect(() => {
    if (!sprint || sprint.status === 'created' || sprint.status === 'planner') {
      setTimeLeft(null);
      setElapsed(null);
      setStatus('normal');
      return;
    }

    if (sprint.status === 'completed') {
       // Just show final completed state
       const start = new Date(sprint.start_date + 'T00:00:00').getTime();
       const end = new Date(sprint.end_date + 'T23:59:59').getTime();
       const diff = Math.max(0, end - start);
       const days = Math.floor(diff / (1000 * 60 * 60 * 24));
       setElapsed(`Completed in ${days} days`);
       setTimeLeft('Sprint Completed');
       setStatus('normal');
       return;
    }

    const start = new Date(sprint.start_date + 'T00:00:00').getTime();
    const end = new Date(sprint.end_date + 'T23:59:59').getTime();
    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    const updateTimer = () => {
      const now = Date.now();
      
      // Elapsed calculation
      const elapsedMs = Math.max(0, now - start);
      const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24)) + 1;
      setElapsed(`Day ${Math.min(elapsedDays, totalDays)} of ${totalDays}`);

      // Remaining calculation
      const remainingMs = end - now;
      if (remainingMs <= 0) {
        setStatus('expired');
        const overdueHours = Math.floor(Math.abs(remainingMs) / (1000 * 60 * 60));
        setTimeLeft(`Overdue by ${overdueHours}h`);
      } else {
        const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remainingMs / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((remainingMs / (1000 * 60)) % 60);

        if (days <= 1) {
          setStatus('critical');
        } else if (days <= 2) {
          setStatus('warning');
        } else {
          setStatus('normal');
        }

        if (compact) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${days} Days, ${hours} Hours, ${minutes} Minutes remaining`);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // tick every minute is enough for minutes display
    return () => clearInterval(interval);
  }, [sprint, compact]);

  if (!sprint) return null;

  if (sprint.status === 'created' || sprint.status === 'planner') {
    return (
      <div className={`flex items-center gap-2 text-gray-500 font-medium ${compact ? 'text-xs' : 'text-sm bg-gray-50 p-3 rounded-lg border border-gray-200'}`}>
        <Clock size={compact ? 14 : 18} />
        <span>Timer will start once sprint is Active</span>
      </div>
    );
  }

  let colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
  let icon = <Clock size={compact ? 14 : 18} />;
  let tag = null;

  if (status === 'warning') {
    colorClasses = 'bg-orange-50 text-orange-700 border-orange-200';
    icon = <AlertTriangle size={compact ? 14 : 18} />;
    tag = <span className="bg-orange-200 text-orange-800 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ml-2">Ending Soon</span>;
  } else if (status === 'critical') {
    colorClasses = 'bg-red-50 text-red-700 border-red-200 animate-pulse-slow';
    icon = <AlertCircle size={compact ? 14 : 18} className="animate-bounce" />;
    tag = <span className="bg-red-600 text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ml-2">Critical</span>;
  } else if (status === 'expired') {
    colorClasses = 'bg-red-100 text-red-800 border-red-300';
    icon = <AlertCircle size={compact ? 14 : 18} />;
  }

  if (sprint.status === 'completed') {
    colorClasses = 'bg-green-50 text-green-700 border-green-200';
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded border font-bold text-xs ${colorClasses}`}>
        {icon}
        <span>{timeLeft}</span>
        {status !== 'expired' && sprint.status !== 'completed' && <span className="text-[10px] font-medium opacity-80 ml-1">({elapsed})</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border shadow-sm ${colorClasses}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white bg-opacity-50 rounded-full">
          {icon}
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase opacity-80 mb-0.5 flex items-center">
            {sprint.status === 'completed' ? 'Final Status' : 'Time Remaining'}
            {tag}
          </div>
          <div className="text-base font-bold leading-none">{timeLeft}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-[10px] font-bold uppercase opacity-80 mb-0.5">Time Elapsed</div>
        <div className="text-sm font-semibold">{elapsed}</div>
      </div>
    </div>
  );
}
