import { useEffect, useState } from 'react';
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

export function CompanyDashboard({ onLogout }: { onLogout: () => void }) {
  const { user, profile } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'properties' | 'staff'>('analytics');
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffProperty, setNewStaffProperty] = useState('');
  const [newStaffDepartment, setNewStaffDepartment] = useState('Front Office');

  const departments = [
    'Front Office',
    'Housekeeping',
    'Restaurant',
    'Kitchen',
    'Maintenance',
    'MANAGER',
    'GM',
    'Concierge',
    'Security',
  ];

  useEffect(() => {
    if (profile?.organization_id) {
      fetchCompanyData();
    }
  }, [profile]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);

      // Fetch organization
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile?.organization_id)
        .single();

      setOrganization(org || null);

      // Fetch properties
      const { data: props } = await supabase
        .from('properties')
        .select('*')
        .eq('organization_id', profile?.organization_id);

      setProperties(props || []);

      // Fetch staff members
      const { data: staff } = await supabase
        .from('staff_members')
        .select('*')
        .in('property_id', (props || []).map(p => p.id));

      setStaffMembers(staff || []);

      // Fetch sessions
      if (staff && staff.length > 0) {
        const { data: sess } = await supabase
          .from('sessions')
          .select('*')
          .in('staff_id', staff.map(s => s.id));

        setSessions(sess || []);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProperty = async () => {
    if (!newPropertyName.trim() || !organization) return;

    try {
      const { error } = await supabase
        .from('properties')
        .insert({
          organization_id: organization.id,
          name: newPropertyName,
        });

      if (error) throw error;
      setNewPropertyName('');
      fetchCompanyData();
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
      fetchCompanyData();
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property');
    }
  };

  const addStaffMember = async () => {
    if (!newStaffProperty) return;

    try {
      const { error } = await supabase
        .from('staff_members')
        .insert({
          user_id: user?.id,
          property_id: newStaffProperty,
          department: newStaffDepartment,
        });

      if (error) throw error;
      setNewStaffName('');
      setNewStaffProperty('');
      setNewStaffDepartment('Front Office');
      fetchCompanyData();
    } catch (error) {
      console.error('Error adding staff:', error);
      alert('Failed to add staff member');
    }
  };

  const deleteStaffMember = async (staffId: string) => {
    if (!confirm('Delete this staff member? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('staff_members')
        .delete()
        .eq('id', staffId);

      if (error) throw error;
      fetchCompanyData();
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Failed to delete staff member');
    }
  };

  const getAnalytics = () => {
    const totalLocations = properties.length;
    const totalStaff = staffMembers.length;
    const totalSessions = sessions.length;
    const avgScore = sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length)
      : 0;

    return { totalLocations, totalStaff, totalSessions, avgScore };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Organization not found</p>
      </div>
    );
  }

  const analytics = getAnalytics();
  const propertyStaffMap = new Map(
    staffMembers.map(s => [s.property_id, staffMembers.filter(st => st.property_id === s.property_id)])
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-red-700 text-white px-8 py-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold">{organization.name}</h1>
        <button
          onClick={onLogout}
          className="bg-red-800 hover:bg-red-900 px-6 py-2 rounded transition"
        >
          Sign Out
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center Section with Tabs */}
        <div className="flex-1 p-8 overflow-y-auto flex flex-col">
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
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-4 py-2 font-semibold transition ${
                activeTab === 'staff'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👥 Staff
            </button>
          </div>

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Company Dashboard</h2>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                  <p className="text-gray-600 text-sm">Total Locations</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{analytics.totalLocations}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                  <p className="text-gray-600 text-sm">Total Staff</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{analytics.totalStaff}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                  <p className="text-gray-600 text-sm">Training Sessions</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{analytics.totalSessions}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                  <p className="text-gray-600 text-sm">Average Score</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{analytics.avgScore}%</p>
                </div>
              </div>
            </>
          )}

          {/* PROPERTIES TAB */}
          {activeTab === 'properties' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Manage Locations</h2>

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
                {properties.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Location Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Staff Count</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {properties.map((prop) => (
                        <tr key={prop.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-900">{prop.name}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {propertyStaffMap.get(prop.id)?.length || 0} staff
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

          {/* STAFF TAB */}
          {activeTab === 'staff' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Manage Staff</h2>

              {/* Add Staff Form */}
              <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Staff Position</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <select
                    value={newStaffProperty}
                    onChange={(e) => setNewStaffProperty(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select location</option>
                    {properties.map((prop) => (
                      <option key={prop.id} value={prop.id}>
                        {prop.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newStaffDepartment}
                    onChange={(e) => setNewStaffDepartment(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={addStaffMember}
                    disabled={!newStaffProperty}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    ➕ Add
                  </button>
                </div>
              </div>

              {/* Staff List */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {staffMembers.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Location</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Department</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {staffMembers.map((staff) => {
                        const property = properties.find(p => p.id === staff.property_id);
                        return (
                          <tr key={staff.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-gray-900">Staff #{staff.id.slice(0, 8)}</td>
                            <td className="px-6 py-4 text-gray-600">{property?.name || 'Unknown'}</td>
                            <td className="px-6 py-4 text-gray-600">{staff.department}</td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => deleteStaffMember(staff.id)}
                                className="text-red-600 hover:text-red-700 font-semibold text-sm"
                              >
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-gray-600">
                    <p>No staff members added yet. Add your first staff member above!</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
