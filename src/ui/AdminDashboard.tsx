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

interface StaffMember {
  id: string;
  user_id: string;
  property_id: string;
  department: string;
  created_at: string;
}

interface UserProfileData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization_id: string;
  property_id: string;
}

export function AdminDashboard({ onBack }: { onBack: () => void }) {
  const { user, profile } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [staff, setStaff] = useState<(StaffMember & { user?: UserProfileData })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [newPropertyName, setNewPropertyName] = useState('');
  const [showNewPropertyForm, setShowNewPropertyForm] = useState(false);
  const [propertyError, setPropertyError] = useState('');
  const [pinExpiryDate, setPinExpiryDate] = useState<string>('');
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchOrganizationData();
    }
  }, [user]);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);

      // Fetch organizations where user is admin
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .eq('admin_id', user?.id);

      if (orgsError) {
        console.error('Error fetching organizations:', orgsError);
        setOrganizations([]);
        return;
      }

      setOrganizations(orgs || []);
      const orgId = orgs?.[0]?.id || profile?.organization_id;
      if (orgId) setSelectedOrgId(orgId);

      if (!orgId) {
        setLoading(false);
        return;
      }

      // Fetch properties for the organization
      const { data: props, error: propsError } = await supabase
        .from('properties')
        .select('*')
        .eq('organization_id', orgId);

      if (propsError) {
        console.error('Error fetching properties:', propsError);
        setProperties([]);
      } else {
        setProperties(props || []);
      }

      // Fetch staff members only if we have properties
      if (props && props.length > 0) {
        const { data: staffData, error: staffError } = await supabase
          .from('staff_members')
          .select('id, user_id, property_id, department, created_at')
          .in('property_id', props.map(p => p.id));

        if (staffError) {
          console.error('Error fetching staff:', staffError);
          setStaff([]);
        } else {
          setStaff(staffData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProperty = async () => {
    setPropertyError('');

    if (!newPropertyName.trim()) {
      setPropertyError('Please enter a location name');
      return;
    }

    if (!selectedOrgId) {
      setPropertyError('Please select an organization');
      return;
    }

    try {
      console.log('Adding property:', { organizationId: selectedOrgId, name: newPropertyName });

      const { error } = await supabase
        .from('properties')
        .insert({
          organization_id: selectedOrgId,
          name: newPropertyName,
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Property added successfully');
      setNewPropertyName('');
      setShowNewPropertyForm(false);
      setPropertyError('');
      fetchOrganizationData();
    } catch (error) {
      const message = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('Error adding property:', message);
      setPropertyError(`Error: ${message}`);
    }
  };

  const deleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this location? This will remove all associated staff assignments.')) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;
      fetchOrganizationData();
    } catch (error) {
      console.error('Error deleting property:', error);
    }
  };

  const updatePinExpiry = async (newDate: string) => {
    if (!selectedOrgId) return;

    try {
      const { error } = await supabase
        .from('organizations')
        .update({ pin_expires_at: newDate })
        .eq('id', selectedOrgId);

      if (error) throw error;
      setPinExpiryDate(newDate);
      setShowExpiryPicker(false);
      fetchOrganizationData();
    } catch (error) {
      console.error('Error updating PIN expiry:', error);
    }
  };

  const isPinExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const daysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <button
        onClick={onBack}
        className="text-blue-600 hover:underline mb-6 flex items-center gap-1"
      >
        ← Back
      </button>

      <div className="max-w-7xl mx-auto">
        {/* Organizations Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Organizations & Properties</h2>
          <p className="text-gray-600">Manage your hotel properties and staff</p>
        </div>

        {/* Dashboard PIN Section */}
        {selectedOrgId && organizations.find(o => o.id === selectedOrgId) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">Dashboard PIN</h3>
                <p className="text-2xl font-mono font-bold text-blue-600 mt-2">
                  {user?.user_metadata?.pin || '8739'}
                </p>
                {organizations.find(o => o.id === selectedOrgId)?.pin_expires_at && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">PIN Expires:</p>
                    <p className={`font-semibold mt-1 ${
                      isPinExpired(organizations.find(o => o.id === selectedOrgId)?.pin_expires_at || '')
                        ? 'text-red-600'
                        : daysUntilExpiry(organizations.find(o => o.id === selectedOrgId)?.pin_expires_at || '') <= 7
                        ? 'text-orange-600'
                        : 'text-green-600'
                    }`}>
                      {new Date(organizations.find(o => o.id === selectedOrgId)?.pin_expires_at || '').toLocaleDateString()}
                      {!isPinExpired(organizations.find(o => o.id === selectedOrgId)?.pin_expires_at || '') && (
                        <span className="text-sm ml-2">
                          ({daysUntilExpiry(organizations.find(o => o.id === selectedOrgId)?.pin_expires_at || '')} days)
                        </span>
                      )}
                      {isPinExpired(organizations.find(o => o.id === selectedOrgId)?.pin_expires_at || '') && (
                        <span className="text-sm ml-2">⚠️ EXPIRED</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
              <button className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
                🔄 Reset PIN to 0000
              </button>
              <button className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800">
                ✏️ Set New PIN
              </button>
              <button
                onClick={() => setShowExpiryPicker(!showExpiryPicker)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                📅 Set Expiry Date
              </button>
            </div>

            {showExpiryPicker && (
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIN Expiration Date
                </label>
                <input
                  type="date"
                  value={pinExpiryDate || organizations.find(o => o.id === selectedOrgId)?.pin_expires_at?.split('T')[0] || ''}
                  onChange={(e) => setPinExpiryDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => updatePinExpiry(pinExpiryDate)}
                    disabled={!pinExpiryDate}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowExpiryPicker(false);
                      setPinExpiryDate('');
                    }}
                    className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Organizations Section */}
        {organizations.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Your Organizations
              <span className="ml-2 inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                {organizations.length}
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  onClick={() => setSelectedOrgId(org.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedOrgId === org.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <h4 className="font-bold text-gray-900">{org.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {properties.filter((p) => p.organization_id === org.id).length} locations
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
            <p className="text-gray-600 text-lg mb-4">No organizations found</p>
            <p className="text-gray-500 text-sm">
              Your organization should appear here. If you just created an account, please refresh the page.
            </p>
          </div>
        )}

        {/* Properties Section */}
        {selectedOrgId && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Locations
                <span className="ml-2 inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {properties.filter((p) => p.organization_id === selectedOrgId).length}
                </span>
              </h3>
              <button
                onClick={() => setShowNewPropertyForm(!showNewPropertyForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                + Add Location
              </button>
            </div>

            {showNewPropertyForm && (
              <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-200">
                {propertyError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {propertyError}
                  </div>
                )}
                <input
                  type="text"
                  value={newPropertyName}
                  onChange={(e) => setNewPropertyName(e.target.value)}
                  placeholder="Location name (e.g., Downtown, Airport, Mall)"
                  className="w-full px-4 py-2 border border-gray-300 rounded mb-2"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={addProperty}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowNewPropertyForm(false);
                      setPropertyError('');
                    }}
                    className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {properties
                .filter((p) => p.organization_id === selectedOrgId)
                .map((property) => (
                  <div key={property.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{property.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {staff.filter((s) => s.property_id === property.id).length} staff members
                        </p>
                      </div>
                      <button
                        onClick={() => deleteProperty(property.id)}
                        className="ml-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Team Members Section */}
        {selectedOrgId && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Team Members
              <span className="ml-2 inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                {staff.length}
              </span>
            </h3>

            <div className="space-y-2">
              {staff.length > 0 ? (
                staff.map((member) => (
                  <div key={member.id} className="flex justify-between items-center p-4 bg-gray-50 rounded border border-gray-200">
                    <div>
                      <p className="font-semibold text-gray-900">{member.user?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{member.department}</p>
                      <p className="text-xs text-gray-500">{member.user?.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600">
                        Reset PIN
                      </button>
                      <button className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-center py-8">No staff members yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
