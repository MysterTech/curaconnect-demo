/**
 * Responsive design utilities and breakpoint management
 */

import React from 'react';

// Tailwind CSS breakpoints (matching default configuration)
export const breakpoints = {
  sm: 640,   // Small devices (landscape phones, 640px and up)
  md: 768,   // Medium devices (tablets, 768px and up)
  lg: 1024,  // Large devices (desktops, 1024px and up)
  xl: 1280,  // Extra large devices (large desktops, 1280px and up)
  '2xl': 1536 // 2X Extra large devices (larger desktops, 1536px and up)
};

// Device type detection
export const deviceTypes = {
  mobile: { min: 0, max: breakpoints.sm - 1 },
  tablet: { min: breakpoints.sm, max: breakpoints.lg - 1 },
  desktop: { min: breakpoints.lg, max: Infinity }
};

// Responsive utility functions
export const responsive = {
  /**
   * Get current screen size category
   */
  getCurrentBreakpoint: (): keyof typeof breakpoints => {
    if (typeof window === 'undefined') return 'lg';
    
    const width = window.innerWidth;
    
    if (width >= breakpoints['2xl']) return '2xl';
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    if (width >= breakpoints.sm) return 'sm';
    return 'sm';
  },

  /**
   * Check if current screen matches breakpoint
   */
  isBreakpoint: (breakpoint: keyof typeof breakpoints): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= breakpoints[breakpoint];
  },

  /**
   * Check if current screen is mobile
   */
  isMobile: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoints.md;
  },

  /**
   * Check if current screen is tablet
   */
  isTablet: (): boolean => {
    if (typeof window === 'undefined') return false;
    const width = window.innerWidth;
    return width >= breakpoints.sm && width < breakpoints.lg;
  },

  /**
   * Check if current screen is desktop
   */
  isDesktop: (): boolean => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= breakpoints.lg;
  },

  /**
   * Get responsive value based on current breakpoint
   */
  getValue: <T>(values: Partial<Record<keyof typeof breakpoints, T>>): T | undefined => {
    const currentBreakpoint = responsive.getCurrentBreakpoint();
    
    // Try to find exact match first
    if (values[currentBreakpoint]) {
      return values[currentBreakpoint];
    }
    
    // Fall back to smaller breakpoints
    const orderedBreakpoints: (keyof typeof breakpoints)[] = ['2xl', 'xl', 'lg', 'md', 'sm'];
    const currentIndex = orderedBreakpoints.indexOf(currentBreakpoint);
    
    for (let i = currentIndex; i < orderedBreakpoints.length; i++) {
      const bp = orderedBreakpoints[i];
      if (values[bp]) {
        return values[bp];
      }
    }
    
    return undefined;
  }
};

// React hook for responsive behavior
export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = React.useState<keyof typeof breakpoints>('lg');
  const [isMobile, setIsMobile] = React.useState(false);
  const [isTablet, setIsTablet] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(true);

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const current = responsive.getCurrentBreakpoint();
      setBreakpoint(current);
      setIsMobile(responsive.isMobile());
      setIsTablet(responsive.isTablet());
      setIsDesktop(responsive.isDesktop());
    };

    // Initial check
    updateBreakpoint();

    // Add resize listener
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isBreakpoint: responsive.isBreakpoint,
    getValue: responsive.getValue
  };
};

// Responsive grid configurations
export const gridConfigs = {
  sessions: {
    sm: 'grid-cols-1',
    md: 'grid-cols-2',
    lg: 'grid-cols-3',
    xl: 'grid-cols-4',
    '2xl': 'grid-cols-5'
  },
  dashboard: {
    sm: 'grid-cols-1',
    md: 'grid-cols-2',
    lg: 'grid-cols-3',
    xl: 'grid-cols-4'
  },
  stats: {
    sm: 'grid-cols-2',
    md: 'grid-cols-4',
    lg: 'grid-cols-4',
    xl: 'grid-cols-6'
  }
};

// Responsive spacing configurations
export const spacingConfigs = {
  container: {
    sm: 'px-4',
    md: 'px-6',
    lg: 'px-8',
    xl: 'px-12'
  },
  section: {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
    xl: 'py-20'
  },
  card: {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }
};

// Responsive text configurations
export const textConfigs = {
  heading: {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl'
  },
  subheading: {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  },
  body: {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }
};

// Layout configurations for different screen sizes
export const layoutConfigs = {
  sidebar: {
    mobile: {
      width: 'w-64',
      position: 'fixed',
      overlay: true,
      collapsible: true
    },
    tablet: {
      width: 'w-64',
      position: 'fixed',
      overlay: true,
      collapsible: true
    },
    desktop: {
      width: 'w-64',
      position: 'relative',
      overlay: false,
      collapsible: false
    }
  },
  header: {
    mobile: {
      height: 'h-16',
      padding: 'px-4',
      showMenuButton: true
    },
    tablet: {
      height: 'h-16',
      padding: 'px-6',
      showMenuButton: true
    },
    desktop: {
      height: 'h-16',
      padding: 'px-8',
      showMenuButton: false
    }
  },
  content: {
    mobile: {
      padding: 'p-4',
      maxWidth: 'max-w-full'
    },
    tablet: {
      padding: 'p-6',
      maxWidth: 'max-w-4xl'
    },
    desktop: {
      padding: 'p-8',
      maxWidth: 'max-w-6xl'
    }
  }
};

// Responsive component utilities
export const responsiveUtils = {
  /**
   * Generate responsive classes based on configuration
   */
  getResponsiveClasses: (config: Partial<Record<keyof typeof breakpoints, string>>): string => {
    const classes: string[] = [];
    
    Object.entries(config).forEach(([breakpoint, className]) => {
      if (breakpoint === 'sm') {
        classes.push(className);
      } else {
        classes.push(`${breakpoint}:${className}`);
      }
    });
    
    return classes.join(' ');
  },

  /**
   * Get layout configuration for current device
   */
  getLayoutConfig: (configType: keyof typeof layoutConfigs) => {
    const config = layoutConfigs[configType];
    
    if (responsive.isMobile()) return config.mobile;
    if (responsive.isTablet()) return config.tablet;
    return config.desktop;
  },

  /**
   * Generate responsive grid classes
   */
  getGridClasses: (gridType: keyof typeof gridConfigs): string => {
    return responsiveUtils.getResponsiveClasses(gridConfigs[gridType]);
  },

  /**
   * Generate responsive spacing classes
   */
  getSpacingClasses: (spacingType: keyof typeof spacingConfigs): string => {
    return responsiveUtils.getResponsiveClasses(spacingConfigs[spacingType]);
  },

  /**
   * Generate responsive text classes
   */
  getTextClasses: (textType: keyof typeof textConfigs): string => {
    return responsiveUtils.getResponsiveClasses(textConfigs[textType]);
  }
};

// Media query utilities for CSS-in-JS
export const mediaQueries = {
  sm: `@media (min-width: ${breakpoints.sm}px)`,
  md: `@media (min-width: ${breakpoints.md}px)`,
  lg: `@media (min-width: ${breakpoints.lg}px)`,
  xl: `@media (min-width: ${breakpoints.xl}px)`,
  '2xl': `@media (min-width: ${breakpoints['2xl']}px)`,
  
  // Max-width queries
  maxSm: `@media (max-width: ${breakpoints.sm - 1}px)`,
  maxMd: `@media (max-width: ${breakpoints.md - 1}px)`,
  maxLg: `@media (max-width: ${breakpoints.lg - 1}px)`,
  maxXl: `@media (max-width: ${breakpoints.xl - 1}px)`,
  
  // Range queries
  smToMd: `@media (min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.md - 1}px)`,
  mdToLg: `@media (min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  lgToXl: `@media (min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints.xl - 1}px)`,
  
  // Orientation queries
  landscape: '@media (orientation: landscape)',
  portrait: '@media (orientation: portrait)',
  
  // High DPI queries
  retina: '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)'
};

// Touch device detection
export const touchUtils = {
  /**
   * Check if device supports touch
   */
  isTouchDevice: (): boolean => {
    if (typeof window === 'undefined') return false;
    
    return 'ontouchstart' in window ||
           navigator.maxTouchPoints > 0 ||
           (navigator as any).msMaxTouchPoints > 0;
  },

  /**
   * Get appropriate event handlers for touch/mouse
   */
  getEventHandlers: (handlers: {
    onStart?: () => void;
    onEnd?: () => void;
    onMove?: () => void;
  }) => {
    const isTouch = touchUtils.isTouchDevice();
    
    return {
      [isTouch ? 'onTouchStart' : 'onMouseDown']: handlers.onStart,
      [isTouch ? 'onTouchEnd' : 'onMouseUp']: handlers.onEnd,
      [isTouch ? 'onTouchMove' : 'onMouseMove']: handlers.onMove
    };
  }
};

// Accessibility utilities for responsive design
export const a11yUtils = {
  /**
   * Get appropriate focus ring size for current device
   */
  getFocusRingClasses: (): string => {
    if (responsive.isMobile()) {
      return 'focus:ring-4 focus:ring-blue-300';
    }
    return 'focus:ring-2 focus:ring-blue-500';
  },

  /**
   * Get appropriate touch target size
   */
  getTouchTargetClasses: (): string => {
    if (touchUtils.isTouchDevice()) {
      return 'min-h-[44px] min-w-[44px]'; // 44px is recommended minimum touch target
    }
    return 'min-h-[32px] min-w-[32px]';
  },

  /**
   * Get appropriate text size for readability
   */
  getReadableTextClasses: (): string => {
    if (responsive.isMobile()) {
      return 'text-base leading-relaxed';
    }
    return 'text-sm leading-normal';
  }
};