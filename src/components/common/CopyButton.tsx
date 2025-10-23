import React, { useState } from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  showText?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  className = '',
  size = 'md',
  variant = 'secondary',
  showText = true,
  successMessage = 'Copied!',
  errorMessage = 'Failed to copy'
}) => {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500',
    ghost: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:ring-gray-500'
  };

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'success':
        return <Check className={`${iconSize[size]} text-green-600`} />;
      case 'error':
        return <AlertCircle className={`${iconSize[size]} text-red-600`} />;
      default:
        return <Copy className={iconSize[size]} />;
    }
  };

  const getText = () => {
    switch (status) {
      case 'success':
        return successMessage;
      case 'error':
        return errorMessage;
      default:
        return 'Copy';
    }
  };

  const getButtonClasses = () => {
    let classes = `inline-flex items-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${sizeClasses[size]}`;
    
    if (status === 'success') {
      classes += ' bg-green-100 text-green-800 hover:bg-green-200 focus:ring-green-500';
    } else if (status === 'error') {
      classes += ' bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-500';
    } else {
      classes += ` ${variantClasses[variant]}`;
    }
    
    return `${classes} ${className}`;
  };

  return (
    <button
      onClick={handleCopy}
      className={getButtonClasses()}
      title={`Copy to clipboard: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`}
    >
      {getIcon()}
      {showText && (
        <span className="ml-2">
          {getText()}
        </span>
      )}
    </button>
  );
};

// Hook for programmatic clipboard operations
export const useClipboard = () => {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
      return true;
    } catch (error) {
      console.error('Failed to copy text:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return false;
    }
  };

  const copyFormattedText = async (
    text: string,
    format: 'plain' | 'html' | 'json' = 'plain'
  ): Promise<boolean> => {
    try {
      if (format === 'json') {
        const formattedJson = JSON.stringify(JSON.parse(text), null, 2);
        await navigator.clipboard.writeText(formattedJson);
      } else if (format === 'html') {
        // For HTML, we can use the Clipboard API with multiple formats
        const clipboardItem = new ClipboardItem({
          'text/html': new Blob([text], { type: 'text/html' }),
          'text/plain': new Blob([text.replace(/<[^>]*>/g, '')], { type: 'text/plain' })
        });
        await navigator.clipboard.write([clipboardItem]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
      return true;
    } catch (error) {
      console.error('Failed to copy formatted text:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return false;
    }
  };

  const readFromClipboard = async (): Promise<string | null> => {
    try {
      const text = await navigator.clipboard.readText();
      return text;
    } catch (error) {
      console.error('Failed to read from clipboard:', error);
      return null;
    }
  };

  return {
    status,
    copyToClipboard,
    copyFormattedText,
    readFromClipboard
  };
};