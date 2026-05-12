// ── General Utility Functions ──

// Standardizes how dates look across the entire application (e.g. "01 Jan 2024")
export const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return d; } // If the date is completely invalid, just return what was passed in
};

// Calculates the human-readable time difference between two dates (e.g. "6 months" or "45 days")
export const calcDuration = (start, end) => {
  if (!start || !end) return '—';
  
  // Calculate raw number of days between two timestamps (86400000 milliseconds = 1 day)
  const days = Math.max(0, Math.round((new Date(end) - new Date(start)) / 86400000));
  if (days === 0) return '—';
  
  const months = Math.floor(days / 30);
  const rem = days % 30; // remaining days
  
  if (months === 0) return `${days} day${days !== 1 ? 's' : ''}`; // Less than a month (e.g. "14 days")
  if (rem === 0) return `${months} month${months !== 1 ? 's' : ''}`; // Exactly full months (e.g. "3 months")
  
  // E.g. "3 mo, 14d"
  return `${months} mo, ${rem}d`;
};

// Takes a full name and grabs the first letter of the first two words for an Avatar (e.g. "John Doe" => "JD")
export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

// Extracts the specific error message text out of the complex object Axios throws when a network request fails
export const extractAxiosError = (error) =>
  error?.response?.data?.message || // Top level custom messages from backend
  error?.response?.data?.errors?.[0]?.msg || // Express-validator error array
  error?.message || // Standard javascript error message
  'An unexpected error occurred'; // Absolute fallback
