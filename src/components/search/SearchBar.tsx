import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, FileText } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
  showRecentSearches?: boolean;
  recentSearches?: string[];
  onRecentSearchClick?: (search: string) => void;
  onClearRecentSearches?: () => void;
  isLoading?: boolean;
  resultCount?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search sessions, transcripts, and documentation...',
  className = '',
  debounceMs = 300,
  showRecentSearches = true,
  recentSearches = [],
  onRecentSearchClick,
  onClearRecentSearches,
  isLoading = false,
  resultCount
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, onSearch, debounceMs]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    if (showRecentSearches && recentSearches.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => setShowDropdown(false), 150);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  const handleRecentSearchClick = (searchTerm: string) => {
    setQuery(searchTerm);
    onSearch(searchTerm);
    onRecentSearchClick?.(searchTerm);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const searchSuggestions = [
    'SOAP notes',
    'medications',
    'diagnoses',
    'follow-up',
    'vital signs',
    'physical exam',
    'chief complaint'
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className={`h-5 w-5 ${isFocused ? 'text-blue-500' : 'text-gray-400'}`} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            placeholder-gray-500 text-gray-900
            transition-colors duration-200
            ${isFocused ? 'ring-2 ring-blue-500 border-blue-500' : ''}
          `}
        />

        {/* Loading Spinner or Clear Button */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : query ? (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Search Results Count */}
      {resultCount !== undefined && query && (
        <div className="mt-2 text-sm text-gray-600">
          {resultCount === 0 ? 'No results found' : `${resultCount} result${resultCount !== 1 ? 's' : ''} found`}
        </div>
      )}

      {/* Dropdown with Recent Searches and Suggestions */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {/* Recent Searches */}
          {showRecentSearches && recentSearches.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Recent Searches
                </h4>
                {onClearRecentSearches && (
                  <button
                    onClick={onClearRecentSearches}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {recentSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded flex items-center"
                  >
                    <Search className="h-3 w-3 mr-2 text-gray-400" />
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Suggestions */}
          {!query && (
            <div className="p-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-1" />
                Search Suggestions
              </h4>
              <div className="space-y-1">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(suggestion)}
                    className="w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded flex items-center"
                  >
                    <Search className="h-3 w-3 mr-2 text-gray-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No suggestions message */}
          {query && recentSearches.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              Press Enter to search for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Hook for managing search state
export const useSearch = (initialQuery: string = '') => {
  const [query, setQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('medicalScribe_recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearches = (searches: string[]) => {
    try {
      localStorage.setItem('medicalScribe_recentSearches', JSON.stringify(searches));
    } catch (error) {
      console.error('Failed to save recent searches:', error);
    }
  };

  const addRecentSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    const trimmed = searchTerm.trim();
    const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 10);
    setRecentSearches(updated);
    saveRecentSearches(updated);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('medicalScribe_recentSearches');
  };

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery);
    }
  };

  return {
    query,
    setQuery,
    recentSearches,
    isLoading,
    setIsLoading,
    handleSearch,
    addRecentSearch,
    clearRecentSearches
  };
};