import React from 'react';

export type TabType = 'transcript' | 'context' | 'note';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'transcript', label: 'Transcript', icon: '📝' },
    { id: 'context', label: 'Context', icon: '📋' },
    { id: 'note', label: 'Note', icon: '📄' },
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex space-x-8 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center space-x-2 py-3 border-b-2 transition-colors
              ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <span>{tab.icon}</span>
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
        <button className="flex items-center space-x-2 py-3 border-b-2 border-transparent text-gray-400 hover:text-gray-600">
          <span className="text-lg">+</span>
        </button>
      </div>
    </div>
  );
};
