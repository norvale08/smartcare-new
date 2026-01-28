// relative/dashboard/components/Header.tsx
import { RefreshCw, LogOut, MapPin } from 'lucide-react';
import { User } from '../types';
import Link from 'next/link';

interface HeaderProps {
  user: User | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}

export function Header({ user, isRefreshing, onRefresh, onLogout }: HeaderProps) {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:h-16 py-3 sm:py-0">
          
          {/* Title */}
          <div className="flex items-center mb-3 sm:mb-0">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
              
            </h1>
          </div>

          {/* User Info & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
            <p className="text-gray-600 text-sm sm:text-base">
              Welcome, {user?.name || 'User'}
            </p>

            <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
              {/* Patient Location Button */}
              <Link href="/patient-location">
                <button className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700 font-medium rounded-lg border border-green-200 shadow-sm transition-all duration-200 text-sm sm:text-base w-full sm:w-auto">
                  <MapPin className="w-4 h-4 mr-2" />
                  Patient Location
                </button>
              </Link>

              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 font-medium rounded-lg border border-blue-200 shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <button
                onClick={onLogout}
                className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-700 font-medium rounded-lg border border-red-200 shadow-sm transition-all duration-200 text-sm sm:text-base"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
}