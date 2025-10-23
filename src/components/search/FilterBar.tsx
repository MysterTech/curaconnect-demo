import React, { useState } from 'react';
import { Filter, X, Calendar, User, FileText, Clock, ChevronDown } from 'lucide-react';
import { SessionFilter, Session } from '../../models/types';

interface FilterBarProps {
  filters: SessionFilter;
  onFiltersChange: (filters: SessionFilter) => void;
  className?: string;
  showActiveCount?: boolean;
}

interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
  icon?: React.ReactNode;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, value, onRemove, icon }) => (
  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200">
    {icon && <span className="mr-1">{icon}</span>}
    <span className="font-medium">{label}:</span>
    <span className="ml-1">{value}</span>
    <button
      onClick={onRemove}
      className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
    >
      <X className="h-3 w-3" />
    </button>
  </div>
);

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFiltersChange,
  className = '',
  showActiveCount = true
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: filters.dateRange?.start?.toISOString().split('T')[0] || '',
    end: filters.dateRange?.end?.toISOString().split('T')[0] || ''
  });

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'completed', label: 'Completed' },
    { value: 'draft', label: 'Draft' }
  ];

  const visitTypeOptions = [
    { value: 'consultation', label: 'Consultation' },
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'routine', label: 'Routine Check-up' },
    { value: 'procedure', label: 'Procedure' },
    { value: 'other', label: 'Other' }
  ];

  const durationOptions = [
    { value: '0-15', label: 'Under 15 minutes' },
    { value: '15-30', label: '15-30 minutes' },
    { value: '30-60', label: '30-60 minutes' },
    { value: '60+', label: 'Over 1 hour' }
  ];

  // Count active filters
  const activeFilterCount = [
    filters.status,
    filters.visitType,
    filters.patientIdentifier,
    filters.dateRange,
    filters.durationRange
  ].filter(Boolean).length;

  const updateFilters = (updates: Partial<SessionFilter>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
    setDateRange({ start: '', end: '' });
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const newDateRange = { ...dateRange, [field]: value };
    setDateRange(newDateRange);

    if (newDateRange.start && newDateRange.end) {
      updateFilters({
        dateRange: {
          start: new Date(newDateRange.start),
          end: new Date(newDateRange.end)
        }
      });
    } else if (!newDateRange.start && !newDateRange.end) {
      updateFilters({ dateRange: undefined });
    }
  };

  const handleDurationRangeChange = (value: string) => {
    // Check if we're removing the current filter
    const currentRange = filters.durationRange;
    if (currentRange) {
      const [min, max] = value.split('-').map(v => v === '+' ? Infinity : parseInt(v));
      const newMin = min * 60;
      const newMax = max === Infinity ? Infinity : max * 60;

      if (newMin === currentRange.min && newMax === currentRange.max) {
        updateFilters({ durationRange: undefined });
        return;
      }
    }

    {
      const [min, max] = value.split('-').map(v => v === '+' ? Infinity : parseInt(v));
      updateFilters({
        durationRange: {
          min: min * 60, // Convert to seconds
          max: max === Infinity ? Infinity : max * 60
        }
      });
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {showActiveCount && activeFilterCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.status && (
            <FilterChip
              label="Status"
              value={statusOptions.find(opt => opt.value === filters.status)?.label || filters.status}
              onRemove={() => updateFilters({ status: undefined })}
              icon={<FileText className="h-3 w-3" />}
            />
          )}

          {filters.visitType && (
            <FilterChip
              label="Visit Type"
              value={visitTypeOptions.find(opt => opt.value === filters.visitType)?.label || filters.visitType}
              onRemove={() => updateFilters({ visitType: undefined })}
              icon={<User className="h-3 w-3" />}
            />
          )}

          {filters.patientIdentifier && (
            <FilterChip
              label="Patient"
              value={filters.patientIdentifier}
              onRemove={() => updateFilters({ patientIdentifier: undefined })}
              icon={<User className="h-3 w-3" />}
            />
          )}

          {filters.dateRange && (
            <FilterChip
              label="Date Range"
              value={`${filters.dateRange.start.toLocaleDateString()} - ${filters.dateRange.end.toLocaleDateString()}`}
              onRemove={() => {
                updateFilters({ dateRange: undefined });
                setDateRange({ start: '', end: '' });
              }}
              icon={<Calendar className="h-3 w-3" />}
            />
          )}

          {filters.durationRange && (
            <FilterChip
              label="Duration"
              value={
                filters.durationRange.max === Infinity
                  ? `Over ${Math.floor(filters.durationRange.min / 60)} minutes`
                  : `${Math.floor(filters.durationRange.min / 60)}-${Math.floor(filters.durationRange.max / 60)} minutes`
              }
              onRemove={() => updateFilters({ durationRange: undefined })}
              icon={<Clock className="h-3 w-3" />}
            />
          )}
        </div>
      )}

      {/* Filter Dropdown */}
      {showDropdown && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => updateFilters({ status: (e.target.value as Session['status']) || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All statuses</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Visit Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visit Type
              </label>
              <select
                value={filters.visitType || ''}
                onChange={(e) => updateFilters({ visitType: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All visit types</option>
                {visitTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Patient Identifier Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient ID
              </label>
              <input
                type="text"
                value={filters.patientIdentifier || ''}
                onChange={(e) => updateFilters({ patientIdentifier: e.target.value || undefined })}
                placeholder="Enter patient identifier"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Duration Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Duration
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {durationOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleDurationRangeChange(option.value)}
                  className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                    filters.durationRange &&
                    ((option.value === '60+' && filters.durationRange.max === Infinity) ||
                     (option.value !== '60+' && 
                      filters.durationRange.min === parseInt(option.value.split('-')[0]) * 60))
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-between pt-3 border-t border-gray-200">
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear All Filters
            </button>
            <button
              onClick={() => setShowDropdown(false)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};