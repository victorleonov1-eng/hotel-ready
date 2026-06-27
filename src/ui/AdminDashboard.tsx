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

export function AdminDashboard({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [pinExpiryDate, setPinExpiryDate] = useState<string>('');
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'analytics' | 'properties'>('analytics');
  const [newPropertyName, setNewPropertyName] = useState('');
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);

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

        if (props && props.length > 0) {
          const { data: sess } = await supabase
            .from('sessions')
            .select('*')
            .in('staff_id', orgs.map(o => o.id));

          setSessions(sess || []);
        }
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

  const isPinExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const daysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getAnalyticsForOrg = (orgId: string) => {
    const orgProperties = properties.filter(p => p.organization_id === orgId);
    const orgSessions = sessions.filter(s => orgProperties.some(p => p.id === s.staff_id));

    return {
      totalLocations: orgProperties.length,
      totalSessions: orgSessions.length,
      avgScore: orgSessions.length > 0
        ? Math.round(orgSessions.reduce((sum, s) => sum + (s.score || 0), 0) / orgSessions.length)
        : 0,
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

        {/* CENTER SECTION WITH TABS */}
        <div className="flex-1 p-8 overflow-y-auto flex flex-col">
          {selectedOrg ? (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedOrg.name}</h1>

              {/* Tab Buttons */}
              <div className="flex gap-4 mb-8 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 py-2 font-semibold transition ${
                    activeTab === 'analytics'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📊 Analytics
                </button>
                <button
                  onClick={() => setActiveTab('properties')}
                  className={`px-4 py-2 font-semibold transition ${
                    activeTab === 'properties'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📍 Properties
                </button>
              </div>

              {/* ANALYTICS TAB */}
              {activeTab === 'analytics' && selectedAnalytics && (
                <>
                  <p className="text-gray-600 mb-8">Organization Analytics Dashboard</p>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                  <p className="text-gray-600 text-sm">Total Locations</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{selectedAnalytics.totalLocations}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                  <p className="text-gray-600 text-sm">Training Sessions</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{selectedAnalytics.totalSessions}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                  <p className="text-gray-600 text-sm">Average Score</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{selectedAnalytics.avgScore}%</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                  <p className="text-gray-600 text-sm">Completion Rate</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {selectedAnalytics.totalSessions > 0 ? Math.round((selectedAnalytics.totalSessions / (selectedAnalytics.totalLocations * 5 || 1)) * 100) : 0}%
                  </p>
                </div>
              </div>

              {/* Score Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Score Distribution</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">High Scores (85+)</span>
                      <span className="text-sm font-bold text-green-600">{selectedAnalytics.highScores}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${selectedAnalytics.totalSessions > 0 ? (selectedAnalytics.highScores / selectedAnalytics.totalSessions * 100) : 0}%`
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Medium Scores (70-84)</span>
                      <span className="text-sm font-bold text-orange-600">{selectedAnalytics.mediumScores}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full"
                        style={{
                          width: `${selectedAnalytics.totalSessions > 0 ? (selectedAnalytics.mediumScores / selectedAnalytics.totalSessions * 100) : 0}%`
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Low Scores (&lt;70)</span>
                      <span className="text-sm font-bold text-red-600">{selectedAnalytics.lowScores}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{
                          width: `${selectedAnalytics.totalSessions > 0 ? (selectedAnalytics.lowScores / selectedAnalytics.totalSessions * 100) : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
                </>
              )}

              {/* PROPERTIES TAB */}
              {activeTab === 'properties' && (
                <>
                  <p className="text-gray-600 mb-8">Manage locations for this organization</p>

                  {/* Add Property Form */}
                  <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Location</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPropertyName}
                        onChange={(e) => setNewPropertyName(e.target.value)}
                        placeholder="e.g., Main Hotel, Restaurant, Front Desk"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && addProperty()}
                      />
                      <button
                        onClick={addProperty}
                        disabled={!newPropertyName.trim()}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                      >
                        ➕ Add
                      </button>
                    </div>
                  </div>

                  {/* Properties List */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    {properties.filter(p => p.organization_id === selectedOrgId).length > 0 ? (
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Location Name</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {properties.filter(p => p.organization_id === selectedOrgId).map((prop) => (
                            <tr key={prop.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-gray-900">{prop.name}</td>
                              <td className="px-6 py-4 text-gray-600 text-sm">
                                {new Date(prop.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => deleteProperty(prop.id)}
                                  className="text-red-600 hover:text-red-700 font-semibold text-sm"
                                >
                                  🗑️ Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-8 text-center text-gray-600">
                        <p>No properties added yet. Create your first location above!</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
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
