import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, AlertCircle } from 'lucide-react';

// Helper to safely parse dates that might be in DD-MM-YYYY or YYYY-MM-DD format
const parseSafeDate = (dateStr, isEndOfDay = false) => {
  if (!dateStr) return NaN;
  
  // Try to parse standard ISO format or valid date string first
  let dt = new Date(dateStr);
  
  // If Invalid Date and contains '-', try manual parsing for DD-MM-YYYY
  if (isNaN(dt.getTime()) && typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      if (parts[2].length === 4) { // DD-MM-YYYY
        dt = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      } else if (parts[0].length === 4) { // YYYY-MM-DD
        dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }
  }

  if (isNaN(dt.getTime())) return NaN;

  if (isEndOfDay) {
    dt.setHours(23, 59, 59, 999);
  } else {
    dt.setHours(0, 0, 0, 0);
  }
  return dt.getTime();
};

export default function SprintTimer({ sprint, compact = false }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [elapsed, setElapsed] = useState(null);
  const [status, setStatus] = useState('normal'); // normal, warning, critical, expired, invalid

  useEffect(() => {
    if (!sprint) return;

    if (sprint.status === 'created' || sprint.status === 'planner') {
      setTimeLeft(null);
      setElapsed(null);
      setStatus('pending');
      return;
    }

    const startVal = sprint.start_date || sprint.startDate;
    const endVal = sprint.end_date || sprint.endDate;

    const startMs = parseSafeDate(startVal, false);
    const endMs = parseSafeDate(endVal, true);

    if (isNaN(startMs) || isNaN(endMs)) {
      setStatus('invalid');
      return;
    }

    if (sprint.status === 'completed') {
       const diff = Math.max(0, endMs - startMs);
       const days = Math.floor(diff / (1000 * 60 * 60 * 24));
       setElapsed(`Completed in ${days} days`);
       setTimeLeft('Sprint Completed');
       setStatus('normal');
       return;
    }

    const totalDays = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)));

    const updateTimer = () => {
      const now = Date.now();
      
      // Elapsed calculation
      const elapsedMs = Math.max(0, now - startMs);
      const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24)) + 1;
      setElapsed(`Day ${Math.min(elapsedDays, totalDays)} of ${totalDays}`);

      // Remaining calculation
      const remainingMs = endMs - now;
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

  if (status === 'invalid') {
    return (
      <div className={`flex items-center gap-2 text-text-secondary font-medium ${compact ? 'text-xs' : 'text-sm bg-bg-secondary p-3 rounded-lg border border-line'}`}>
        <AlertTriangle size={compact ? 14 : 18} className="text-orange-400" />
        <span>Timer unavailable (Invalid dates)</span>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className={`flex items-center gap-2 text-text-secondary font-medium ${compact ? 'text-xs' : 'text-sm bg-bg-secondary p-3 rounded-lg border border-line'}`}>
        <Clock size={compact ? 14 : 18} />
        <span>Timer will start once Active</span>
      </div>
    );
  }

  let colorClasses = 'bg-badge-active-bg text-badge-active-text border border-badge-active-text/30';
  let icon = <Clock size={compact ? 14 : 18} />;
  let tag = null;

  if (status === 'warning') {
    colorClasses = 'bg-badge-pending-bg text-badge-pending-text border border-badge-pending-text/30';
    icon = <AlertTriangle size={compact ? 14 : 18} />;
    tag = <span className="bg-badge-pending-text text-bg-primary text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ml-2">Ending Soon</span>;
  } else if (status === 'critical') {
    colorClasses = 'bg-badge-rejected-bg text-badge-rejected-text border border-badge-rejected-text/30 animate-pulse-slow';
    icon = <AlertCircle size={compact ? 14 : 18} className="animate-bounce" />;
    tag = <span className="bg-badge-rejected-text text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ml-2">Critical</span>;
  } else if (status === 'expired') {
    colorClasses = 'bg-badge-rejected-bg text-badge-rejected-text border border-badge-rejected-text/50';
    icon = <AlertCircle size={compact ? 14 : 18} />;
  }

  if (sprint.status === 'completed') {
    colorClasses = 'bg-badge-completed-bg text-badge-completed-text border border-badge-completed-text/30';
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
        <div className="p-2 bg-bg-card bg-opacity-50 rounded-full">
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
