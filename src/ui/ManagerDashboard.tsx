import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface StaffMember {
  id: string;
  user_id: string;
  property_id: string;
  department: string;
  created_at: string;
}

interface Session {
  id: string;
  staff_id: string;
  scenario_id: string;
  score?: number;
  created_at: string;
}

interface Property {
  id: string;
  name: string;
}

export function ManagerDashboard({
  managerId,
  managerName,
  organizationId,
  organizationName,
  onBack
}: {
  managerId: string;
  managerName: string;
  organizationId?: string;
  organizationName?: string;
  onBack: () => void;
}) {
  const [teamMembers, setTeamMembers] = useState<StaffMember[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManagerData();
  }, [managerId]);

  const fetchManagerData = async () => {
    try {
      setLoading(true);

      // Fetch team members (staff where manager_id = managerId)
      const { data: team } = await supabase
        .from('staff_members')
        .select('*')
        .eq('manager_id', managerId);

      setTeamMembers(team || []);

      // Fetch all properties for reference
      const { data: props } = await supabase
        .from('properties')
        .select('*');

      setProperties(props || []);

      // Fetch sessions for team members
      if (team && team.length > 0) {
        const { data: sess } = await supabase
          .from('sessions')
          .select('*')
          .in('staff_id', team.map(t => t.id));

        setSessions(sess || []);
      }
    } catch (error) {
      console.error('Error fetching manager data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTeamStats = () => {
    const totalMembers = teamMembers.length;
    const totalSessions = sessions.length;
    const avgScore = sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length)
      : 0;
    const completionRate = totalMembers > 0
      ? Math.round((totalSessions / (totalMembers * 5)) * 100)
      : 0;

    const highScores = sessions.filter(s => (s.score || 0) >= 85).length;
    const mediumScores = sessions.filter(s => (s.score || 0) >= 70 && (s.score || 0) < 85).length;
    const lowScores = sessions.filter(s => (s.score || 0) < 70).length;

    return { totalMembers, totalSessions, avgScore, completionRate, highScores, mediumScores, lowScores };
  };

  const getMemberStats = (memberId: string) => {
    const memberSessions = sessions.filter(s => s.staff_id === memberId);
    if (memberSessions.length === 0) return { sessions: 0, avgScore: 0, lastDate: 'Never' };

    const avgScore = Math.round(memberSessions.reduce((sum, s) => sum + (s.score || 0), 0) / memberSessions.length);
    const lastDate = new Date(Math.max(...memberSessions.map(s => new Date(s.created_at).getTime()))).toLocaleDateString();

    return { sessions: memberSessions.length, avgScore, lastDate };
  };

  const stats = getTeamStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading team data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-700 text-white px-8 py-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">Manager Dashboard</h1>
            <p className="text-blue-100 mt-1">Monitor and manage your team's training progress</p>
          </div>
          <div className="text-right">
            {organizationName && <p className="text-blue-100 text-sm mb-2">{organizationName}</p>}
            <button
              onClick={onBack}
              className="bg-blue-800 hover:bg-blue-900 px-6 py-2 rounded transition"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm">Team Size</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalMembers}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm">Total Sessions</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalSessions}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm">Average Score</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.avgScore}%</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <p className="text-gray-600 text-sm">Completion Rate</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{stats.completionRate}%</p>
          </div>
        </div>

        {/* Score Distribution */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Score Distribution</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">High Scores (85+)</span>
                <span className="text-sm font-bold text-green-600">{stats.highScores}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${stats.totalSessions > 0 ? (stats.highScores / stats.totalSessions * 100) : 0}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Medium Scores (70-84)</span>
                <span className="text-sm font-bold text-orange-600">{stats.mediumScores}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full"
                  style={{
                    width: `${stats.totalSessions > 0 ? (stats.mediumScores / stats.totalSessions * 100) : 0}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Low Scores (&lt;70)</span>
                <span className="text-sm font-bold text-red-600">{stats.lowScores}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{
                    width: `${stats.totalSessions > 0 ? (stats.lowScores / stats.totalSessions * 100) : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Team Member List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Team Members</h2>
          </div>

          {teamMembers.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Staff ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Location</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Department</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Sessions</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Avg Score</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Last Training</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teamMembers.map((member) => {
                  const memberStats = getMemberStats(member.id);
                  const property = properties.find(p => p.id === member.property_id);
                  return (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900 font-mono text-sm">{member.id.slice(0, 8)}</td>
                      <td className="px-6 py-4 text-gray-600">{property?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-gray-600">{member.department}</td>
                      <td className="px-6 py-4 text-center font-semibold text-gray-900">{memberStats.sessions}</td>
                      <td className={`px-6 py-4 text-center font-semibold ${
                        memberStats.avgScore >= 85 ? 'text-green-600' :
                        memberStats.avgScore >= 70 ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        {memberStats.avgScore}%
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{memberStats.lastDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-600">
              <p>No team members assigned yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
