import type { Department } from '../content/types';

export const DEPARTMENTS: { value: Department; label: string }[] = [
  { value: 'Front Office', label: 'Front Office' },
  { value: 'Food & Beverage', label: 'Food & Beverage' },
  { value: 'Housekeeping', label: 'Housekeeping' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Kitchen', label: 'Kitchen' },
  { value: 'Technical / Maintenance', label: 'Technical / Maintenance' },
  { value: 'Manager', label: 'Manager' },
  { value: 'General Manager', label: 'General Manager' },
  { value: 'Other', label: 'Other' },
];
