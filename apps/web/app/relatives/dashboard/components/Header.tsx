// relative/dashboard/components/Header.tsx
import { RefreshCw, LogOut } from 'lucide-react';
import { User } from '../types';

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
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-800">
              👨‍👩‍👧‍👦 Family Health Dashboard
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <p className="text-gray-600">Welcome, {user?.name}</p>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 font-medium rounded-lg border border-blue-200 shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={onLogout}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-700 font-medium rounded-lg border border-red-200 shadow-sm transition-all duration-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}