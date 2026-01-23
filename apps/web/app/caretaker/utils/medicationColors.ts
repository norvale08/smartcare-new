export const getMedicationExpiryColor = (daysUntilExpiry: number | null): string => {
  if (daysUntilExpiry === null) {
    return 'bg-white border-gray-300'; // No expiry date (ongoing)
  }

  if (daysUntilExpiry < 0) {
    return 'bg-red-100 border-red-400'; // Expired
  }

  if (daysUntilExpiry === 0) {
    return 'bg-orange-100 border-orange-400'; // Expiring today
  }

  if (daysUntilExpiry <= 3) {
    return 'bg-yellow-100 border-yellow-400'; // Expiring in 3 days
  }

  if (daysUntilExpiry <= 7) {
    return 'bg-blue-50 border-blue-300'; // Expiring in 7 days
  }

  return 'bg-white border-gray-300'; // Normal
};

export const getExpiryStatusText = (daysUntilExpiry: number | null): string => {
  if (daysUntilExpiry === null) {
    return 'Ongoing';
  }

  if (daysUntilExpiry < 0) {
    return `Expired ${Math.abs(daysUntilExpiry)} day(s) ago`;
  }

  if (daysUntilExpiry === 0) {
    return 'Expires today';
  }

  if (daysUntilExpiry === 1) {
    return 'Expires tomorrow';
  }

  return `Expires in ${daysUntilExpiry} days`;
};

export const getExpiryBadgeColor = (daysUntilExpiry: number | null): string => {
  if (daysUntilExpiry === null) {
    return 'bg-gray-100 text-gray-800';
  }

  if (daysUntilExpiry < 0) {
    return 'bg-red-600 text-white';
  }

  if (daysUntilExpiry === 0) {
    return 'bg-orange-600 text-white';
  }

  if (daysUntilExpiry <= 3) {
    return 'bg-yellow-500 text-white';
  }

  if (daysUntilExpiry <= 7) {
    return 'bg-blue-500 text-white';
  }

  return 'bg-green-100 text-green-800';
};
