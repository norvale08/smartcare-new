// FILE: apps/web/app/patient/components/RefreshBar.tsx
import React from 'react';
import { RotateCw, Info } from 'lucide-react';

interface RefreshBarProps {
  refreshing: boolean;
  handleRefresh: () => void;
  lastRefreshed: Date | null;
  isEnglish: () => boolean;
}

const RefreshBar: React.FC<RefreshBarProps> = ({
  refreshing,
  handleRefresh,
  lastRefreshed,
  isEnglish
}) => {
  const formatLastRefreshed = () => {
    if (!lastRefreshed) return '';
    const diff = Math.floor((Date.now() - lastRefreshed.getTime()) / 1000);
    
    if (diff < 60) {
      return isEnglish() ? 'Just now' : 'Hivi sasa';
    } else if (diff < 3600) {
      const mins = Math.floor(diff / 60);
      return isEnglish() ? `${mins} minute${mins !== 1 ? 's' : ''} ago` : `${mins} dakika zilizopita`;
    } else if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return isEnglish() ? `${hours} hour${hours !== 1 ? 's' : ''} ago` : `${hours} saa zilizopita`;
    } else {
      return lastRefreshed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all ${refreshing ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? (isEnglish() ? 'Refreshing...' : 'Inasasishwa...') : (isEnglish() ? 'Refresh Data' : 'Onyesha Upya Data')}</span>
          </button>
          
          {lastRefreshed && (
            <div className="text-sm text-blue-700">
              <span className="font-medium">{isEnglish() ? 'Last updated:' : 'Imesasishwa:'}</span> {formatLastRefreshed()}
            </div>
          )}
        </div>
        
        <div className="text-sm text-blue-600 flex items-center">
          <Info className="w-4 h-4 mr-2" />
          {isEnglish() ? 'Click refresh to update status changes' : 'Bofya onyesha upya kusasisha mabadiliko ya hali'}
        </div>
      </div>
    </div>
  );
};

export default RefreshBar;