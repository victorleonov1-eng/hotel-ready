import { useState, useRef } from 'react';
import { loginOrCreateProfile } from '../state/profiles';
import type { Department } from '../content/types';

const VALID_DEPARTMENTS: Department[] = ['FO', 'F&B', 'HK', 'FIN', 'KITCHEN', 'TECH', 'MANAGER', 'GM', 'OTHER'];

type ImportStaffDialogProps = {
  onClose: () => void;
  onSuccess: () => void;
};

export function ImportStaffDialog({ onClose, onSuccess }: ImportStaffDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const text = await file.text();
      const lines = text.split('\n').filter((l) => l.trim());

      if (lines.length < 2) {
        throw new Error('CSV must have header row and at least one staff member');
      }

      const headers = lines[0].toLowerCase().split(',').map((h) => h.trim());
      const firstNameIdx = headers.indexOf('firstname');
      const lastNameIdx = headers.indexOf('lastname');
      const pinIdx = headers.indexOf('pin');
      const positionIdx = headers.indexOf('position');
      const deptIdx = headers.indexOf('department');

      if (firstNameIdx === -1 || lastNameIdx === -1 || pinIdx === -1 || positionIdx === -1 || deptIdx === -1) {
        throw new Error('CSV must have columns: firstName, lastName, pin, position, department');
      }

      let imported = 0;
      let skipped = 0;

      for (let i = 1; i < lines.length; i++) {
        const fields = lines[i].split(',').map((f) => f.trim());
        if (fields.length < headers.length) continue;

        const firstName = fields[firstNameIdx];
        const lastName = fields[lastNameIdx];
        const pin = fields[pinIdx];
        const position = fields[positionIdx];
        const dept = fields[deptIdx].toUpperCase() as Department;

        if (!firstName || !lastName || !pin || !position || !VALID_DEPARTMENTS.includes(dept)) {
          skipped++;
          continue;
        }

        const result = loginOrCreateProfile(firstName, lastName, pin, position, dept);
        if (result) imported++;
      }

      setMessage(`✓ Imported ${imported} staff member${imported !== 1 ? 's' : ''}${skipped > 0 ? ` (${skipped} skipped due to invalid data)` : ''}`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to import CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-bold text-crimson-dark mb-4">Import Staff from CSV</h3>

        <div className="mb-4 p-3 bg-gray-50 rounded text-sm text-gray-700">
          <p className="font-semibold mb-2">CSV Format (comma-separated):</p>
          <code className="block font-mono text-xs">firstName,lastName,pin,position,department</code>
          <p className="mt-2 text-xs text-gray-600">
            Example: John,Smith,1234,Receptionist,FO
          </p>
          <p className="mt-2 text-xs text-gray-600">
            Departments: FO, F&B, HK, FIN, KITCHEN, TECH, MANAGER, GM, OTHER
          </p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded text-sm">{message}</div>}

        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-crimson text-white rounded-lg font-medium hover:bg-crimson-dark disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Choose File'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
