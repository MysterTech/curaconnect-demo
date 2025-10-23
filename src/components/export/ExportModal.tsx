import React, { useState } from 'react';
import { Download, FileText, FileJson, FileImage, X, Check } from 'lucide-react';
import { ExportFormat } from '../../models/types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat, options: ExportOptions) => Promise<void>;
  sessionCount?: number;
  sessionTitle?: string;
  isMultiple?: boolean;
}

export interface ExportOptions {
  includeTranscript: boolean;
  includeDocumentation: boolean;
  includeClinicalEntities: boolean;
  includeMetadata: boolean;
  dateFormat: 'iso' | 'local';
  filename?: string;
}

const defaultOptions: ExportOptions = {
  includeTranscript: true,
  includeDocumentation: true,
  includeClinicalEntities: true,
  includeMetadata: true,
  dateFormat: 'local'
};

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  sessionCount = 1,
  sessionTitle,
  isMultiple = false
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [options, setOptions] = useState<ExportOptions>(defaultOptions);
  const [isExporting, setIsExporting] = useState(false);
  const [customFilename, setCustomFilename] = useState('');

  const formats = [
    {
      id: 'json' as ExportFormat,
      name: 'JSON',
      description: 'Structured data format, best for importing into other systems',
      icon: FileJson,
      extension: '.json'
    },
    {
      id: 'text' as ExportFormat,
      name: 'Text',
      description: 'Human-readable format, good for printing or sharing',
      icon: FileText,
      extension: '.txt'
    },
    {
      id: 'pdf' as ExportFormat,
      name: 'PDF',
      description: 'Professional document format, ideal for medical records',
      icon: FileImage,
      extension: '.pdf'
    }
  ];

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const exportOptions: ExportOptions = {
        ...options,
        filename: customFilename.trim() || undefined
      };
      
      await onExport(selectedFormat, exportOptions);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      // Error handling would be done by the parent component
    } finally {
      setIsExporting(false);
    }
  };

  const updateOption = (key: keyof ExportOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Export {isMultiple ? `${sessionCount} Sessions` : 'Session'}
            </h3>
            {sessionTitle && (
              <p className="text-sm text-gray-600 mt-1">{sessionTitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isExporting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Export Format</h4>
            <div className="grid grid-cols-1 gap-3">
              {formats.map((format) => {
                const Icon = format.icon;
                return (
                  <label
                    key={format.id}
                    className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedFormat === format.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={format.id}
                      checked={selectedFormat === format.id}
                      onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                      className="sr-only"
                      disabled={isExporting}
                    />
                    <Icon className={`h-5 w-5 mt-0.5 mr-3 ${
                      selectedFormat === format.id ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${
                          selectedFormat === format.id ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {format.name}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          {format.extension}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${
                        selectedFormat === format.id ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        {format.description}
                      </p>
                    </div>
                    {selectedFormat === format.id && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Export Options */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Include in Export</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeTranscript}
                  onChange={(e) => updateOption('includeTranscript', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isExporting}
                />
                <span className="ml-3 text-sm text-gray-700">Transcript</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeDocumentation}
                  onChange={(e) => updateOption('includeDocumentation', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isExporting}
                />
                <span className="ml-3 text-sm text-gray-700">SOAP Documentation</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeClinicalEntities}
                  onChange={(e) => updateOption('includeClinicalEntities', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isExporting}
                />
                <span className="ml-3 text-sm text-gray-700">Clinical Entities</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeMetadata}
                  onChange={(e) => updateOption('includeMetadata', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isExporting}
                />
                <span className="ml-3 text-sm text-gray-700">Session Metadata</span>
              </label>
            </div>
          </div>

          {/* Date Format */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Date Format</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="dateFormat"
                  value="local"
                  checked={options.dateFormat === 'local'}
                  onChange={(e) => updateOption('dateFormat', e.target.value)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  disabled={isExporting}
                />
                <span className="ml-3 text-sm text-gray-700">
                  Local format ({new Date().toLocaleString()})
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="dateFormat"
                  value="iso"
                  checked={options.dateFormat === 'iso'}
                  onChange={(e) => updateOption('dateFormat', e.target.value)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  disabled={isExporting}
                />
                <span className="ml-3 text-sm text-gray-700">
                  ISO format ({new Date().toISOString()})
                </span>
              </label>
            </div>
          </div>

          {/* Custom Filename */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Custom Filename (optional)
            </label>
            <input
              type="text"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              placeholder={`medical-scribe-${isMultiple ? 'sessions' : 'session'}-${new Date().toISOString().split('T')[0]}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isExporting}
            />
            <p className="text-xs text-gray-500 mt-1">
              File extension will be added automatically
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {isMultiple ? `${sessionCount} sessions selected` : '1 session selected'}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              onClick={handleExport}
              disabled={isExporting || (!options.includeTranscript && !options.includeDocumentation && !options.includeClinicalEntities && !options.includeMetadata)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};