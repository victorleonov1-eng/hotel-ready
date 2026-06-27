import type { Department } from '../content/types';

export const DEPARTMENTS: { value: Department; label: string }[] = [
  { value: 'FO', label: 'Front Office' },
  { value: 'F&B', label: 'Food & Beverage' },
  { value: 'HK', label: 'Housekeeping' },
  { value: 'FIN', label: 'Finance' },
  { value: 'KITCHEN', label: 'Kitchen' },
  { value: 'TECH', label: 'Technical / Maintenance' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'GM', label: 'General Manager' },
  { value: 'OTHER', label: 'Other' },
];

export function getDepartmentLabel(code: Department): string {
  return DEPARTMENTS.find(d => d.value === code)?.label || code;
}
