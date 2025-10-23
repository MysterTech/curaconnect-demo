import React, { useState } from 'react';

interface NoteDisplayProps {
  note: string;
  onNoteChange: (note: string) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export const NoteDisplay: React.FC<NoteDisplayProps> = ({
  note,
  onNoteChange,
  onSave,
  isSaving = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(note);
    // Could add a toast notification here
  };

  const formatNote = (text: string) => {
    // Simple formatting: convert markdown-like syntax to HTML
    return text
      .split('\n')
      .map((line, i) => {
        // Headers
        if (line.startsWith('# ')) {
          return <h2 key={i} className="text-lg font-bold mt-4 mb-2">{line.substring(2)}</h2>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={i} className="text-base font-semibold mt-3 mb-1">{line.substring(3)}</h3>;
        }
        // Bullet points
        if (line.trim().startsWith('- ')) {
          return (
            <li key={i} className="ml-4 mb-1">
              {line.trim().substring(2)}
            </li>
          );
        }
        // Empty lines
        if (line.trim() === '') {
          return <br key={i} />;
        }
        // Regular paragraphs
        return <p key={i} className="mb-2">{line}</p>;
      });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`p-2 rounded hover:bg-gray-100 ${isEditing ? 'bg-gray-100' : ''}`}
            title={isEditing ? 'Preview' : 'Edit'}
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={handleCopy}
            className="p-2 rounded hover:bg-gray-100"
            title="Copy to clipboard"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-1"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Note</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {note ? (
          isEditing ? (
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              className="w-full h-full min-h-[500px] p-4 text-sm font-mono border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Your generated note will appear here..."
            />
          ) : (
            <div className="prose prose-sm max-w-none">
              {formatNote(note)}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No note generated yet</p>
            <p className="text-xs mt-1">Select a template and generate a note to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};
