import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Session } from '../models/types';
import { DocumentationPanel } from '../components/documentation/DocumentationPanel';
import { TranscriptPanel } from '../components/transcript/TranscriptPanel';

import { StorageService } from '../services/StorageService';
import { ExportService } from '../services/ExportService';
import { formatDuration, formatDate } from '../utils/transformations';
import { downloadTranscriptAsText, downloadAudio } from '../utils/downloadUtils';

export const SessionReview: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<'soap' | 'transcript' | 'entities'>('soap');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const storageService = new StorageService();
  const exportService = new ExportService();

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId]);

  const loadSession = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const loadedSession = await storageService.getSession(id);
      if (!loadedSession) {
        setError('Session not found');
        return;
      }
      setSession(loadedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentationUpdate = async (updates: Partial<Session['documentation']>) => {
    if (!session) return;
    
    try {
      setSaving(true);
      await storageService.updateSession(session.id, {
        documentation: {
          ...session.documentation,
          ...updates,
          lastUpdated: new Date()
        },
        updatedAt: new Date()
      });
      
      // Update local state
      setSession({
        ...session,
        documentation: {
          ...session.documentation,
          ...updates,
          lastUpdated: new Date()
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update documentation');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadTranscript = () => {
    if (!session) return;
    try {
      downloadTranscriptAsText(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download transcript');
    }
  };

  const handleDownloadAudio = async () => {
    if (!session) return;
    try {
      // Note: Audio storage needs to be implemented in SessionManager
      // For now, show a message
      setError('Audio download will be available once audio storage is implemented');
      console.log('TODO: Implement audio storage in SessionManager.stopSession()');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download audio');
    }
  };

  const handleFinalizeSession = async () => {
    if (!session) return;
    
    try {
      setSaving(true);
      await storageService.updateSession(session.id, {
        documentation: {
          ...session.documentation,
          isFinalized: true,
          lastUpdated: new Date()
        },
        status: 'completed',
        updatedAt: new Date()
      });
      
      setSession({
        ...session,
        documentation: {
          ...session.documentation,
          isFinalized: true
        },
        status: 'completed'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finalize session');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (format: 'json' | 'text' | 'pdf') => {
    if (!session) return;
    
    try {
      const exportResult = await exportService.exportSession(session, format);
      exportService.downloadExport(exportResult);
      setShowExportModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export session');
    }
  };

  const handleDelete = async () => {
    if (!session) return;
    
    if (window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      try {
        await storageService.deleteSession(session.id);
        navigate('/sessions');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete session');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Session Not Found</h2>
        <button onClick={() => navigate('/sessions')} className="btn-primary">
          Back to Sessions
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'soap', label: 'SOAP Note', icon: '📋' },
    { id: 'transcript', label: 'Full Transcript', icon: '💬' },
    { id: 'entities', label: 'Clinical Entities', icon: '🏷️' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <button
                onClick={() => navigate('/sessions')}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Session Review</h1>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Session ID:</span> {session.id}
              </div>
              <div>
                <span className="font-medium">Date:</span> {formatDate(session.createdAt)}
              </div>
              <div>
                <span className="font-medium">Duration:</span> {formatDuration(session.metadata.duration)}
              </div>
              {session.patientContext?.identifier && (
                <div>
                  <span className="font-medium">Patient:</span> {session.patientContext.identifier}
                </div>
              )}
              {session.patientContext?.visitType && (
                <div>
                  <span className="font-medium">Visit Type:</span> {session.patientContext.visitType}
                </div>
              )}
              <div>
                <span className="font-medium">Status:</span>
                <span className={`ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  session.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  session.status === 'active' ? 'bg-green-100 text-green-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {session.status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {session.documentation.isFinalized && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Finalized
              </span>
            )}
            
            <button
              onClick={handleDownloadTranscript}
              className="btn-secondary"
              title="Download transcript as text file"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Download Text
            </button>

            <button
              onClick={handleDownloadAudio}
              className="btn-secondary"
              title="Download audio recording"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Download Audio
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="btn-secondary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>

            {!session.documentation.isFinalized && (
              <button
                onClick={handleFinalizeSession}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Finalizing...' : 'Finalize Note'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'soap' && (
            <DocumentationPanel
              documentation={session.documentation}
              isEditable={!session.documentation.isFinalized}
              onUpdate={handleDocumentationUpdate}
            />
          )}

          {activeTab === 'transcript' && (
            <TranscriptPanel
              segments={session.transcript}
              showTimestamps={true}
              autoScroll={false}
            />
          )}

          {activeTab === 'entities' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Clinical Entities</h3>
              {session.documentation.clinicalEntities.length === 0 ? (
                <p className="text-gray-500 italic">No clinical entities extracted.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {session.documentation.clinicalEntities.map((entity, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          entity.type === 'medication' ? 'bg-blue-100 text-blue-800' :
                          entity.type === 'diagnosis' ? 'bg-red-100 text-red-800' :
                          entity.type === 'symptom' ? 'bg-yellow-100 text-yellow-800' :
                          entity.type === 'procedure' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {entity.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(entity.confidence * 100)}%
                        </span>
                      </div>
                      <p className="font-medium text-gray-900">{entity.value}</p>
                      {entity.context && (
                        <p className="text-sm text-gray-600 mt-1">{entity.context}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Session Actions</h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage this session and its documentation
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/session/${session.id}/edit`)}
              className="btn-secondary"
              disabled={session.documentation.isFinalized}
            >
              Edit Session
            </button>
            
            <button
              onClick={handleDelete}
              className="btn-danger"
            >
              Delete Session
            </button>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Export Session</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleExport('text')}
                  className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div className="font-medium">Text Format</div>
                  <div className="text-sm text-gray-600">Human-readable SOAP note</div>
                </button>
                
                <button
                  onClick={() => handleExport('json')}
                  className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div className="font-medium">JSON Format</div>
                  <div className="text-sm text-gray-600">Structured data with full session info</div>
                </button>
                
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div className="font-medium">PDF Format</div>
                  <div className="text-sm text-gray-600">Professional document format</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};