import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Mail, Briefcase, Users as UsersIcon } from 'lucide-react';

export default function Team() {
  const { token } = useAuth();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setTeam(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div>Loading team directory...</div>;

  return (
    <div>
      <div className="page-header mb-6">
        <h1 className="text-xl font-medium mb-1">Team Directory</h1>
        <p className="text-text-secondary text-sm">View all members across teams and departments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {team.map(member => (
          <div key={member.id} className="card flex flex-col items-center text-center hover:shadow-sm transition-shadow">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center text-[20px] font-medium border-[0.5px] border-blue-200 mb-3">
              {member.initials}
            </div>
            
            <h3 className="text-[15px] font-medium text-text-primary mb-1">{member.name}</h3>
            <span className={`badge mb-3 ${member.role === 'manager' ? 'badge-manager' : 'badge-employee'}`}>
              {member.role === 'manager' ? 'Manager' : 'Employee'}
            </span>
            
            <div className="w-full space-y-2 mt-2">
              <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                <Mail size={14} className="text-text-tertiary" />
                <span className="truncate">{member.email}</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                <Briefcase size={14} className="text-text-tertiary" />
                <span>{member.department}</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                <UsersIcon size={14} className="text-text-tertiary" />
                <span>{member.team} ({member.subTeam})</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
