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
  const [newStaffDepartment, setNewStaffDepartment] = useState('Front Office');
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
      setNewStaffDepartment('Front Office');
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
      alert(`Manager PIN reset to ${pinValue}. Sign out and log back in to use the new PIN.`);
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

  const getFilteredDataByDepartment = (dept?: string | null) => {
    let filtered = staffMembers;
    if (dept && dept !== 'all') {
      filtered = staffMembers.filter(s => s.department === dept);
    }
    const filteredSessions = sessions.filter(s =>
      filtered.some(staff => staff.id === s.staff_id)
    );
    return { staff: filtered, sessions: filteredSessions };
  };

  const getOrganizationStats = () => {
    const totalStaff = staffMembers.length;
    const totalSessions = sessions.length;
    const avgScore = sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length)
      : 0;

    return { totalStaff, totalSessions, avgScore };
  };

  const getMetricsForFilter = (dept?: string | null) => {
    const { staff: filtered, sessions: filteredSessions } = getFilteredDataByDepartment(dept);
    const avgScore = filteredSessions.length > 0
      ? Math.round(filteredSessions.reduce((sum, s) => sum + (s.score || 0), 0) / filteredSessions.length)
      : 0;
    return { totalStaff: filtered.length, totalSessions: filteredSessions.length, avgScore };
  };

  const getDepartmentStats = (dept: string) => {
    const { staff: filtered, sessions: filteredSessions } = getFilteredDataByDepartment(dept);
    const avgScore = filteredSessions.length > 0
      ? Math.round(filteredSessions.reduce((sum, s) => sum + (s.score || 0), 0) / filteredSessions.length)
      : 0;
    return { staff: filtered.length, sessions: filteredSessions.length, avgScore };
  };

  const handlePrintReport = () => {
    const { staff: reportStaff, sessions: reportSessions } = getFilteredDataByDepartment(departmentFilter === 'all' ? null : departmentFilter);
    const highScores = reportSessions.filter(s => (s.score || 0) >= 85).length;
    const mediumScores = reportSessions.filter(s => (s.score || 0) >= 70 && (s.score || 0) < 85).length;
    const lowScores = reportSessions.filter(s => (s.score || 0) < 70).length;

    const printContent = `
      <html>
        <head>
          <title>${organizationName || 'Hotel'} - Staff Training Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #b91c1c;
              padding-bottom: 20px;
            }
            .title {
              font-size: 28px;
              font-weight: bold;
              color: #1f2937;
              margin: 0;
            }
            .subtitle {
              font-size: 14px;
              color: #666;
              margin: 5px 0;
            }
            .timestamp {
              font-size: 12px;
              color: #999;
              margin-top: 10px;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .metric-card {
              border: 1px solid #ddd;
              padding: 15px;
              border-radius: 8px;
              background-color: #f9f9f9;
            }
            .metric-label {
              font-size: 11px;
              font-weight: bold;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }
            .metric-value {
              font-size: 32px;
              font-weight: bold;
              color: #1f2937;
            }
            .metric-desc {
              font-size: 12px;
              color: #999;
              margin-top: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #f3f4f6;
              padding: 12px;
              text-align: left;
              font-weight: bold;
              border-bottom: 2px solid #d1d5db;
              font-size: 12px;
              text-transform: uppercase;
              color: #374151;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 13px;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .excellent { color: #059669; font-weight: bold; }
            .good { color: #d97706; font-weight: bold; }
            .needs-work { color: #dc2626; font-weight: bold; }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #1f2937;
              margin-top: 30px;
              margin-bottom: 15px;
              border-left: 4px solid #b91c1c;
              padding-left: 10px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <p class="title">Training Performance Report</p>
            <p class="subtitle">Manager: ${managerName}</p>
            <p class="subtitle">Organization: ${organizationName || 'Hotel'}</p>
            <p class="timestamp">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>

          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">👥 Staff Trained</div>
              <div class="metric-value">${orgStats.totalStaff}</div>
              <div class="metric-desc">Active learners</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">✓ Sessions</div>
              <div class="metric-value">${orgStats.totalSessions}</div>
              <div class="metric-desc">Completed</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">⭐ Avg Score</div>
              <div class="metric-value">${orgStats.avgScore}%</div>
              <div class="metric-desc">Overall performance</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">📈 Completion</div>
              <div class="metric-value">${orgStats.totalStaff > 0 ? Math.round((orgStats.totalSessions / (orgStats.totalStaff * 5)) * 100) : 0}%</div>
              <div class="metric-desc">Progress rate</div>
            </div>
          </div>

          <div class="section-title">Performance Distribution</div>
          <table style="width: 100%; margin-top: 15px; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                <strong>🟢 High Performers (85+)</strong><br/>
                Count: ${highScores}
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; width: 60%;">
                <div style="background-color: #d1fae5; height: 20px; border-radius: 10px; overflow: hidden;">
                  <div style="background-color: #10b981; height: 100%; width: ${orgStats.totalSessions > 0 ? (highScores / orgStats.totalSessions * 100) : 0}%;"></div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                <strong>🟡 Average Performers (70-84)</strong><br/>
                Count: ${mediumScores}
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; width: 60%;">
                <div style="background-color: #fef3c7; height: 20px; border-radius: 10px; overflow: hidden;">
                  <div style="background-color: #f59e0b; height: 100%; width: ${orgStats.totalSessions > 0 ? (mediumScores / orgStats.totalSessions * 100) : 0}%;"></div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px;">
                <strong>🔴 Needs Improvement (<70)</strong><br/>
                Count: ${lowScores}
              </td>
              <td style="padding: 10px; width: 60%;">
                <div style="background-color: #fee2e2; height: 20px; border-radius: 10px; overflow: hidden;">
                  <div style="background-color: #ef4444; height: 100%; width: ${orgStats.totalSessions > 0 ? (lowScores / orgStats.totalSessions * 100) : 0}%;"></div>
                </div>
              </td>
            </tr>
          </table>

          <div class="section-title">Key Insights</div>
          <table style="width: 100%; margin-top: 15px; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;">
                <strong>📊 Avg Per Staff</strong><br/>
                ${orgStats.totalStaff > 0 ? (orgStats.totalSessions / orgStats.totalStaff).toFixed(1) : 0} sessions per person
              </td>
              <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;">
                <strong>🏆 Excellence Rate</strong><br/>
                ${orgStats.totalSessions > 0 ? Math.round((highScores / orgStats.totalSessions * 100)) : 0}% high performers
              </td>
              <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;">
                <strong>👥 Team Size</strong><br/>
                ${orgStats.totalStaff} active staff members
              </td>
            </tr>
          </table>

          <div class="section-title">Staff Performance Details</div>
          <table>
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Sessions</th>
                <th>Avg Score</th>
                <th>Highest</th>
                <th>Lowest</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              ${reportStaff.length > 0 ? reportStaff.map(staff => {
                const staffSessions = sessions.filter(s => s.staff_id === staff.id);
                const scores = staffSessions.map(s => s.score || 0);
                const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
                const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
                const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

                return `
                  <tr>
                    <td>${staff.name}</td>
                    <td>${staffSessions.length}</td>
                    <td><strong>${avgScore}%</strong></td>
                    <td>${highestScore}%</td>
                    <td>${lowestScore}%</td>
                    <td>
                      ${avgScore >= 85 ? '<span class="excellent">🟢 Excellent</span>' :
                        avgScore >= 70 ? '<span class="good">🟡 Good</span>' :
                        avgScore > 0 ? '<span class="needs-work">🔴 Needs Work</span>' :
                        '⚪ No Data'}
                    </td>
                  </tr>
                `;
              }).join('') : '<tr><td colspan="6" style="text-align: center; color: #999;">No staff data available</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  const { staff: filteredStaff } = getFilteredDataByDepartment(departmentFilter === 'all' ? null : departmentFilter);
  const orgStats = getMetricsForFilter(departmentFilter === 'all' ? null : departmentFilter);
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
          <h2 className="text-lg font-bold text-gray-900 mb-4">Filter by Department:</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setDepartmentFilter('all')}
              className={`px-4 py-2 rounded-lg transition font-medium ${
                departmentFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              All Departments
            </button>
            {DEPARTMENTS.map(dept => (
              <button
                key={dept.value}
                onClick={() => setDepartmentFilter(dept.value)}
                className={`px-4 py-2 rounded-lg transition font-medium ${
                  departmentFilter === dept.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                {dept.label}
              </button>
            ))}
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

        {/* Training Analytics & Performance Dashboard */}
        <div className="mt-12 pt-8 border-t border-gray-300">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-slate-900">Training Analytics & Performance Dashboard</h2>
            <button
              onClick={handlePrintReport}
              className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white font-semibold rounded-lg hover:bg-red-800 transition"
            >
              🖨️ Print Report
            </button>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Staff Trained KPI */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-8 border-t-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">👥</span>
                <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Staff Trained</p>
              </div>
              <p className="text-5xl font-bold text-slate-900 mb-2">{orgStats.totalStaff}</p>
              <p className="text-slate-500 text-sm">Active learners in training program</p>
            </div>

            {/* Sessions Completed KPI */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-8 border-t-4 border-purple-500">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">✓</span>
                <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Sessions</p>
              </div>
              <p className="text-5xl font-bold text-slate-900 mb-2">{orgStats.totalSessions}</p>
              <p className="text-slate-500 text-sm">Training scenarios completed</p>
            </div>

            {/* Average Score KPI */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-8 border-t-4 border-emerald-500">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">⭐</span>
                <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Avg Score</p>
              </div>
              <p className="text-5xl font-bold text-slate-900 mb-2">{orgStats.avgScore}<span className="text-2xl ml-1">%</span></p>
              <p className="text-slate-500 text-sm">Overall performance quality</p>
            </div>

            {/* Completion Rate KPI */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-8 border-t-4 border-amber-500">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">📈</span>
                <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Completion</p>
              </div>
              <p className="text-5xl font-bold text-slate-900 mb-2">{orgStats.totalStaff > 0 ? Math.round((orgStats.totalSessions / (orgStats.totalStaff * 5)) * 100) : 0}<span className="text-2xl ml-1">%</span></p>
              <p className="text-slate-500 text-sm">Program progress & engagement</p>
            </div>
          </div>

          {/* Performance Analysis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-2 mb-8">
            {/* Performance Distribution */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-8">Performance Distribution</h3>

              {(() => {
                const { sessions: perfSessions } = getFilteredDataByDepartment(departmentFilter === 'all' ? null : departmentFilter);
                const highScores = perfSessions.filter(s => (s.score || 0) >= 85).length;
                const mediumScores = perfSessions.filter(s => (s.score || 0) >= 70 && (s.score || 0) < 85).length;
                const lowScores = perfSessions.filter(s => (s.score || 0) < 70).length;

                return (
                  <>
                    <div className="mb-8 pb-8 border-b border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">🟢</span>
                          <div>
                            <p className="font-semibold text-slate-900">High Performers</p>
                            <p className="text-sm text-slate-600">Scores 85+</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-emerald-600">{highScores}</p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${orgStats.totalSessions > 0 ? (highScores / orgStats.totalSessions * 100) : 0}%` }} />
                      </div>
                    </div>

                    <div className="mb-8 pb-8 border-b border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">🟡</span>
                          <div>
                            <p className="font-semibold text-slate-900">Average Performers</p>
                            <p className="text-sm text-slate-600">Scores 70-84</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-amber-600">{mediumScores}</p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${orgStats.totalSessions > 0 ? (mediumScores / orgStats.totalSessions * 100) : 0}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">🔴</span>
                          <div>
                            <p className="font-semibold text-slate-900">Needs Improvement</p>
                            <p className="text-sm text-slate-600">Below 70</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-red-600">{lowScores}</p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div className="bg-red-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${orgStats.totalSessions > 0 ? (lowScores / orgStats.totalSessions * 100) : 0}%` }} />
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Key Insights */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-8">Key Insights</h3>

              <div className="space-y-6">
                <div className="flex gap-4 pb-6 border-b border-slate-200">
                  <span className="text-4xl">📊</span>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 uppercase font-semibold tracking-wide">Avg Per Staff</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      {orgStats.totalStaff > 0 ? (orgStats.totalSessions / orgStats.totalStaff).toFixed(1) : 0}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">sessions per person</p>
                  </div>
                </div>

                <div className="flex gap-4 pb-6 border-b border-slate-200">
                  <span className="text-4xl">🏆</span>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 uppercase font-semibold tracking-wide">Excellence Rate</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">
                      {(() => {
                        const highScores = sessions.filter(s => (s.score || 0) >= 85).length;
                        return orgStats.totalSessions > 0 ? Math.round((highScores / orgStats.totalSessions * 100)) : 0;
                      })()}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">high performers</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="text-4xl">👥</span>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 uppercase font-semibold tracking-wide">Team Size</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{orgStats.totalStaff}</p>
                    <p className="text-xs text-slate-500 mt-1">active staff members</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Performance Details */}
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Staff Performance Details</h3>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Staff Name</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-900">Sessions</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-900">Avg Score</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-900">Highest</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-900">Lowest</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-900">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {staffMembers.length > 0 ? (
                      staffMembers.map((staff) => {
                        const staffSessions = sessions.filter(s => s.staff_id === staff.id);
                        const scores = staffSessions.map(s => s.score || 0);
                        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
                        const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
                        const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

                        return (
                          <tr key={staff.id} className="hover:bg-slate-50 transition">
                            <td className="px-6 py-4 font-semibold text-slate-900">{staff.name}</td>
                            <td className="px-6 py-4 text-center text-slate-700">{staffSessions.length}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-bold text-lg">
                                {avgScore}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-emerald-600 font-semibold">{highestScore}%</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-red-600 font-semibold">{lowestScore}%</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                avgScore >= 85 ? 'bg-emerald-100 text-emerald-700' :
                                avgScore >= 70 ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {avgScore >= 85 ? '🟢 Excellent' :
                                 avgScore >= 70 ? '🟡 Good' :
                                 avgScore > 0 ? '🔴 Needs Work' :
                                 '⚪ No Data'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-600">
                          No staff members available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
