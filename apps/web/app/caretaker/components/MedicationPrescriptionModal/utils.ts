// utils.ts

/* ================================
   TYPES
================================ */

export type ColorClasses = {
  bg: string;
  border: string;
  icon: string;
  lightBg: string;
};

/* ================================
   DATE UTILITIES
================================ */

export const calculateEndDateFromDuration = (
  startDate?: string,
  duration?: string
): string => {
  if (!startDate || !duration) return '';

  const start = new Date(startDate);
  if (isNaN(start.getTime())) return '';

  const match = duration
    .toLowerCase()
    .trim()
    .match(/(\d+)\s*(day|days|week|weeks|month|months|year|years)/);

  if (!match) return '';

  const amount = Number(match[1]);
  const unit = match[2];

  if (isNaN(amount) || !unit) return '';

  const endDate = new Date(start);

  switch (unit) {
    case 'day':
    case 'days':
      endDate.setDate(endDate.getDate() + amount);
      break;

    case 'week':
    case 'weeks':
      endDate.setDate(endDate.getDate() + amount * 7);
      break;

    case 'month':
    case 'months':
      endDate.setMonth(endDate.getMonth() + amount);
      break;

    case 'year':
    case 'years':
      endDate.setFullYear(endDate.getFullYear() + amount);
      break;

    default:
      return '';
  }

  return endDate.toISOString().split('T')[0] ?? '';
};

/* ================================
   COLOR UTILITIES
================================ */

const DEFAULT_COLOR: ColorClasses = {
  bg: 'bg-emerald-500',
  border: 'border-emerald-300',
  icon: 'text-emerald-700',
  lightBg: 'bg-emerald-100',
};

const COLOR_MAP: Record<string, ColorClasses> = {
  emerald: DEFAULT_COLOR,

  blue: {
    bg: 'bg-blue-500',
    border: 'border-blue-300',
    icon: 'text-blue-700',
    lightBg: 'bg-blue-100',
  },

  purple: {
    bg: 'bg-purple-500',
    border: 'border-purple-300',
    icon: 'text-purple-700',
    lightBg: 'bg-purple-100',
  },

  orange: {
    bg: 'bg-orange-500',
    border: 'border-orange-300',
    icon: 'text-orange-700',
    lightBg: 'bg-orange-100',
  },

  pink: {
    bg: 'bg-pink-500',
    border: 'border-pink-300',
    icon: 'text-pink-700',
    lightBg: 'bg-pink-100',
  },

  red: {
    bg: 'bg-red-500',
    border: 'border-red-300',
    icon: 'text-red-700',
    lightBg: 'bg-red-100',
  },

  yellow: {
    bg: 'bg-yellow-500',
    border: 'border-yellow-300',
    icon: 'text-yellow-700',
    lightBg: 'bg-yellow-100',
  },

  green: {
    bg: 'bg-green-500',
    border: 'border-green-300',
    icon: 'text-green-700',
    lightBg: 'bg-green-100',
  },

  indigo: {
    bg: 'bg-indigo-500',
    border: 'border-indigo-300',
    icon: 'text-indigo-700',
    lightBg: 'bg-indigo-100',
  },

  cyan: {
    bg: 'bg-cyan-500',
    border: 'border-cyan-300',
    icon: 'text-cyan-700',
    lightBg: 'bg-cyan-100',
  },
};

export const getMedicationColorClasses = (
  colorValue?: string
): ColorClasses => {
  if (!colorValue) return DEFAULT_COLOR;

  return COLOR_MAP[colorValue] ?? DEFAULT_COLOR;
};

/* ================================
   FORMATTERS
================================ */

export const formatDate = (dateString?: string): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};