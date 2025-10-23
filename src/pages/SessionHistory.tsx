import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '../models/types';
import { SessionCard } from '../components/sessions/SessionCard';
import { StorageService } from '../services/StorageService';
import { ExportService } from '../services/ExportService';

export const SessionHistory: React.FC = () => {
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Session['status'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'status'>('date');
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  const storageService = new StorageService();
  const exportService = new ExportService();

  useEffect(() => {
    loadSessions();
    
    // Listen for session created events
    const handleSessionCreated = () => {
      console.log('📢 Session created event received, refreshing list');
      loadSessions();
    };
    
    window.addEventListener('sessionCreated', handleSessionCreated);
    
    return () => {
      window.removeEventListener('sessionCreated', handleSessionCreated);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sessions, searchQuery, statusFilter, sortBy]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const allSessions = await storageService.getAllSessions();
      setSessions(allSessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...sessions];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(session => 
        session.patientContext?.identifier?.toLowerCase().includes(query) ||
        session.patientContext?.visitType?.toLowerCase().includes(query) ||
        session.documentation.soapNote.subjective.chiefComplaint?.toLowerCase().includes(query) ||
        session.transcript.some(segment => segment.text.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'duration':
          return b.metadata.duration - a.metadata.duration;
        case 'status':
          const statusOrder = { 'active': 0, 'paused': 1, 'completed': 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });

    setFilteredSessions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSessionClick = (session: Session) => {
    if (session.status === 'active' || session.status === 'paused') {
      navigate(`/session/${session.id}`);
    } else {
      navigate(`/session/${session.id}/review`);
    }
  };

  const handleSessionEdit = (session: Session) => {
    navigate(`/session/${session.id}/review`);
  };

  const handleSessionDelete = async (session: Session) => {
    if (window.confirm(`Are you sure you want to delete the session from ${session.createdAt.toLocaleDateString()}?`)) {
      try {
        await storageService.deleteSession(session.id);
        setSessions(sessions.filter(s => s.id !== session.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete session');
      }
    }
  };

  const handleSessionExport = async (session: Session) => {
    try {
      const exportResult = await exportService.exportSession(session, 'text');
      exportService.downloadExport(exportResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export session');
    }
  };

  const handleBulkExport = async () => {
    if (selectedSessions.size === 0) return;
    
    try {
      const sessionsToExport = sessions.filter(s => selectedSessions.has(s.id));
      const exportResult = await exportService.exportMultipleSessions(sessionsToExport, 'text');
      exportService.downloadExport(exportResult);
      setSelectedSessions(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export sessions');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSessions.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedSessions.size} selected sessions?`)) {
      try {
        for (const sessionId of selectedSessions) {
          await storageService.deleteSession(sessionId);
        }
        setSessions(sessions.filter(s => !selectedSessions.has(s.id)));
        setSelectedSessions(new Set());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete sessions');
      }
    }
  };

  const toggleSessionSelection = (sessionId: string) => {
    const newSelection = new Set(selectedSessions);
    if (newSelection.has(sessionId)) {
      newSelection.delete(sessionId);
    } else {
      newSelection.add(sessionId);
    }
    setSelectedSessions(newSelection);
  };

  const selectAllSessions = () => {
    const currentPageSessions = getCurrentPageSessions();
    const allSelected = currentPageSessions.every(s => selectedSessions.has(s.id));
    
    if (allSelected) {
      // Deselect all on current page
      const newSelection = new Set(selectedSessions);
      currentPageSessions.forEach(s => newSelection.delete(s.id));
      setSelectedSessions(newSelection);
    } else {
      // Select all on current page
      const newSelection = new Set(selectedSessions);
      currentPageSessions.forEach(s => newSelection.add(s.id));
      setSelectedSessions(newSelection);
    }
  };

  const getCurrentPageSessions = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSessions.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const currentPageSessions = getCurrentPageSessions();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session History</h1>
          <p className="text-gray-600 mt-1">
            {filteredSessions.length} of {sessions.length} sessions
          </p>
        </div>
        
        <button
          onClick={() => navigate('/session/new')}
          className="btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Session
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-sm text-red-800 underline hover:text-red-900"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Sessions
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by patient, visit type, or content..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Sort by */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="date">Date (Newest First)</option>
              <option value="duration">Duration</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedSessions.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium text-indigo-900">
                {selectedSessions.size} session{selectedSessions.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBulkExport}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Export Selected
              </button>
              <button
                onClick={handleBulkDelete}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedSessions(new Set())}
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions grid */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || statusFilter !== 'all' ? 'No matching sessions' : 'No sessions yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first patient encounter session.'
            }
          </p>
          {(!searchQuery && statusFilter === 'all') && (
            <button
              onClick={() => navigate('/session/new')}
              className="btn-primary"
            >
              Create First Session
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Select all checkbox */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={currentPageSessions.length > 0 && currentPageSessions.every(s => selectedSessions.has(s.id))}
                onChange={selectAllSessions}
                className="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                Select all on this page
              </span>
            </label>
            
            <span className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredSessions.length)} of {filteredSessions.length}
            </span>
          </div>

          {/* Sessions grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {currentPageSessions.map((session) => (
              <div key={session.id} className="relative">
                <div className="absolute top-4 left-4 z-10">
                  <input
                    type="checkbox"
                    checked={selectedSessions.has(session.id)}
                    onChange={() => toggleSessionSelection(session.id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
                <SessionCard
                  session={session}
                  onClick={handleSessionClick}
                  onEdit={handleSessionEdit}
                  onDelete={handleSessionDelete}
                  onExport={handleSessionExport}
                  className="ml-8"
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === pageNum
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};