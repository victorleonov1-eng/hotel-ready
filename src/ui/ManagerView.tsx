import { useState } from 'react';
import { loadProfiles, deleteProfile, loginOrCreateProfile, updatePin } from '../state/profiles';
import { getRecording } from '../state/recordings';
import { getAllScenarios } from '../content/registry';
import { ImportStaffDialog } from './ImportStaffDialog';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { SessionPlayback } from './SessionPlayback';
import type { Recording } from '../content/types';

const DEFAULT_MANAGER_PIN = '0000';

type ManagerViewProps = {
  onBack: () => void;
};

type ViewMode = 'dashboard' | 'staff-detail' | 'analytics' | 'playback';

export function ManagerView({ onBack }: ManagerViewProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const managerPin = (() => {
    try {
      return localStorage.getItem('hotelready.managerpin') || DEFAULT_MANAGER_PIN;
    } catch {
      return DEFAULT_MANAGER_PIN;
    }
  })();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [profiles, setProfiles] = useState(loadProfiles());
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<string | null>(null);
  const [editPin, setEditPin] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [exporting, setExporting] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [resettingPin, setResettingPin] = useState<{ firstName: string; lastName: string } | null>(null);
  const [newPinInput, setNewPinInput] = useState('');

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === managerPin) {
      setAuthenticated(true);
      setPinInput('');
    }
  };

  const handleDeleteProfile = (firstName: string, lastName: string) => {
    if (confirm(`Delete profile for ${firstName} ${lastName}? This cannot be undone.`)) {
      deleteProfile(firstName, lastName);
      setProfiles(loadProfiles());
      setViewMode('dashboard');
    }
  };

  const handleViewStaffDetail = (firstName: string, lastName: string) => {
    setSelectedStaff(`${firstName}|${lastName}`);
    setViewMode('staff-detail');
  };

  const handleViewRecording = (attemptId: string) => {
    const recording = getRecording(attemptId);
    if (recording) {
      setSelectedRecording(recording);
      setViewMode('playback');
    }
  };

  const handleEditPin = (firstName: string, lastName: string) => {
    const staff = profiles.find((p) => p.firstName === firstName && p.lastName === lastName);
    if (staff) {
      setEditingStaff(`${firstName}|${lastName}`);
      setEditPin(staff.pin);
    }
  };

  const handleSavePin = (firstName: string, lastName: string) => {
    if (editPin.length !== 4) return;
    if (updatePin(firstName, lastName, editPin)) {
      setProfiles(loadProfiles());
      setEditingStaff(null);
      alert(`PIN updated to ${editPin}`);
    } else {
      alert('Failed to update PIN');
    }
  };

  const handleResetPin = (firstName: string, lastName: string) => {
    setResettingPin({ firstName, lastName });
    setNewPinInput('');
  };

  const handleConfirmPinReset = () => {
    if (!resettingPin || newPinInput.length !== 4) {
      alert('PIN must be 4 digits');
      return;
    }

    if (updatePin(resettingPin.firstName, resettingPin.lastName, newPinInput)) {
      setProfiles(loadProfiles());
      alert(`PIN updated to ${newPinInput} for ${resettingPin.firstName} ${resettingPin.lastName}`);
      setResettingPin(null);
      setNewPinInput('');
    } else {
      alert('Failed to update PIN');
    }
  };

  const handleEditName = (firstName: string, lastName: string) => {
    setEditingName(true);
    setEditFirstName(firstName);
    setEditLastName(lastName);
  };

  const handleSaveName = (oldFirstName: string, oldLastName: string) => {
    if (!editFirstName.trim() || !editLastName.trim()) {
      alert('Name cannot be empty');
      return;
    }

    const staff = profiles.find((p) => p.firstName === oldFirstName && p.lastName === oldLastName);
    if (staff) {
      // Delete old profile
      deleteProfile(oldFirstName, oldLastName);
      // Create new profile with updated name
      loginOrCreateProfile(editFirstName.trim(), editLastName.trim(), staff.pin, staff.position, staff.department);
      setProfiles(loadProfiles());
      setEditingName(false);
      setEditFirstName('');
      setEditLastName('');
    }
  };

  const handleExportReport = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/export-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profiles, scenarios }),
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `team-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  // PIN Reset Modal
  if (resettingPin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm mx-4">
          <h3 className="text-xl font-bold text-crimson-dark mb-4">
            Reset PIN for {resettingPin.firstName} {resettingPin.lastName}
          </h3>
          <p className="text-sm text-gray-600 mb-4">Enter a new 4-digit PIN:</p>
          <input
            autoFocus
            type="password"
            value={newPinInput}
            onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="0000"
            maxLength={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-crimson font-mono text-center text-lg"
          />
          <div className="flex gap-2">
            <button
              onClick={handleConfirmPinReset}
              disabled={newPinInput.length !== 4}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              Confirm
            </button>
            <button
              onClick={() => {
                setResettingPin(null);
                setNewPinInput('');
              }}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <form onSubmit={handlePinSubmit} className="w-full max-w-xs">
          <h2 className="text-2xl font-bold text-crimson-dark mb-4 text-center">Manager Access</h2>
          <input
            autoFocus
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Enter PIN"
            maxLength={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-crimson font-mono text-center text-lg"
          />
          <button
            type="submit"
            disabled={pinInput.length !== 4}
            className="w-full bg-crimson text-white py-2 rounded-lg font-medium disabled:opacity-50 mb-2"
          >
            Access Dashboard
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full border border-gray-300 py-2 rounded-lg font-medium text-gray-700"
          >
            Back
          </button>
        </form>
      </div>
    );
  }

  const scenarios = getAllScenarios();

  if (viewMode === 'playback' && selectedRecording) {
    const scenario = scenarios.find((s) => s.id === selectedRecording.scenarioId);
    if (!scenario) return null;

    return (
      <SessionPlayback
        recording={selectedRecording}
        scenario={scenario}
        score={selectedRecording.score}
        onBack={() => setViewMode('staff-detail')}
      />
    );
  }

  if (viewMode === 'analytics') {
    return (
      <div className="px-4 py-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setViewMode('dashboard')}
            className="text-sm text-crimson underline"
          >
            &larr; Back to Dashboard
          </button>
          <button
            onClick={() => window.print()}
            className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🖨️ Print
          </button>
        </div>
        <h2 className="text-2xl font-bold text-crimson-dark mb-6">Analytics & Insights</h2>
        <AnalyticsDashboard />
      </div>
    );
  }

  if (viewMode === 'staff-detail' && selectedStaff) {
    const [firstName, lastName] = selectedStaff.split('|');
    const staff = profiles.find((p) => p.firstName === firstName && p.lastName === lastName);
    if (!staff) return null;

    const staffScenarios = scenarios.map((s) => {
      const attempts = staff.attempts.filter((a) => a.scenarioId === s.id);
      const scores = attempts.map((a) => a.score);
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
      const best = scores.length ? Math.max(...scores) : null;
      return { scenario: s, avg, best, attempts: attempts.length, lastAttempt: attempts[attempts.length - 1] };
    });

    return (
      <div className="px-4 py-4 max-w-3xl mx-auto">
        <button
          onClick={() => setViewMode('dashboard')}
          className="text-sm text-crimson underline mb-4"
        >
          &larr; Back to Dashboard
        </button>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-crimson-dark mb-1">
              {staff.firstName} {staff.lastName}
            </h2>
            <div className="text-sm text-gray-600">
              <div>{staff.position} · {staff.department}</div>
              <div>{staff.attempts.length} total attempt{staff.attempts.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <button
            onClick={() => handleEditName(staff.firstName, staff.lastName)}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 whitespace-nowrap"
          >
            ✏️ Edit Name
          </button>
        </div>

        {editingName && (
          <div className="bg-blue-50 p-4 rounded mb-6 border border-blue-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Edit Participant Name</h4>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <input
                type="text"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                placeholder="First Name"
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                placeholder="Last Name"
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSaveName(staff.firstName, staff.lastName)}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
              >
                Save Name
              </button>
              <button
                onClick={() => {
                  setEditingName(false);
                  setEditFirstName('');
                  setEditLastName('');
                }}
                className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-semibold text-crimson-dark">Scenario Performance</h3>
          {staffScenarios.filter((s) => s.attempts > 0).length === 0 ? (
            <p className="text-sm text-gray-500">No attempts yet</p>
          ) : (
            staffScenarios.map(({ scenario, avg, best, attempts, lastAttempt }) => {
              const recordingExists = lastAttempt && lastAttempt.recordingId ? getRecording(lastAttempt.recordingId) : null;
              return (
                <div key={scenario.id} className="bg-white border rounded p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-crimson-dark text-sm">{scenario.title}</h4>
                      {attempts > 0 && (
                        <div className="text-xs text-gray-600 mt-2 grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-gray-500">Attempts</div>
                            <div className="font-semibold text-lg">{attempts}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Best Score</div>
                            <div className="font-semibold text-lg">{best}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Average</div>
                            <div className="font-semibold text-lg">{avg}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    {recordingExists && lastAttempt && lastAttempt.recordingId && (
                      <button
                        onClick={() => handleViewRecording(lastAttempt.recordingId!)}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 ml-2 whitespace-nowrap"
                      >
                        🎬 View Recording
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 pt-6 border-t space-y-2">
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">PIN Management</h4>
            <div className="space-y-2">
              <button
                onClick={() => handleResetPin(staff.firstName, staff.lastName)}
                className="w-full px-3 py-2 bg-orange-600 text-white rounded text-sm font-medium hover:bg-orange-700"
              >
                🔄 Reset PIN to 0000
              </button>
              {editingStaff === `${staff.firstName}|${staff.lastName}` ? (
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={editPin}
                    onChange={(e) => setEditPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    placeholder="New PIN"
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm font-mono text-center"
                  />
                  <button
                    onClick={() => handleSavePin(staff.firstName, staff.lastName)}
                    disabled={editPin.length !== 4}
                    className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingStaff(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleEditPin(staff.firstName, staff.lastName)}
                  className="w-full text-sm text-blue-600 hover:text-blue-700 py-2"
                >
                  Set Custom PIN
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => handleDeleteProfile(staff.firstName, staff.lastName)}
            className="w-full text-sm text-red-600 hover:text-red-700 py-2"
          >
            Delete Profile
          </button>
        </div>
      </div>
    );
  }

  const scenarioStats = scenarios.map((s) => {
    const scores = profiles
      .flatMap((p) => p.attempts.filter((a) => a.scenarioId === s.id).map((a) => a.score));
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const best = scores.length ? Math.max(...scores) : null;
    return { scenario: s, avg, best, attempts: scores.length };
  });

  const totalAttempts = profiles.reduce((sum, p) => sum + p.attempts.length, 0);

  return (
    <div className="px-4 py-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-sm text-crimson underline">
          &larr; Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('analytics')}
            className="text-sm px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            📊 Analytics
          </button>
          <button
            onClick={handleExportReport}
            disabled={exporting || profiles.length === 0}
            className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {exporting ? '⏳ Exporting...' : '📄 Export PDF'}
          </button>
          <button
            onClick={() => setShowImportDialog(true)}
            className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            📥 Import CSV
          </button>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-crimson-dark mb-1">Manager Dashboard</h2>
      <p className="text-sm text-gray-600 mb-6">
        {profiles.length} staff member{profiles.length !== 1 ? 's' : ''} · {totalAttempts} total attempt{totalAttempts !== 1 ? 's' : ''}
      </p>

      {showImportDialog && (
        <ImportStaffDialog
          onClose={() => setShowImportDialog(false)}
          onSuccess={() => setProfiles(loadProfiles())}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="font-semibold text-crimson-dark mb-3">Scenario Performance</h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {scenarioStats.map(({ scenario, avg, best, attempts }) => (
              <div key={scenario.id} className="bg-white border rounded p-3 text-sm">
                <h4 className="font-semibold text-crimson-dark text-xs">{scenario.title}</h4>
                <div className="flex gap-4 mt-1 text-xs text-gray-600">
                  {attempts > 0 && (
                    <>
                      <span>Attempts: {attempts}</span>
                      {avg !== null && <span>Avg: {avg}</span>}
                      {best !== null && <span>Best: {best}</span>}
                    </>
                  )}
                  {attempts === 0 && <span className="text-gray-400">No attempts yet</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-crimson-dark mb-3">Team Members</h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {profiles.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">No staff members yet</p>
            ) : (
              profiles.map((p) => (
                <div
                  key={`${p.firstName}-${p.lastName}`}
                  className="bg-white border rounded p-3 text-sm hover:border-crimson"
                >
                  <div
                    className="font-semibold text-crimson-dark cursor-pointer hover:underline"
                    onClick={() => handleViewStaffDetail(p.firstName, p.lastName)}
                  >
                    {p.firstName} {p.lastName}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    <div>{p.position}</div>
                    <div>{p.attempts.length} attempt{p.attempts.length !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleResetPin(p.firstName, p.lastName)}
                      className="flex-1 text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                    >
                      🔄 Reset PIN
                    </button>
                    <button
                      onClick={() => handleDeleteProfile(p.firstName, p.lastName)}
                      className="flex-1 text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
