import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'indigo',
  size = 'md',
  onClick,
  className = ''
}) => {
  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      red: 'bg-red-100 text-red-600',
      purple: 'bg-purple-100 text-purple-600',
      indigo: 'bg-indigo-100 text-indigo-600'
    };
    return colors[color as keyof typeof colors] || colors.indigo;
  };

  const getSizeClasses = (size: string) => {
    const sizes = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };
    return sizes[size as keyof typeof sizes] || sizes.md;
  };

  const getValueSize = (size: string) => {
    const sizes = {
      sm: 'text-xl',
      md: 'text-2xl',
      lg: 'text-3xl'
    };
    return sizes[size as keyof typeof sizes] || sizes.md;
  };

  const getIconSize = (size: string) => {
    const sizes = {
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-10 h-10'
    };
    return sizes[size as keyof typeof sizes] || sizes.md;
  };

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md hover:border-indigo-300' : ''}
        ${getSizeClasses(size)}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center">
        {/* Icon */}
        {icon && (
          <div className="flex-shrink-0">
            <div className={`${getIconSize(size)} rounded-md flex items-center justify-center ${getColorClasses(color)}`}>
              {icon}
            </div>
          </div>
        )}

        {/* Content */}
        <div className={`${icon ? 'ml-5' : ''} w-0 flex-1`}>
          <dl>
            {/* Title */}
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>

            {/* Value and trend */}
            <dd className="flex items-baseline">
              <div className={`${getValueSize(size)} font-semibold text-gray-900`}>
                {typeof value === 'number' ? value.toLocaleString() : value}
              </div>
              
              {trend && (
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {/* Trend arrow */}
                  {trend.isPositive ? (
                    <svg className="w-3 h-3 mr-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 mr-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  
                  {/* Trend value */}
                  <span className="sr-only">{trend.isPositive ? 'Increased' : 'Decreased'} by</span>
                  {Math.abs(trend.value)}%
                  
                  {/* Trend label */}
                  {trend.label && (
                    <span className="ml-1 text-gray-500 font-normal">
                      {trend.label}
                    </span>
                  )}
                </div>
              )}
            </dd>

            {/* Subtitle */}
            {subtitle && (
              <dd className="text-sm text-gray-500 mt-1">
                {subtitle}
              </dd>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
};

// Specialized stats cards for common use cases
export const SessionStatsCard: React.FC<{
  totalSessions: number;
  completedSessions: number;
  onClick?: () => void;
}> = ({ totalSessions, completedSessions, onClick }) => {
  const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
  
  return (
    <StatsCard
      title="Total Sessions"
      value={totalSessions}
      subtitle={`${completedSessions} completed (${Math.round(completionRate)}%)`}
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
      color="blue"
      onClick={onClick}
    />
  );
};

export const DurationStatsCard: React.FC<{
  totalDuration: number;
  averageDuration: number;
  onClick?: () => void;
}> = ({ totalDuration, averageDuration, onClick }) => {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <StatsCard
      title="Time Saved"
      value={formatDuration(totalDuration)}
      subtitle={`Avg: ${formatDuration(averageDuration)} per session`}
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      color="green"
      onClick={onClick}
    />
  );
};

export const AccuracyStatsCard: React.FC<{
  accuracy: number;
  trend?: { value: number; isPositive: boolean };
  onClick?: () => void;
}> = ({ accuracy, trend, onClick }) => {
  return (
    <StatsCard
      title="AI Accuracy"
      value={`${Math.round(accuracy)}%`}
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      color="purple"
      trend={trend}
      onClick={onClick}
    />
  );
};

// Grid layout for multiple stats cards
export const StatsGrid: React.FC<{
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}> = ({ children, columns = 4, className = '' }) => {
  const getGridClasses = (columns: number) => {
    const gridClasses: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
    };
    return gridClasses[columns] || gridClasses[4];
  };

  return (
    <div className={`grid ${getGridClasses(columns)} gap-6 ${className}`}>
      {children}
    </div>
  );
};

// Loading skeleton for stats cards
export const StatsCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <StatsGrid columns={count as 1 | 2 | 3 | 4}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      ))}
    </StatsGrid>
  );
};