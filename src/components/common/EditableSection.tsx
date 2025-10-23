import React, { useState, useEffect, useRef } from 'react';

interface EditableSectionProps {
  content: string;
  onSave: (content: string) => void;
  placeholder?: string;
  title?: string;
  isEditable?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
  multiline?: boolean;
  maxLength?: number;
  className?: string;
  contentClassName?: string;
  editClassName?: string;
}

export const EditableSection: React.FC<EditableSectionProps> = ({
  content,
  onSave,
  placeholder = 'Click to add content...',
  title,
  isEditable = true,
  autoSave = false,
  autoSaveDelay = 2000,
  multiline = true,
  maxLength,
  className = '',
  contentClassName = '',
  editClassName = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Update edit content when prop content changes
  useEffect(() => {
    if (!isEditing) {
      setEditContent(content);
      setHasChanges(false);
    }
  }, [content, isEditing]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && hasChanges && editContent !== content) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleSave(false);
      }, autoSaveDelay);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [editContent, hasChanges, autoSave, autoSaveDelay, content]);

  // Focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing) {
      const element = multiline ? textareaRef.current : inputRef.current;
      if (element) {
        element.focus();
        element.select();
      }
    }
  }, [isEditing, multiline]);

  const handleEdit = () => {
    if (!isEditable) return;
    setIsEditing(true);
    setEditContent(content);
    setHasChanges(false);
  };

  const handleSave = async (exitEdit = true) => {
    if (editContent === content) {
      if (exitEdit) setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editContent);
      setHasChanges(false);
      if (exitEdit) setIsEditing(false);
    } catch (error) {
      console.error('Failed to save content:', error);
      // Could show error toast here
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditContent(content);
    setHasChanges(false);
    setIsEditing(false);
  };

  const handleContentChange = (value: string) => {
    if (maxLength && value.length > maxLength) {
      return;
    }
    setEditContent(value);
    setHasChanges(value !== content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Enter' && e.ctrlKey && multiline) {
      e.preventDefault();
      handleSave();
    }
  };

  const renderContent = () => {
    if (!content && !isEditing) {
      return (
        <div 
          className={`text-gray-400 italic cursor-pointer hover:text-gray-600 transition-colors ${contentClassName}`}
          onClick={handleEdit}
        >
          {placeholder}
        </div>
      );
    }

    if (isEditing) {
      return (
        <div className={`space-y-3 ${editClassName}`}>
          {multiline ? (
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-vertical min-h-[100px]"
              placeholder={placeholder}
              disabled={isSaving}
            />
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={editContent}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={placeholder}
              disabled={isSaving}
            />
          )}
          
          {/* Character count */}
          {maxLength && (
            <div className="text-xs text-gray-500 text-right">
              {editContent.length}/{maxLength}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleSave()}
                disabled={isSaving || !hasChanges}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>

            {/* Auto-save indicator */}
            {autoSave && (
              <div className="text-xs text-gray-500">
                {hasChanges ? 'Auto-saving...' : 'Auto-save enabled'}
              </div>
            )}
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="text-xs text-gray-400">
            {multiline ? 'Ctrl+Enter to save, Esc to cancel' : 'Enter to save, Esc to cancel'}
          </div>
        </div>
      );
    }

    return (
      <div 
        className={`cursor-pointer hover:bg-gray-50 transition-colors rounded p-2 -m-2 ${contentClassName}`}
        onClick={handleEdit}
      >
        <div className="prose prose-sm max-w-none">
          {multiline ? (
            <div className="whitespace-pre-wrap">{content}</div>
          ) : (
            <div className="truncate">{content}</div>
          )}
        </div>
        {isEditable && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
            <span className="text-xs text-gray-400">Click to edit</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`group ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          {isEditable && !isEditing && (
            <button
              onClick={handleEdit}
              className="text-xs text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Edit
            </button>
          )}
        </div>
      )}
      {renderContent()}
    </div>
  );
};

// Rich text editable section with formatting options
export const RichEditableSection: React.FC<EditableSectionProps & {
  allowFormatting?: boolean;
}> = ({ allowFormatting = true, ...props }) => {
  const [showFormatting, setShowFormatting] = useState(false);

  const formatText = (format: string) => {
    // This would integrate with a rich text editor like Draft.js or similar
    console.log('Format text:', format);
    setShowFormatting(false); // Hide formatting after use
  };

  return (
    <div className="space-y-2">
      <EditableSection {...props} />
      
      {allowFormatting && showFormatting && (
        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded border">
          <button
            onClick={() => formatText('bold')}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
            title="Bold"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
            </svg>
          </button>
          <button
            onClick={() => formatText('italic')}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
            title="Italic"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
            </svg>
          </button>
          <button
            onClick={() => formatText('underline')}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
            title="Underline"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

// Inline editable text for simple use cases
export const InlineEditable: React.FC<{
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onSave, placeholder = 'Click to edit', className = '' }) => {
  return (
    <EditableSection
      content={value}
      onSave={onSave}
      placeholder={placeholder}
      multiline={false}
      autoSave={true}
      autoSaveDelay={1000}
      className={className}
      contentClassName="text-sm"
      editClassName="text-sm"
    />
  );
};
