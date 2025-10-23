import React from 'react';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/session/new':
        return 'New Session';
      case '/sessions':
        return 'Session History';
      default:
        if (location.pathname.startsWith('/session/')) {
          return 'Session Details';
        }
        return 'Medical Scribe';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left side */}
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 mr-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Page title */}
          <h1 className="text-2xl font-semibold text-gray-900">{getPageTitle()}</h1>
        </div>

        {/* Right side - Empty for now */}
        <div className="flex items-center space-x-4">
          {/* Removed: Search, Notifications, Settings, Profile */}
        </div>
      </div>
    </header>
  );
};