import React, { useState } from 'react';

export function AdminPinEntry({
  onSubmit,
  onBack,
  correctPin = '8739'
}: {
  onSubmit: () => void;
  onBack: () => void;
  correctPin?: string;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (pin === correctPin) {
      setError('');
      onSubmit();
    } else {
      setError('Incorrect PIN. Please try again.');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Access</h1>
          <p className="text-gray-600">Enter your PIN to continue</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Enter PIN"
            className="w-full text-center text-4xl font-bold tracking-widest px-4 py-3 border-2 border-gray-300 rounded mb-4 focus:border-blue-500 focus:outline-none"
            autoFocus
          />

          <button
            onClick={handleSubmit}
            disabled={pin.length !== 4}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition mb-3"
          >
            Access Dashboard
          </button>

          <button
            onClick={onBack}
            className="w-full bg-gray-300 text-gray-900 font-semibold py-3 rounded hover:bg-gray-400 transition"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
