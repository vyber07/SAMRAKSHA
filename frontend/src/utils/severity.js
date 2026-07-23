/**
 * Utility to normalize severity values across numeric (1..5) and text formats.
 * Maps numeric and string severities to standard keys: 'critical', 'high', 'medium', 'low'.
 */
export function normalizeSeverity(val) {
  if (val === undefined || val === null || val === '') return 'low';

  const num = Number(val);
  if (!isNaN(num) && typeof val !== 'boolean') {
    if (num >= 4.5) return 'critical';
    if (num >= 3.5) return 'high';
    if (num >= 2.5) return 'medium';
    return 'low';
  }

  const str = String(val).toLowerCase().trim();
  if (str.includes('crit') || str === '5') return 'critical';
  if (str.includes('high') || str === '4') return 'high';
  if (str.includes('med') || str === '3') return 'medium';
  if (str.includes('low') || str === '1' || str === '2') return 'low';

  return 'low';
}

export const SEVERITY_COLORS = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#ea580c',
  low: '#64748b',
};

export const SEVERITY_ICONS = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '⚪',
};
