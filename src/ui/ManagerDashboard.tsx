import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DEPARTMENTS, getDepartmentLabel } from '../utils/departments';

interface StaffMember {
  id: string;
  name: string;
  department: string;
  position: string;
  pin: string;
  created_at: string;
}

interface Session {
  id: string;
  staff_id: string;
  scenario_id: string;
  score?: number;
  created_at: string;
}

export function ManagerDashboard({
  managerId,
  managerName,
  organizationId,
  organizationName,
  userId,
  onBack
}: {
  managerId: string;
  managerName: string;
  organizationId?: string;
  organizationName?: string;
  userId?: string;
  onBack: () => void;
}) {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [newStaffFirstName, setNewStaffFirstName] = useState('');
  const [newStaffLastName, setNewStaffLastName] = useState('');
  const [newStaffDepartment, setNewStaffDepartment] = useState('FO');
  const [newStaffPosition, setNewStaffPosition] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [resetPinId, setResetPinId] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showManagerPinReset, setShowManagerPinReset] = useState(false);
  const [managerNewPin, setManagerNewPin] = useState('');

  useEffect(() => {
    fetchData();
  }, [organizationId]);

  const fetchData = async () => {
    if (!organizationId) return;

    try {
      setLoading(true);

      // Fetch staff members for this organization
      const { data: staff, error: staffError } = await supabase
        .from('staff_members')
        .select('*')
        .eq('organization_id', organizationId);

      if (staffError) throw staffError;
      setStaffMembers(staff || []);

      // Fetch sessions for all staff
      if (staff && staff.length > 0) {
        const { data: sess, error: sessError } = await supabase
          .from('sessions')
          .select('*')
          .in('staff_id', staff.map(s => s.id));

        if (sessError) throw sessError;
        setSessions(sess || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addStaffMember = async () => {
    if (!newStaffFirstName.trim() || !newStaffLastName.trim() || !newStaffDepartment || !newStaffPosition.trim() || newStaffPin.length !== 4) {
      alert('Please fill all fields. PIN must be 4 digits.');
      return;
    }

    if (!organizationId) {
      alert('Error: Organization ID not found. Please go back and try again.');
      return;
    }

    try {
      const fullName = `${newStaffFirstName.trim()} ${newStaffLastName.trim()}`;

      console.log('Adding staff with:', {
        organization_id: organizationId,
        name: fullName,
        department: newStaffDepartment,
        position: newStaffPosition.trim(),
        pin: newStaffPin,
      });

      const { error } = await supabase
        .from('staff_members')
        .insert({
          user_id: userId,
          organization_id: organizationId,
          name: fullName,
          department: newStaffDepartment,
          position: newStaffPosition.trim(),
          pin: newStaffPin,
        });

      if (error) {
        console.error('Supabase error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw new Error(error.message || error.code || 'Unknown error');
      }

      setNewStaffFirstName('');
      setNewStaffLastName('');
      setNewStaffPosition('');
      setNewStaffPin('');
      setNewStaffDepartment('FO');
      setShowRegistrationForm(false);
      fetchData();
    } catch (error) {
      console.error('Error adding staff:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add staff member';
      alert(`Error: ${errorMessage}`);
    }
  };

  const resetPin = async (staffId: string) => {
    if (newPin.length !== 4) {
      alert('PIN must be 4 digits.');
      return;
    }

    try {
      const { error } = await supabase
        .from('staff_members')
        .update({ pin: newPin })
        .eq('id', staffId);

      if (error) throw error;

      setResetPinId(null);
      setNewPin('');
      fetchData();
      alert('PIN reset successfully');
    } catch (error) {
      console.error('Error resetting PIN:', error);
      alert('Failed to reset PIN');
    }
  };

  const resetManagerPin = async (newPinValue?: string) => {
    const pinValue = newPinValue || managerNewPin;

    console.log('Resetting manager PIN to:', pinValue);
    console.log('Organization ID:', organizationId);

    if (pinValue.length !== 4) {
      alert('PIN must be 4 digits.');
      return;
    }

    try {
      if (!organizationId) {
        alert('Error: Organization ID not found');
        return;
      }

      const { data, error } = await supabase
        .from('organizations')
        .update({ manager_pin: pinValue })
        .eq('id', organizationId)
        .select();

      console.log('Update response:', { data, error });

      if (error) {
        console.error('Supabase error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      if (!data || data.length === 0) {
        alert('Failed to reset manager PIN - no rows updated');
        return;
      }

      setShowManagerPinReset(false);
      setManagerNewPin('');
      alert(`Manager PIN reset to ${pinValue}`);
    } catch (error) {
      console.error('Error resetting manager PIN:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset PIN';
      alert(`Error: ${errorMessage}`);
    }
  };

  const deleteStaffMember = async (staffId: string) => {
    try {
      if (!organizationId) {
        alert('Error: Organization ID not found');
        return;
      }

      const { data, error } = await supabase
        .from('staff_members')
        .delete()
        .eq('id', staffId)
        .select();

      if (error) {
        console.error('Error deleting staff:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        alert('Failed to delete staff member.');
        return;
      }

      setDeleteConfirmId(null);
      fetchData();
      alert('Staff member deleted');
    } catch (error) {
      console.error('Error deleting staff:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete staff member';
      alert(`Error: ${errorMessage}`);
    }
  };

  const getStaffStats = (staffId: string) => {
    const staffSessions = sessions.filter(s => s.staff_id === staffId);
    if (staffSessions.length === 0) return { sessions: 0, avgScore: 0 };

    const avgScore = Math.round(
      staffSessions.reduce((sum, s) => sum + (s.score || 0), 0) / staffSessions.length
    );

    return { sessions: staffSessions.length, avgScore };
  };

  const getOrganizationStats = () => {
    const totalStaff = staffMembers.length;
    const totalSessions = sessions.length;
    const avgScore = sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length)
      : 0;

    return { totalStaff, totalSessions, avgScore };
  };

  const getDepartmentStats = (dept: string) => {
    const deptStaff = staffMembers.filter(s => s.department === dept);
    const deptSessions = sessions.filter(s =>
      deptStaff.some(staff => staff.id === s.staff_id)
    );

    const avgScore = deptSessions.length > 0
      ? Math.round(deptSessions.reduce((sum, s) => sum + (s.score || 0), 0) / deptSessions.length)
      : 0;

    return { staff: deptStaff.length, sessions: deptSessions.length, avgScore };
  };

  const filteredStaff = departmentFilter === 'all'
    ? staffMembers
    : staffMembers.filter(s => s.department === departmentFilter);

  const orgStats = getOrganizationStats();
  const deptStats = departmentFilter === 'all' ? null : getDepartmentStats(departmentFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-700 text-white px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Manager Dashboard</h1>
            <p className="text-blue-100 mt-1">Monitor and manage your team's training progress</p>
          </div>
          <div className="text-right">
            {organizationName && <p className="text-blue-100 text-sm mb-2">{organizationName}</p>}
            <div className="flex gap-2 justify-end">
              {showManagerPinReset ? (
                <>
                  <input
                    type="text"
                    value={managerNewPin}
                    onChange={(e) => setManagerNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="New PIN"
                    maxLength={4}
                    className="w-20 px-2 py-1 rounded text-center font-mono text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => resetManagerPin()}
                    className="bg-green-600 hover:bg-green-700 px-4 py-1 rounded text-sm transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowManagerPinReset(false);
                      setManagerNewPin('');
                    }}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-1 rounded text-sm transition"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowManagerPinReset(true)}
                    className="bg-blue-800 hover:bg-blue-900 px-4 py-2 rounded text-sm transition"
                  >
                    Reset PIN
                  </button>
                  <button
                    onClick={() => resetManagerPin('0000')}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm transition"
                  >
                    Reset to 0000
                  </button>
                  <button
                    onClick={onBack}
                    className="bg-blue-800 hover:bg-blue-900 px-6 py-2 rounded transition"
                  >
                    ← Back
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Organization Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm">Total Staff</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{orgStats.totalStaff}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm">Total Sessions</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{orgStats.totalSessions}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm">Average Score</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{orgStats.avgScore}%</p>
          </div>
        </div>

        {/* Department Filter & Stats */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Filter by Department</h2>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {DEPARTMENTS.map(dept => (
                <option key={dept.value} value={dept.value}>{dept.label}</option>
              ))}
            </select>
          </div>

          {deptStats && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-gray-600 text-sm">Staff in Department</p>
                <p className="text-2xl font-bold text-gray-900">{deptStats.staff}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Department Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{deptStats.sessions}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Department Avg Score</p>
                <p className="text-2xl font-bold text-gray-900">{deptStats.avgScore}%</p>
              </div>
            </div>
          )}
        </div>

        {/* Staff Registration Form */}
        {showRegistrationForm ? (
          <div className="bg-white rounded-lg shadow p-6 mb-8 border border-blue-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Register New Staff Member</h2>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
              <input
                type="text"
                value={newStaffFirstName}
                onChange={(e) => setNewStaffFirstName(e.target.value)}
                placeholder="First Name"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={newStaffLastName}
                onChange={(e) => setNewStaffLastName(e.target.value)}
                placeholder="Last Name"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newStaffDepartment}
                onChange={(e) => setNewStaffDepartment(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {DEPARTMENTS.map(dept => (
                  <option key={dept.value} value={dept.value}>{dept.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={newStaffPosition}
                onChange={(e) => setNewStaffPosition(e.target.value)}
                placeholder="Position"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={newStaffPin}
                onChange={(e) => setNewStaffPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="PIN (4)"
                maxLength={4}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center font-mono"
              />
              <button
                onClick={addStaffMember}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Add
              </button>
            </div>
            <button
              onClick={() => setShowRegistrationForm(false)}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowRegistrationForm(true)}
            className="mb-8 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            ➕ Register New Staff Member
          </button>
        )}

        {/* Staff List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              Staff Members {departmentFilter !== 'all' && `- ${getDepartmentLabel(departmentFilter as any)}`}
            </h2>
          </div>

          {filteredStaff.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Department</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Position</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Sessions</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Avg Score</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStaff.map((member) => {
                  const stats = getStaffStats(member.id);
                  return (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900 font-medium">{member.name}</td>
                      <td className="px-6 py-4 text-gray-600">{getDepartmentLabel(member.department as any)}</td>
                      <td className="px-6 py-4 text-gray-600">{member.position}</td>
                      <td className="px-6 py-4 text-center font-semibold text-gray-900">{stats.sessions}</td>
                      <td className={`px-6 py-4 text-center font-semibold ${
                        stats.avgScore >= 85 ? 'text-green-600' :
                        stats.avgScore >= 70 ? 'text-orange-600' :
                        stats.avgScore > 0 ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {stats.avgScore > 0 ? `${stats.avgScore}%` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        {resetPinId === member.id ? (
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={newPin}
                              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              placeholder="New PIN"
                              maxLength={4}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center font-mono text-sm"
                              autoFocus
                            />
                            <button
                              onClick={() => resetPin(member.id)}
                              className="text-blue-600 hover:text-blue-700 font-semibold text-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setResetPinId(null);
                                setNewPin('');
                              }}
                              className="text-gray-600 hover:text-gray-700 font-semibold text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setResetPinId(member.id)}
                              className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                            >
                              Reset PIN
                            </button>
                            {deleteConfirmId === member.id ? (
                              <div className="inline-block">
                                <span className="text-red-600 text-xs mr-2">Confirm delete?</span>
                                <button
                                  onClick={() => deleteStaffMember(member.id)}
                                  className="text-red-600 hover:text-red-700 font-semibold text-xs"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="text-gray-600 hover:text-gray-700 font-semibold text-xs ml-2"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(member.id)}
                                className="text-red-600 hover:text-red-700 font-semibold text-sm"
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-600">
              <p>No staff members {departmentFilter !== 'all' && `in ${getDepartmentLabel(departmentFilter as any)}`}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
