// relative/dashboard/hooks/useDismissedAlerts.ts
import { useState, useEffect } from 'react';

const DISMISSED_ALERTS_KEY = 'dismissed-health-alerts';

export function useDismissedAlerts() {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Load dismissed alerts from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(DISMISSED_ALERTS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDismissedAlerts(new Set(parsed));
      } catch (error) {
        console.error('Error loading dismissed alerts:', error);
      }
    }
  }, []);

  // Save dismissed alerts to localStorage when they change
  useEffect(() => {
    if (dismissedAlerts.size > 0) {
      localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(Array.from(dismissedAlerts)));
    } else {
      localStorage.removeItem(DISMISSED_ALERTS_KEY);
    }
  }, [dismissedAlerts]);

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const dismissAllAlerts = (alertIds: string[]) => {
    setDismissedAlerts(prev => new Set([...prev, ...alertIds]));
  };

  const clearDismissedAlerts = () => {
    setDismissedAlerts(new Set());
    localStorage.removeItem(DISMISSED_ALERTS_KEY);
  };

  const isAlertDismissed = (alertId: string) => dismissedAlerts.has(alertId);

  return {
    dismissedAlerts,
    dismissAlert,
    dismissAllAlerts,
    clearDismissedAlerts,
    isAlertDismissed
  };
}