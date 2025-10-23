import React, { Suspense, lazy, ComponentType } from 'react';
import { Skeleton } from '../components/animations/AnimationComponents';

/**
 * Lazy loading utilities for code splitting and performance optimization
 */

// Loading fallback components
export const PageLoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-600">Loading page...</p>
    </div>
  </div>
);

export const ComponentLoadingFallback: React.FC = () => (
  <div className="p-4">
    <Skeleton lines={3} />
  </div>
);

export const ModalLoadingFallback: React.FC = () => (
  <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
    <Skeleton lines={4} />
  </div>
);

// Higher-order component for lazy loading with custom fallback
export const withLazyLoading = <P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  fallback: React.ComponentType = ComponentLoadingFallback
) => {
  const LazyComponent = lazy(importFunc);
  
  return (props: P) => (
    <Suspense fallback={<fallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Lazy loaded page components
export const LazyDashboard = lazy(() => 
  import('../pages/Dashboard').then(module => ({ default: module.Dashboard }))
);

export const LazyActiveSession = lazy(() => 
  import('../pages/ActiveSession').then(module => ({ default: module.ActiveSession }))
);

export const LazySessionReview = lazy(() => 
  import('../pages/SessionReview').then(module => ({ default: module.SessionReview }))
);

export const LazySessionHistory = lazy(() => 
  import('../pages/SessionHistory').then(module => ({ default: module.SessionHistory }))
);

// Lazy loaded modal components
export const LazyExportModal = lazy(() => 
  import('../components/export/ExportModal').then(module => ({ default: module.ExportModal }))
);

export const LazyDeleteConfirmationModal = lazy(() => 
  import('../components/common/DeleteConfirmationModal').then(module => ({ default: module.DeleteConfirmationModal }))
);

export const LazySessionTimeoutModal = lazy(() => 
  import('../components/common/SessionTimeoutModal').then(module => ({ default: module.SessionTimeoutModal }))
);

// Lazy loaded feature components
export const LazySearchBar = lazy(() => 
  import('../components/search/SearchBar').then(module => ({ default: module.SearchBar }))
);

export const LazyFilterBar = lazy(() => 
  import('../components/search/FilterBar').then(module => ({ default: module.FilterBar }))
);

// Preloading utilities
export class ComponentPreloader {
  private static preloadedComponents = new Set<string>();

  /**
   * Preload a component for faster loading
   */
  static preload(componentName: string, importFunc: () => Promise<any>): void {
    if (this.preloadedComponents.has(componentName)) {
      return;
    }

    this.preloadedComponents.add(componentName);
    
    // Use requestIdleCallback if available, otherwise use setTimeout
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        importFunc().catch(console.error);
      });
    } else {
      setTimeout(() => {
        importFunc().catch(console.error);
      }, 100);
    }
  }

  /**
   * Preload critical components that are likely to be used soon
   */
  static preloadCritical(): void {
    // Preload session-related components
    this.preload('ActiveSession', () => import('../pages/ActiveSession'));
    this.preload('SessionReview', () => import('../pages/SessionReview'));
    
    // Preload commonly used modals
    this.preload('ExportModal', () => import('../components/export/ExportModal'));
    this.preload('DeleteConfirmationModal', () => import('../components/common/DeleteConfirmationModal'));
  }

  /**
   * Preload components based on user interaction patterns
   */
  static preloadOnHover(componentName: string, importFunc: () => Promise<any>): () => void {
    let timeoutId: NodeJS.Timeout;

    const handleMouseEnter = () => {
      timeoutId = setTimeout(() => {
        this.preload(componentName, importFunc);
      }, 200); // Small delay to avoid preloading on accidental hovers
    };

    const handleMouseLeave = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }
}

// Route-based code splitting wrapper
export const LazyRoute: React.FC<{
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  fallback?: React.ComponentType;
  preload?: boolean;
}> = ({ component: Component, fallback = PageLoadingFallback, preload = false }) => {
  React.useEffect(() => {
    if (preload) {
      // Preload the component when the route wrapper mounts
      Component._payload._result?.catch(() => {
        // Component is already loaded or loading
      });
    }
  }, [Component, preload]);

  return (
    <Suspense fallback={<fallback />}>
      <Component />
    </Suspense>
  );
};

// Image lazy loading component
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  className = '',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [isInView, setIsInView] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div className={`relative ${className}`} ref={imgRef}>
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder ? (
            <img src={placeholder} alt="" className="opacity-50" />
          ) : (
            <div className="text-gray-400 text-sm">Loading...</div>
          )}
        </div>
      )}

      {/* Actual image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-500 text-sm">Failed to load image</div>
        </div>
      )}
    </div>
  );
};

// Bundle analyzer helper (development only)
export const BundleAnalyzer = {
  /**
   * Log bundle information in development
   */
  logBundleInfo: () => {
    if (process.env.NODE_ENV === 'development') {
      console.group('📦 Bundle Information');
      
      // Log loaded chunks
      if ('webpackChunkName' in window) {
        console.log('Loaded chunks:', (window as any).webpackChunkName);
      }
      
      // Log performance metrics
      if ('performance' in window && window.performance.getEntriesByType) {
        const navigationEntries = window.performance.getEntriesByType('navigation');
        if (navigationEntries.length > 0) {
          const entry = navigationEntries[0] as PerformanceNavigationTiming;
          console.log('Load time:', Math.round(entry.loadEventEnd - entry.fetchStart), 'ms');
          console.log('DOM ready:', Math.round(entry.domContentLoadedEventEnd - entry.fetchStart), 'ms');
        }
      }
      
      console.groupEnd();
    }
  },

  /**
   * Monitor chunk loading
   */
  monitorChunkLoading: () => {
    if (process.env.NODE_ENV === 'development') {
      const originalImport = window.__webpack_require__;
      if (originalImport) {
        // This would require webpack configuration to expose chunk loading
        console.log('Chunk loading monitoring enabled');
      }
    }
  }
};

// Performance monitoring for lazy loaded components
export const useComponentPerformance = (componentName: string) => {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        console.log(`⚡ ${componentName} render time:`, Math.round(endTime - startTime), 'ms');
      };
    }
  }, [componentName]);
};

// Lazy loading hook for dynamic imports
export const useLazyImport = <T = any>(
  importFunc: () => Promise<T>,
  deps: React.DependencyList = []
) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    
    setLoading(true);
    setError(null);
    
    importFunc()
      .then(result => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, deps);

  return { data, loading, error };
};