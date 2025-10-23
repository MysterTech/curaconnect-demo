/**
 * Accessibility utilities and WCAG compliance helpers
 */

// ARIA roles and properties
export const ariaRoles = {
  // Landmark roles
  banner: 'banner',
  navigation: 'navigation',
  main: 'main',
  complementary: 'complementary',
  contentinfo: 'contentinfo',
  search: 'search',
  form: 'form',
  
  // Widget roles
  button: 'button',
  checkbox: 'checkbox',
  dialog: 'dialog',
  menubar: 'menubar',
  menu: 'menu',
  menuitem: 'menuitem',
  option: 'option',
  radio: 'radio',
  slider: 'slider',
  spinbutton: 'spinbutton',
  textbox: 'textbox',
  
  // Document structure roles
  article: 'article',
  columnheader: 'columnheader',
  definition: 'definition',
  directory: 'directory',
  document: 'document',
  group: 'group',
  heading: 'heading',
  img: 'img',
  list: 'list',
  listitem: 'listitem',
  math: 'math',
  note: 'note',
  presentation: 'presentation',
  region: 'region',
  separator: 'separator',
  toolbar: 'toolbar'
};

// ARIA states and properties
export const ariaStates = {
  expanded: 'aria-expanded',
  selected: 'aria-selected',
  checked: 'aria-checked',
  disabled: 'aria-disabled',
  hidden: 'aria-hidden',
  pressed: 'aria-pressed',
  current: 'aria-current',
  live: 'aria-live',
  atomic: 'aria-atomic',
  busy: 'aria-busy',
  grabbed: 'aria-grabbed',
  dropeffect: 'aria-dropeffect',
  invalid: 'aria-invalid',
  multiline: 'aria-multiline',
  multiselectable: 'aria-multiselectable',
  readonly: 'aria-readonly',
  required: 'aria-required',
  sort: 'aria-sort'
};

// ARIA properties for relationships
export const ariaRelationships = {
  labelledby: 'aria-labelledby',
  describedby: 'aria-describedby',
  controls: 'aria-controls',
  owns: 'aria-owns',
  flowto: 'aria-flowto',
  activedescendant: 'aria-activedescendant',
  posinset: 'aria-posinset',
  setsize: 'aria-setsize',
  level: 'aria-level'
};

// Keyboard navigation utilities
export const keyboardUtils = {
  /**
   * Standard keyboard event codes
   */
  keys: {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown',
    DELETE: 'Delete',
    BACKSPACE: 'Backspace'
  },

  /**
   * Check if key is an arrow key
   */
  isArrowKey: (key: string): boolean => {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);
  },

  /**
   * Check if key is a navigation key
   */
  isNavigationKey: (key: string): boolean => {
    return [
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'Home', 'End', 'PageUp', 'PageDown', 'Tab'
    ].includes(key);
  },

  /**
   * Handle roving tabindex for keyboard navigation
   */
  handleRovingTabindex: (
    elements: HTMLElement[],
    currentIndex: number,
    key: string
  ): number => {
    let newIndex = currentIndex;

    switch (key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        newIndex = currentIndex > 0 ? currentIndex - 1 : elements.length - 1;
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        newIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = elements.length - 1;
        break;
    }

    // Update tabindex for all elements
    elements.forEach((element, index) => {
      element.tabIndex = index === newIndex ? 0 : -1;
    });

    // Focus the new element
    elements[newIndex]?.focus();

    return newIndex;
  }
};

// Focus management utilities
export const focusUtils = {
  /**
   * Trap focus within a container
   */
  trapFocus: (container: HTMLElement): (() => void) => {
    const focusableElements = focusUtils.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter((element) => {
        return element instanceof HTMLElement && 
               !element.hidden && 
               element.offsetParent !== null;
      }) as HTMLElement[];
  },

  /**
   * Set focus to first focusable element
   */
  focusFirst: (container: HTMLElement): boolean => {
    const focusableElements = focusUtils.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      return true;
    }
    return false;
  },

  /**
   * Restore focus to previously focused element
   */
  createFocusRestore: (): (() => void) => {
    const previouslyFocused = document.activeElement as HTMLElement;
    
    return () => {
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }
};

// Screen reader utilities
export const screenReaderUtils = {
  /**
   * Announce message to screen readers
   */
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;

    document.body.appendChild(announcer);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  },

  /**
   * Create live region for dynamic content updates
   */
  createLiveRegion: (priority: 'polite' | 'assertive' = 'polite'): HTMLElement => {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
    return liveRegion;
  },

  /**
   * Update live region content
   */
  updateLiveRegion: (liveRegion: HTMLElement, message: string): void => {
    liveRegion.textContent = message;
  }
};

// Color contrast utilities
export const colorUtils = {
  /**
   * Calculate relative luminance of a color
   */
  getLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio: (
    color1: { r: number; g: number; b: number },
    color2: { r: number; g: number; b: number }
  ): number => {
    const lum1 = colorUtils.getLuminance(color1.r, color1.g, color1.b);
    const lum2 = colorUtils.getLuminance(color2.r, color2.g, color2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  /**
   * Check if color combination meets WCAG contrast requirements
   */
  meetsContrastRequirement: (
    foreground: { r: number; g: number; b: number },
    background: { r: number; g: number; b: number },
    level: 'AA' | 'AAA' = 'AA',
    size: 'normal' | 'large' = 'normal'
  ): boolean => {
    const ratio = colorUtils.getContrastRatio(foreground, background);
    
    if (level === 'AAA') {
      return size === 'large' ? ratio >= 4.5 : ratio >= 7;
    } else {
      return size === 'large' ? ratio >= 3 : ratio >= 4.5;
    }
  }
};

// Form accessibility utilities
export const formUtils = {
  /**
   * Generate accessible form field attributes
   */
  getFieldAttributes: (
    id: string,
    label?: string,
    description?: string,
    error?: string,
    required?: boolean
  ) => {
    const attributes: Record<string, any> = {
      id,
      'aria-required': required || undefined
    };

    const describedBy: string[] = [];

    if (description) {
      describedBy.push(`${id}-description`);
    }

    if (error) {
      describedBy.push(`${id}-error`);
      attributes['aria-invalid'] = true;
    }

    if (describedBy.length > 0) {
      attributes['aria-describedby'] = describedBy.join(' ');
    }

    if (label) {
      attributes['aria-label'] = label;
    }

    return attributes;
  },

  /**
   * Generate accessible error message attributes
   */
  getErrorAttributes: (fieldId: string) => ({
    id: `${fieldId}-error`,
    role: 'alert',
    'aria-live': 'polite'
  }),

  /**
   * Generate accessible description attributes
   */
  getDescriptionAttributes: (fieldId: string) => ({
    id: `${fieldId}-description`
  })
};

// Modal accessibility utilities
export const modalUtils = {
  /**
   * Make modal accessible
   */
  makeAccessible: (
    modal: HTMLElement,
    options: {
      labelledBy?: string;
      describedBy?: string;
      closeOnEscape?: boolean;
    } = {}
  ): (() => void) => {
    const { labelledBy, describedBy, closeOnEscape = true } = options;

    // Set ARIA attributes
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    
    if (labelledBy) {
      modal.setAttribute('aria-labelledby', labelledBy);
    }
    
    if (describedBy) {
      modal.setAttribute('aria-describedby', describedBy);
    }

    // Trap focus
    const cleanupFocusTrap = focusUtils.trapFocus(modal);

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        // Dispatch custom close event
        modal.dispatchEvent(new CustomEvent('modal-close'));
      }
    };

    document.addEventListener('keydown', handleEscape);

    // Focus first element
    setTimeout(() => {
      focusUtils.focusFirst(modal);
    }, 100);

    // Return cleanup function
    return () => {
      cleanupFocusTrap();
      document.removeEventListener('keydown', handleEscape);
    };
  }
};

// Skip link utilities
export const skipLinkUtils = {
  /**
   * Create skip link for keyboard navigation
   */
  createSkipLink: (targetId: string, text: string = 'Skip to main content'): HTMLElement => {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text;
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded';
    
    return skipLink;
  },

  /**
   * Add skip links to page
   */
  addSkipLinks: (links: Array<{ targetId: string; text: string }>): void => {
    const container = document.createElement('div');
    container.className = 'skip-links';
    
    links.forEach(({ targetId, text }) => {
      const skipLink = skipLinkUtils.createSkipLink(targetId, text);
      container.appendChild(skipLink);
    });
    
    document.body.insertBefore(container, document.body.firstChild);
  }
};

// Accessibility testing utilities
export const a11yTesting = {
  /**
   * Check for common accessibility issues
   */
  runBasicChecks: (): string[] => {
    const issues: string[] = [];

    // Check for images without alt text
    const images = document.querySelectorAll('img:not([alt])');
    if (images.length > 0) {
      issues.push(`${images.length} images missing alt text`);
    }

    // Check for buttons without accessible names
    const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    const buttonsWithoutText = Array.from(buttons).filter(btn => !btn.textContent?.trim());
    if (buttonsWithoutText.length > 0) {
      issues.push(`${buttonsWithoutText.length} buttons without accessible names`);
    }

    // Check for form inputs without labels
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    const inputsWithoutLabels = Array.from(inputs).filter(input => {
      const id = input.getAttribute('id');
      return !id || !document.querySelector(`label[for="${id}"]`);
    });
    if (inputsWithoutLabels.length > 0) {
      issues.push(`${inputsWithoutLabels.length} form inputs without labels`);
    }

    // Check for headings hierarchy
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let previousLevel = 0;
    let hierarchyIssues = 0;
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        hierarchyIssues++;
      }
      previousLevel = level;
    });
    
    if (hierarchyIssues > 0) {
      issues.push(`${hierarchyIssues} heading hierarchy issues found`);
    }

    return issues;
  },

  /**
   * Log accessibility issues to console
   */
  logIssues: (): void => {
    const issues = a11yTesting.runBasicChecks();
    
    if (issues.length === 0) {
      console.log('✅ No basic accessibility issues found');
    } else {
      console.warn('⚠️ Accessibility issues found:');
      issues.forEach(issue => console.warn(`  - ${issue}`));
    }
  }
};

// Utility classes for screen readers
export const srOnlyClasses = 'sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0';

// Common ARIA patterns
export const ariaPatterns = {
  /**
   * Expandable content (accordion, dropdown)
   */
  expandable: (isExpanded: boolean) => ({
    'aria-expanded': isExpanded,
    'aria-haspopup': true
  }),

  /**
   * Loading state
   */
  loading: (isLoading: boolean, label?: string) => ({
    'aria-busy': isLoading,
    'aria-label': isLoading ? (label || 'Loading...') : undefined
  }),

  /**
   * Form validation
   */
  validation: (isInvalid: boolean, errorId?: string) => ({
    'aria-invalid': isInvalid,
    'aria-describedby': isInvalid && errorId ? errorId : undefined
  }),

  /**
   * Current page/item indicator
   */
  current: (isCurrent: boolean, type: 'page' | 'step' | 'location' | 'date' | 'time' = 'page') => ({
    'aria-current': isCurrent ? type : undefined
  })
};