import React, { createContext, useContext, useEffect, useState } from 'react';
import { screenReaderUtils, focusUtils, a11yTesting } from '../../utils/accessibility';

interface AccessibilityContextType {
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  isHighContrast: boolean;
  isReducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  toggleHighContrast: () => void;
  focusManagement: {
    trapFocus: (container: HTMLElement) => () => void;
    restoreFocus: () => void;
    setFocusRestore: () => () => void;
  };
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: React.ReactNode;
  enableA11yTesting?: boolean;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
  enableA11yTesting = process.env.NODE_ENV === 'development'
}) => {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [focusRestoreFunction, setFocusRestoreFunction] = useState<(() => void) | null>(null);

  // Check for user preferences on mount
  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    // Load saved preferences
    const savedFontSize = localStorage.getItem('a11y-font-size') as 'small' | 'medium' | 'large';
    if (savedFontSize) {
      setFontSize(savedFontSize);
    }

    const savedHighContrast = localStorage.getItem('a11y-high-contrast') === 'true';
    setIsHighContrast(savedHighContrast);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Apply accessibility preferences to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply font size
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    switch (fontSize) {
      case 'small':
        root.classList.add('text-sm');
        break;
      case 'large':
        root.classList.add('text-lg');
        break;
      default:
        root.classList.add('text-base');
    }

    // Apply high contrast
    if (isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply reduced motion
    if (isReducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [fontSize, isHighContrast, isReducedMotion]);

  // Run accessibility testing in development
  useEffect(() => {
    if (enableA11yTesting) {
      const timer = setTimeout(() => {
        a11yTesting.logIssues();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [enableA11yTesting]);

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    screenReaderUtils.announce(message, priority);
  };

  const handleSetFontSize = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
    localStorage.setItem('a11y-font-size', size);
    announceToScreenReader(`Font size changed to ${size}`);
  };

  const toggleHighContrast = () => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);
    localStorage.setItem('a11y-high-contrast', newValue.toString());
    announceToScreenReader(`High contrast ${newValue ? 'enabled' : 'disabled'}`);
  };

  const setFocusRestore = () => {
    const restoreFunction = focusUtils.createFocusRestore();
    setFocusRestoreFunction(() => restoreFunction);
    return restoreFunction;
  };

  const restoreFocus = () => {
    if (focusRestoreFunction) {
      focusRestoreFunction();
      setFocusRestoreFunction(null);
    }
  };

  const contextValue: AccessibilityContextType = {
    announceToScreenReader,
    isHighContrast,
    isReducedMotion,
    fontSize,
    setFontSize: handleSetFontSize,
    toggleHighContrast,
    focusManagement: {
      trapFocus: focusUtils.trapFocus,
      restoreFocus,
      setFocusRestore
    }
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Skip Links Component
export const SkipLinks: React.FC = () => {
  return (
    <div className="skip-links">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-32 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        Skip to navigation
      </a>
    </div>
  );
};

// Accessibility Settings Panel Component
interface AccessibilitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  isOpen,
  onClose
}) => {
  const { fontSize, setFontSize, isHighContrast, toggleHighContrast } = useAccessibility();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-settings-title"
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 id="a11y-settings-title" className="text-lg font-semibold text-gray-900">
            Accessibility Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close accessibility settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Font Size */}
          <div>
            <fieldset>
              <legend className="text-sm font-medium text-gray-700 mb-3">
                Font Size
              </legend>
              <div className="space-y-2">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <label key={size} className="flex items-center">
                    <input
                      type="radio"
                      name="fontSize"
                      value={size}
                      checked={fontSize === size}
                      onChange={() => setFontSize(size)}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-700 capitalize">
                      {size}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* High Contrast */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isHighContrast}
                onChange={toggleHighContrast}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-sm text-gray-700">
                High Contrast Mode
              </span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Increases contrast for better visibility
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// Live Region Component for announcements
export const LiveRegion: React.FC<{
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
}> = ({ priority = 'polite', atomic = true }) => {
  return (
    <div
      aria-live={priority}
      aria-atomic={atomic}
      className="sr-only"
      id="live-region"
    />
  );
};