import { useState } from 'react';
import { loadProfiles } from '../state/profiles';
import { getAllScenarios } from '../content/registry';

const DEFAULT_MANAGER_PIN = '0000';

type ManagerViewProps = {
  onBack: () => void;
};

export function ManagerView({ onBack }: ManagerViewProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [managerPin, setManagerPin] = useState(() => {
    try {
      return localStorage.getItem('hotelready.managerpin') || DEFAULT_MANAGER_PIN;
    } catch {
      return DEFAULT_MANAGER_PIN;
    }
  });

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === managerPin) {
      setAuthenticated(true);
      setPinInput('');
    }
  };

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

  const profiles = loadProfiles();
  const scenarios = getAllScenarios();

  const scenarioStats = scenarios.map((s) => {
    const scores = profiles
      .flatMap((p) => p.attempts.filter((a) => a.scenarioId === s.id).map((a) => a.score));
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const best = scores.length ? Math.max(...scores) : null;
    return { scenario: s, avg, best, attempts: scores.length };
  });

  const totalAttempts = profiles.reduce((sum, p) => sum + p.attempts.length, 0);

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto">
      <button onClick={onBack} className="text-sm text-crimson underline mb-4">
        &larr; Back
      </button>
      <h2 className="text-2xl font-bold text-crimson-dark mb-1">Manager Dashboard</h2>
      <p className="text-sm text-gray-600 mb-6">
        {profiles.length} staff member{profiles.length !== 1 ? 's' : ''} · {totalAttempts} total attempt{totalAttempts !== 1 ? 's' : ''}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-crimson-dark mb-3">Scenario Performance</h3>
          <div className="space-y-2">
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
          <div className="space-y-2">
            {profiles.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">No staff members yet</p>
            ) : (
              profiles.map((p) => (
                <div key={`${p.firstName}-${p.lastName}`} className="bg-white border rounded p-3 text-sm">
                  <div className="font-semibold text-crimson-dark">
                    {p.firstName} {p.lastName}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    <div>{p.position} · {p.department}</div>
                    <div>{p.attempts.length} attempt{p.attempts.length !== 1 ? 's' : ''}</div>
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
