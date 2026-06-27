import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function AttendanceLog() {
  const { token, user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/attendance/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setAttendance(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="p-8 text-text-secondary">Loading attendance log...</div>;

  const totalPresent = attendance.filter(a => a.status === 'Present').length;
  const totalAbsent = attendance.filter(a => a.status === 'Absent').length;
  const totalLeave = attendance.filter(a => a.status === 'On Leave' || a.status === 'Half-Day').length;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">My Attendance</h1>
        <p className="text-sm text-text-secondary mt-1">View your personal attendance history and metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-bg-card p-5 rounded-xl border border-line-light shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-accent-blue flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-text-secondary">Total Logs</div>
            <div className="text-2xl font-bold text-text-primary">{attendance.length}</div>
          </div>
        </div>
        
        <div className="bg-bg-card p-5 rounded-xl border border-line-light shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-text-secondary">Present</div>
            <div className="text-2xl font-bold text-text-primary">{totalPresent}</div>
          </div>
        </div>

        <div className="bg-bg-card p-5 rounded-xl border border-line-light shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
            <XCircle size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-text-secondary">Absent</div>
            <div className="text-2xl font-bold text-text-primary">{totalAbsent}</div>
          </div>
        </div>

        <div className="bg-bg-card p-5 rounded-xl border border-line-light shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-text-secondary">On Leave / Half</div>
            <div className="text-2xl font-bold text-text-primary">{totalLeave}</div>
          </div>
        </div>
      </div>

      <div className="bg-bg-card rounded-xl shadow-sm border border-line-light overflow-hidden">
        <div className="px-6 py-4 border-b border-line-light bg-gray-50/50">
          <h2 className="font-semibold text-text-primary">Attendance History</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-secondary text-text-secondary text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Check-In</th>
                <th className="px-6 py-3 font-medium">Check-Out</th>
                <th className="px-6 py-3 font-medium">Total Hours</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendance.map(record => (
                <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-text-primary">{record.date}</td>
                  <td className="px-6 py-4 text-text-secondary">{record.check_in || '-'}</td>
                  <td className="px-6 py-4 text-text-secondary">{record.check_out || '-'}</td>
                  <td className="px-6 py-4">
                    {record.total_hours > 0 ? (
                      <span className="font-medium text-text-secondary">{record.total_hours}h</span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      record.status === 'Present' ? 'bg-green-100 text-green-800' :
                      record.status === 'Absent' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
              
              {attendance.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-text-secondary">
                    No attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
