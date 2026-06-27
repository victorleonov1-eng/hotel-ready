import { useState } from 'react';
import type { Department } from '../content/types';
import { DEPARTMENTS } from '../utils/departments';

type LoginProps = {
  onSubmit: (firstName: string, lastName: string, pin: string, department: Department) => void;
  error?: string;
  onSignOut?: () => void;
};

export function WhoAreYou({ onSubmit, error, onSignOut }: LoginProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [pin, setPin] = useState('');
  const [department, setDepartment] = useState<Department>('Front Office');


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fName = firstName.trim();
    const lName = lastName.trim();

    if (!fName || !lName || pin.length !== 4) {
      return;
    }

    onSubmit(fName, lName, pin, department);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 relative">
      {onSignOut && (
        <button
          onClick={onSignOut}
          className="absolute top-4 left-4 text-sm text-gray-500 hover:text-gray-700 underline"
        >
          ← Back
        </button>
      )}
      <h2 className="text-2xl font-bold text-crimson-dark mb-2">Welcome to HOTEL Ready</h2>
      <p className="text-gray-600 mb-6 text-center max-w-sm">
        Sign in to practise real guest conversations and get instant coaching.
      </p>

      {error && <div className="bg-red-50 text-red-700 px-4 py-2 rounded mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input
            autoFocus
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="e.g. Jane"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-crimson"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="e.g. Smith"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-crimson"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">4-Digit PIN</label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            maxLength={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-crimson font-mono text-center text-lg"
          />
          <p className="text-xs text-gray-500 mt-1">Choose your own password — enter it to sign in again</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value as Department)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-crimson"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept.value} value={dept.value}>
                {dept.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-crimson text-white py-2 rounded-lg font-medium hover:bg-crimson-dark transition"
        >
          Sign In
        </button>
      </form>

    </div>
  );
}
