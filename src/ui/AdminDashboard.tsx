import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Organization {
  id: string;
  name: string;
  admin_id: string;
  created_at: string;
  pin_expires_at?: string;
}

interface Property {
  id: string;
  organization_id: string;
  name: string;
  created_at: string;
}

interface Session {
  id: string;
  staff_id: string;
  scenario_id: string;
  score?: number;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
}

interface StaffMember {
  id: string;
  name: string;
  organization_id: string;
  department?: string;
  created_at: string;
}

interface StaffResult {
  staffId: string;
  staffName: string;
  sessionCount: number;
  avgScore: number;
  highestScore: number;
  lowestScore: number;
}

export function AdminDashboard({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [pinExpiryDate, setPinExpiryDate] = useState<string>('');
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'analytics' | 'properties'>('analytics');
  const [newPropertyName, setNewPropertyName] = useState('');
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [showManagerPinReset, setShowManagerPinReset] = useState(false);
  const [newManagerPin, setNewManagerPin] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  useEffect(() => {
    // Fetch data on component mount (works with or without user login)
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const { data: orgs } = await supabase
        .from('organizations')
        .select('*');

      setOrganizations(orgs || []);

      if (orgs && orgs.length > 0) {
        // Fetch user profiles for all organization admins
        const adminIds = orgs.map(o => o.admin_id);
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, email, full_name')
          .in('id', adminIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        setUserProfiles(profileMap);

        const { data: props } = await supabase
          .from('properties')
          .select('*')
          .in('organization_id', orgs.map(o => o.id));

        setProperties(props || []);

        // Fetch staff members for all organizations
        const { data: staff } = await supabase
          .from('staff_members')
          .select('*')
          .in('organization_id', orgs.map(o => o.id));

        setStaffMembers(staff || []);

        // Fetch all sessions
        const { data: sess } = await supabase
          .from('sessions')
          .select('*');

        setSessions(sess || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePinExpiry = async (newDate: string) => {
    if (!selectedOrgId || !newDate) return;

    try {
      // Convert date string (YYYY-MM-DD) to ISO format with time
      const isoDate = new Date(newDate + 'T00:00:00').toISOString();

      const { error } = await supabase
        .from('organizations')
        .update({ pin_expires_at: isoDate })
        .eq('id', selectedOrgId);

      if (error) throw error;
      setPinExpiryDate('');
      setShowExpiryPicker(false);
      fetchAllData();
    } catch (error) {
      console.error('Error updating PIN expiry:', error);
      alert('Failed to update PIN expiry. Please try again.');
    }
  };

  const deleteOrganization = async (orgId: string) => {
    if (!confirm('Delete this organization? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', orgId);

      if (error) throw error;
      if (selectedOrgId === orgId) {
        setSelectedOrgId(null);
      }
      fetchAllData();
    } catch (error) {
      console.error('Error deleting organization:', error);
    }
  };

  const addProperty = async () => {
    if (!selectedOrgId || !newPropertyName.trim()) return;

    try {
      const { error } = await supabase
        .from('properties')
        .insert({
          organization_id: selectedOrgId,
          name: newPropertyName,
        });

      if (error) throw error;
      setNewPropertyName('');
      fetchAllData();
    } catch (error) {
      console.error('Error adding property:', error);
      alert('Failed to add property');
    }
  };

  const deleteProperty = async (propertyId: string) => {
    if (!confirm('Delete this property? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;
      fetchAllData();
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property');
    }
  };

  const resetManagerPin = async (pinValue?: string) => {
    if (!selectedOrgId) return;

    const pinToSet = pinValue || newManagerPin;

    if (pinToSet.length !== 4) {
      alert('PIN must be 4 digits.');
      return;
    }

    try {
      const { error } = await supabase
        .from('organizations')
        .update({ manager_pin: pinToSet })
        .eq('id', selectedOrgId);

      if (error) throw error;

      setShowManagerPinReset(false);
      setNewManagerPin('');
      fetchAllData();
      alert(`Manager PIN reset to ${pinToSet}`);
    } catch (error) {
      console.error('Error resetting manager PIN:', error);
      alert('Failed to reset manager PIN');
    }
  };

  const isPinExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const daysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getDepartmentsForOrg = (orgId: string): string[] => {
    const orgStaff = staffMembers.filter(s => s.organization_id === orgId);
    const departments = new Set(orgStaff.map(s => s.department || 'Unassigned').filter(Boolean));
    return Array.from(departments).sort();
  };

  const getStaffResultsForOrg = (orgId: string, departmentFilter?: string | null): StaffResult[] => {
    let orgStaff = staffMembers.filter(s => s.organization_id === orgId);

    if (departmentFilter) {
      orgStaff = orgStaff.filter(s => (s.department || 'Unassigned') === departmentFilter);
    }

    return orgStaff.map(staff => {
      const staffSessions = sessions.filter(s => s.staff_id === staff.id);
      const scores = staffSessions.map(s => s.score || 0);

      return {
        staffId: staff.id,
        staffName: staff.name,
        sessionCount: staffSessions.length,
        avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        highestScore: scores.length > 0 ? Math.max(...scores) : 0,
        lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      };
    }).sort((a, b) => b.avgScore - a.avgScore);
  };

  const handlePrintReport = () => {
    if (!selectedOrgId) return;

    const org = organizations.find(o => o.id === selectedOrgId);
    const staffResults = getStaffResultsForOrg(selectedOrgId, selectedDepartment);
    const analytics = getAnalyticsForOrg(selectedOrgId);
    const deptText = selectedDepartment ? ` - ${selectedDepartment}` : '';

    const printContent = `
      <html>
        <head>
          <title>${org?.name} - Staff Performance Report${deptText}</title>
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
            <p class="title">HOTEL Ready - Staff Performance Report</p>
            <p class="subtitle">Organization: ${org?.name}</p>
            ${selectedDepartment ? `<p class="subtitle">Department: ${selectedDepartment}</p>` : ''}
            <p class="timestamp">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>

          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">👥 Staff Trained</div>
              <div class="metric-value">${analytics.totalStaffTrained}</div>
              <div class="metric-desc">Active learners</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">✓ Sessions</div>
              <div class="metric-value">${analytics.totalSessions}</div>
              <div class="metric-desc">Completed</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">⭐ Avg Score</div>
              <div class="metric-value">${analytics.avgScore}%</div>
              <div class="metric-desc">Overall performance</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">📈 Completion</div>
              <div class="metric-value">${analytics.completionRate}%</div>
              <div class="metric-desc">Progress rate</div>
            </div>
          </div>

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
              ${staffResults.length > 0 ? staffResults.map(staff => `
                <tr>
                  <td>${staff.staffName}</td>
                  <td>${staff.sessionCount}</td>
                  <td><strong>${staff.avgScore}%</strong></td>
                  <td>${staff.highestScore}%</td>
                  <td>${staff.lowestScore}%</td>
                  <td>
                    ${staff.avgScore >= 85 ? '<span class="excellent">🟢 Excellent</span>' :
                      staff.avgScore >= 70 ? '<span class="good">🟡 Good</span>' :
                      '<span class="needs-work">🔴 Needs Work</span>'}
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="6" style="text-align: center; color: #999;">No staff data available</td></tr>'}
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

  const getAnalyticsForOrg = (orgId: string) => {
    const orgStaff = staffMembers.filter(s => s.organization_id === orgId);
    const staffIds = orgStaff.map(s => s.id);
    const orgSessions = sessions.filter(s => staffIds.includes(s.staff_id));

    const uniqueStaff = new Set(orgSessions.map(s => s.staff_id)).size;
    const totalScenariosCompleted = orgSessions.length;
    const completionRate = orgStaff.length > 0 ? Math.round((totalScenariosCompleted / (orgStaff.length * 5 || 1)) * 100) : 0;

    return {
      totalLocations: orgStaff.length,
      totalStaffTrained: uniqueStaff,
      totalSessions: orgSessions.length,
      avgScore: orgSessions.length > 0
        ? Math.round(orgSessions.reduce((sum, s) => sum + (s.score || 0), 0) / orgSessions.length)
        : 0,
      completionRate: completionRate,
      highScores: orgSessions.filter(s => (s.score || 0) >= 85).length,
      mediumScores: orgSessions.filter(s => (s.score || 0) >= 70 && (s.score || 0) < 85).length,
      lowScores: orgSessions.filter(s => (s.score || 0) < 70).length,
    };
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOrg = organizations.find(o => o.id === selectedOrgId);
  const selectedAnalytics = selectedOrgId ? getAnalyticsForOrg(selectedOrgId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <button
        onClick={onBack}
        className="text-blue-600 hover:underline p-4 flex items-center gap-1"
      >
        ← Back
      </button>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Organizations</h2>
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded mb-4"
          />

          <div className="space-y-2">
            {filteredOrganizations.length > 0 ? (
              filteredOrganizations.map((org) => {
                const admin = userProfiles.get(org.admin_id);
                return (
                  <button
                    key={org.id}
                    onClick={() => setSelectedOrgId(org.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition ${
                      selectedOrgId === org.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{org.name}</p>
                    {admin && (
                      <>
                        <p className="text-xs text-gray-700 mt-1">{admin.full_name}</p>
                        <p className="text-xs text-gray-500">{admin.email}</p>
                      </>
                    )}
                  </button>
                );
              })
            ) : (
              <p className="text-gray-600 text-sm">No organizations found</p>
            )}
          </div>
        </div>

        {/* CENTER SECTION - PROFESSIONAL ANALYTICS DASHBOARD */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100">
          {selectedOrg ? (
            <div className="p-10">
              {/* Header */}
              <div className="mb-10">
                <h1 className="text-5xl font-bold text-slate-900">{selectedOrg.name}</h1>
                <p className="text-slate-600 text-lg mt-2">Training Analytics & Performance Dashboard</p>
              </div>

              {/* PROFESSIONAL ANALYTICS */}
              {selectedAnalytics && (
                <>
                  {/* KPI Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {/* Staff Trained KPI */}
                    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-8 border-t-4 border-blue-500">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl">👥</span>
                        <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Staff Trained</p>
                      </div>
                      <p className="text-5xl font-bold text-slate-900 mb-2">{selectedAnalytics.totalStaffTrained}</p>
                      <p className="text-slate-500 text-sm">Active learners in training program</p>
                    </div>

                    {/* Sessions Completed KPI */}
                    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-8 border-t-4 border-purple-500">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl">✓</span>
                        <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Sessions</p>
                      </div>
                      <p className="text-5xl font-bold text-slate-900 mb-2">{selectedAnalytics.totalSessions}</p>
                      <p className="text-slate-500 text-sm">Training scenarios completed</p>
                    </div>

                    {/* Average Score KPI */}
                    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-8 border-t-4 border-emerald-500">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl">⭐</span>
                        <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Avg Score</p>
                      </div>
                      <p className="text-5xl font-bold text-slate-900 mb-2">{selectedAnalytics.avgScore}<span className="text-2xl ml-1">%</span></p>
                      <p className="text-slate-500 text-sm">Overall performance quality</p>
                    </div>

                    {/* Completion Rate KPI */}
                    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-8 border-t-4 border-amber-500">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl">📈</span>
                        <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Completion</p>
                      </div>
                      <p className="text-5xl font-bold text-slate-900 mb-2">{selectedAnalytics.completionRate}<span className="text-2xl ml-1">%</span></p>
                      <p className="text-slate-500 text-sm">Program progress & engagement</p>
                    </div>
                  </div>

                  {/* Performance Analysis Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-2">
                    {/* Performance Distribution */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                      <h3 className="text-xl font-bold text-slate-900 mb-8">Performance Distribution</h3>

                      {/* High Performers */}
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
                            <p className="text-3xl font-bold text-emerald-600">{selectedAnalytics.highScores}</p>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                          <div className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${selectedAnalytics.totalSessions > 0 ? (selectedAnalytics.highScores / selectedAnalytics.totalSessions * 100) : 0}%` }} />
                        </div>
                      </div>

                      {/* Medium Performers */}
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
                            <p className="text-3xl font-bold text-amber-600">{selectedAnalytics.mediumScores}</p>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                          <div className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${selectedAnalytics.totalSessions > 0 ? (selectedAnalytics.mediumScores / selectedAnalytics.totalSessions * 100) : 0}%` }} />
                        </div>
                      </div>

                      {/* Needs Improvement */}
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
                            <p className="text-3xl font-bold text-red-600">{selectedAnalytics.lowScores}</p>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                          <div className="bg-red-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${selectedAnalytics.totalSessions > 0 ? (selectedAnalytics.lowScores / selectedAnalytics.totalSessions * 100) : 0}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                      <h3 className="text-xl font-bold text-slate-900 mb-8">Key Insights</h3>

                      <div className="space-y-6">
                        <div className="flex gap-4 pb-6 border-b border-slate-200">
                          <span className="text-4xl">📊</span>
                          <div className="flex-1">
                            <p className="text-sm text-slate-600 uppercase font-semibold tracking-wide">Avg Per Staff</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">
                              {selectedAnalytics.totalStaffTrained > 0 ? (selectedAnalytics.totalSessions / selectedAnalytics.totalStaffTrained).toFixed(1) : 0}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">sessions per person</p>
                          </div>
                        </div>

                        <div className="flex gap-4 pb-6 border-b border-slate-200">
                          <span className="text-4xl">🏆</span>
                          <div className="flex-1">
                            <p className="text-sm text-slate-600 uppercase font-semibold tracking-wide">Excellence Rate</p>
                            <p className="text-3xl font-bold text-emerald-600 mt-2">
                              {selectedAnalytics.totalSessions > 0 ? Math.round((selectedAnalytics.highScores / selectedAnalytics.totalSessions * 100)) : 0}%
                            </p>
                            <p className="text-xs text-slate-500 mt-1">high performers</p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <span className="text-4xl">📍</span>
                          <div className="flex-1">
                            <p className="text-sm text-slate-600 uppercase font-semibold tracking-wide">Locations</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">{selectedAnalytics.totalLocations}</p>
                            <p className="text-xs text-slate-500 mt-1">active sites</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Staff Performance Section */}
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-slate-900">Staff Performance Details</h3>
                      <button
                        onClick={handlePrintReport}
                        className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white font-semibold rounded-lg hover:bg-red-800 transition"
                      >
                        🖨️ Print Report
                      </button>
                    </div>

                    {/* Department Filter */}
                    <div className="mb-6 flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-600">Filter by Department:</span>
                      <button
                        onClick={() => setSelectedDepartment(null)}
                        className={`px-4 py-2 rounded-lg transition font-medium ${
                          selectedDepartment === null
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                        }`}
                      >
                        All Departments
                      </button>
                      {getDepartmentsForOrg(selectedOrgId!).map(dept => (
                        <button
                          key={dept}
                          onClick={() => setSelectedDepartment(dept)}
                          className={`px-4 py-2 rounded-lg transition font-medium ${
                            selectedDepartment === dept
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                          }`}
                        >
                          {dept}
                        </button>
                      ))}
                    </div>

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
                            {getStaffResultsForOrg(selectedOrgId!, selectedDepartment).length > 0 ? (
                              getStaffResultsForOrg(selectedOrgId!, selectedDepartment).map((staff) => (
                                <tr key={staff.staffId} className="hover:bg-slate-50 transition">
                                  <td className="px-6 py-4 font-semibold text-slate-900">{staff.staffName}</td>
                                  <td className="px-6 py-4 text-center text-slate-700">{staff.sessionCount}</td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="font-bold text-lg">
                                      {staff.avgScore}%
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="text-emerald-600 font-semibold">{staff.highestScore}%</span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="text-red-600 font-semibold">{staff.lowestScore}%</span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                      staff.avgScore >= 85 ? 'bg-emerald-100 text-emerald-700' :
                                      staff.avgScore >= 70 ? 'bg-amber-100 text-amber-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {staff.avgScore >= 85 ? '🟢 Excellent' :
                                       staff.avgScore >= 70 ? '🟡 Good' :
                                       '🔴 Needs Work'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-600">
                                  No staff members or training data available for this organization
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-600 text-lg">Select an organization to view details</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        {selectedOrg && (
          <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Organization Settings</h3>

            {/* PIN Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">PIN Expiration</p>
              {selectedOrg.pin_expires_at ? (
                <div>
                  <p className={`text-lg font-bold ${
                    isPinExpired(selectedOrg.pin_expires_at)
                      ? 'text-red-600'
                      : daysUntilExpiry(selectedOrg.pin_expires_at) <= 7
                      ? 'text-orange-600'
                      : 'text-green-600'
                  }`}>
                    {new Date(selectedOrg.pin_expires_at).toLocaleDateString()}
                  </p>
                  {!isPinExpired(selectedOrg.pin_expires_at) && (
                    <p className="text-xs text-gray-600 mt-1">
                      {daysUntilExpiry(selectedOrg.pin_expires_at)} days left
                    </p>
                  )}
                  {isPinExpired(selectedOrg.pin_expires_at) && (
                    <p className="text-xs text-red-600 mt-1">🔒 Awaiting admin approval</p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-lg font-bold text-gray-500">0 days left</p>
                  <p className="text-xs text-gray-500 mt-1">Not set - Set expiration date</p>
                </div>
              )}
            </div>

            {/* Current Manager PIN Display */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-bold text-blue-600 mb-2">Current Manager PIN</p>
              <p className="text-2xl font-mono font-bold text-blue-700">{selectedOrg.manager_pin || 'Not set'}</p>
              <p className="text-xs text-gray-600 mt-1">This PIN is unique to this organization</p>
            </div>

            {/* Manager PIN Section */}
            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-bold text-red-600 mb-3">🚨 Manager PIN - Emergency Reset</p>
              {showManagerPinReset ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newManagerPin}
                    onChange={(e) => setNewManagerPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="4-digit PIN"
                    maxLength={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-center font-mono text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => resetManagerPin()}
                      disabled={newManagerPin.length !== 4}
                      className="flex-1 bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700 disabled:opacity-50"
                    >
                      Save PIN
                    </button>
                    <button
                      onClick={() => {
                        setShowManagerPinReset(false);
                        setNewManagerPin('');
                      }}
                      className="flex-1 bg-gray-400 text-white px-3 py-2 rounded text-sm hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">Reset the manager's dashboard access PIN</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowManagerPinReset(true)}
                      className="flex-1 bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700"
                    >
                      Set Custom
                    </button>
                    <button
                      onClick={() => resetManagerPin('0000')}
                      className="flex-1 bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700"
                    >
                      Reset to 0000
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => {
                  setShowExpiryPicker(!showExpiryPicker);
                  setPinExpiryDate('');
                }}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                📅 Set New PIN Expiry
              </button>

              <button
                onClick={() => deleteOrganization(selectedOrg.id)}
                className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                🗑️ Delete Organization
              </button>
            </div>

            {/* Expiry Date Picker */}
            {showExpiryPicker && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New PIN Expiration Date
                </label>
                <input
                  type="date"
                  value={pinExpiryDate || selectedOrg.pin_expires_at?.split('T')[0] || ''}
                  onChange={(e) => setPinExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => updatePinExpiry(pinExpiryDate)}
                    disabled={!pinExpiryDate}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowExpiryPicker(false);
                      setPinExpiryDate('');
                    }}
                    className="flex-1 bg-gray-400 text-white px-3 py-2 rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
