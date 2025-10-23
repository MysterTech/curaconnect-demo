/**
 * Performance optimization utilities for real-time updates and rendering
 */

import { useCallback, useRef, useMemo, useEffect, useState } from 'react';

// Debounce utility for frequent updates
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
};

// Throttle utility for scroll and resize events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// React hook for debounced values
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// React hook for throttled callbacks
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const throttledCallback = useRef<T>();
  const lastRun = useRef<number>(Date.now());

  throttledCallback.current = useCallback(
    ((...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );

  return throttledCallback.current;
};

// Optimized update batching for real-time data
export class UpdateBatcher<T> {
  private updates: T[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly batchSize: number;
  private readonly batchDelay: number;
  private readonly onBatch: (updates: T[]) => void;

  constructor(
    onBatch: (updates: T[]) => void,
    batchSize: number = 10,
    batchDelay: number = 100
  ) {
    this.onBatch = onBatch;
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
  }

  add(update: T): void {
    this.updates.push(update);

    // Flush immediately if batch size reached
    if (this.updates.length >= this.batchSize) {
      this.flush();
      return;
    }

    // Schedule flush if not already scheduled
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.flush();
      }, this.batchDelay);
    }
  }

  flush(): void {
    if (this.updates.length === 0) return;

    const batch = [...this.updates];
    this.updates = [];
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    this.onBatch(batch);
  }

  clear(): void {
    this.updates = [];
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }
}

// React hook for batched updates
export const useBatchedUpdates = <T>(
  onBatch: (updates: T[]) => void,
  batchSize: number = 10,
  batchDelay: number = 100
) => {
  const batcher = useRef<UpdateBatcher<T>>();

  if (!batcher.current) {
    batcher.current = new UpdateBatcher(onBatch, batchSize, batchDelay);
  }

  useEffect(() => {
    return () => {
      batcher.current?.clear();
    };
  }, []);

  return {
    addUpdate: (update: T) => batcher.current?.add(update),
    flush: () => batcher.current?.flush(),
    clear: () => batcher.current?.clear()
  };
};

// Virtual scrolling utilities for large lists
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export const useVirtualScroll = <T>(
  items: T[],
  options: VirtualScrollOptions
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const { itemHeight, containerHeight, overscan = 5 } = options;

  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(items.length - 1, visibleEnd + overscan);

    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => ({
      item,
      index: visibleRange.start + index
    }));
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  };
};

// Memoization utilities
export const createMemoizedSelector = <TState, TResult>(
  selector: (state: TState) => TResult,
  equalityFn?: (a: TResult, b: TResult) => boolean
) => {
  let lastState: TState;
  let lastResult: TResult;

  return (state: TState): TResult => {
    if (state !== lastState) {
      const newResult = selector(state);
      
      if (equalityFn) {
        if (!equalityFn(lastResult, newResult)) {
          lastResult = newResult;
        }
      } else {
        lastResult = newResult;
      }
      
      lastState = state;
    }
    
    return lastResult;
  };
};

// React hook for memoized computations
export const useMemoizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps);
};

// Performance monitoring utilities
export class PerformanceMonitor {
  private static measurements = new Map<string, number[]>();

  static startMeasurement(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.measurements.has(name)) {
        this.measurements.set(name, []);
      }
      
      this.measurements.get(name)!.push(duration);
    };
  }

  static getMeasurements(name: string) {
    const measurements = this.measurements.get(name) || [];
    
    if (measurements.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0 };
    }

    const sum = measurements.reduce((a, b) => a + b, 0);
    const average = sum / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);

    return { count: measurements.length, average, min, max };
  }

  static logMeasurements(): void {
    if (process.env.NODE_ENV === 'development') {
      console.group('⚡ Performance Measurements');
      
      for (const [name, measurements] of this.measurements) {
        const stats = this.getMeasurements(name);
        console.log(`${name}:`, {
          count: stats.count,
          average: `${stats.average.toFixed(2)}ms`,
          min: `${stats.min.toFixed(2)}ms`,
          max: `${stats.max.toFixed(2)}ms`
        });
      }
      
      console.groupEnd();
    }
  }

  static clearMeasurements(): void {
    this.measurements.clear();
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = (name: string) => {
  const endMeasurement = useRef<(() => void) | null>(null);

  useEffect(() => {
    endMeasurement.current = PerformanceMonitor.startMeasurement(name);
    
    return () => {
      endMeasurement.current?.();
    };
  }, [name]);
};

// Optimized event listeners
export const useOptimizedEventListener = (
  eventName: string,
  handler: (event: Event) => void,
  element: HTMLElement | Window | null = null,
  options: AddEventListenerOptions = {}
) => {
  const savedHandler = useRef<(event: Event) => void>();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const targetElement = element || window;
    if (!targetElement?.addEventListener) return;

    const eventListener = (event: Event) => savedHandler.current?.(event);
    
    targetElement.addEventListener(eventName, eventListener, options);
    
    return () => {
      targetElement.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]);
};

// Memory management utilities
export const memoryUtils = {
  /**
   * Clean up object references to prevent memory leaks
   */
  cleanup: (obj: any): void => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        obj[key] = null;
      });
    }
  },

  /**
   * Monitor memory usage (development only)
   */
  logMemoryUsage: (): void => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const memory = (performance as any).memory;
      console.log('Memory Usage:', {
        used: `${Math.round(memory.usedJSHeapSize / 1048576)}MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1048576)}MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)}MB`
      });
    }
  },

  /**
   * Force garbage collection (if available)
   */
  forceGC: (): void => {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }
};

// React hook for memory monitoring
export const useMemoryMonitor = (interval: number = 5000) => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const timer = setInterval(() => {
        memoryUtils.logMemoryUsage();
      }, interval);

      return () => clearInterval(timer);
    }
  }, [interval]);
};

// Optimized state updates for real-time data
export const useOptimizedState = <T>(
  initialState: T,
  updateThreshold: number = 16 // ~60fps
) => {
  const [state, setState] = useState<T>(initialState);
  const pendingUpdate = useRef<T | null>(null);
  const updateTimeout = useRef<NodeJS.Timeout | null>(null);

  const optimizedSetState = useCallback((newState: T | ((prev: T) => T)) => {
    const resolvedState = typeof newState === 'function' 
      ? (newState as (prev: T) => T)(pendingUpdate.current || state)
      : newState;

    pendingUpdate.current = resolvedState;

    if (!updateTimeout.current) {
      updateTimeout.current = setTimeout(() => {
        if (pendingUpdate.current !== null) {
          setState(pendingUpdate.current);
          pendingUpdate.current = null;
        }
        updateTimeout.current = null;
      }, updateThreshold);
    }
  }, [state, updateThreshold]);

  useEffect(() => {
    return () => {
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
    };
  }, []);

  return [state, optimizedSetState] as const;
};

// Web Worker utilities for heavy computations
export class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{
    data: any;
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }> = [];
  private busyWorkers = new Set<Worker>();

  constructor(workerScript: string, poolSize: number = navigator.hardwareConcurrency || 4) {
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerScript);
      this.workers.push(worker);
    }
  }

  async execute<T = any>(data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const availableWorker = this.workers.find(w => !this.busyWorkers.has(w));
      
      if (availableWorker) {
        this.executeOnWorker(availableWorker, data, resolve, reject);
      } else {
        this.queue.push({ data, resolve, reject });
      }
    });
  }

  private executeOnWorker(
    worker: Worker,
    data: any,
    resolve: (value: any) => void,
    reject: (error: Error) => void
  ): void {
    this.busyWorkers.add(worker);

    const handleMessage = (event: MessageEvent) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      this.busyWorkers.delete(worker);
      
      resolve(event.data);
      this.processQueue();
    };

    const handleError = (error: ErrorEvent) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      this.busyWorkers.delete(worker);
      
      reject(new Error(error.message));
      this.processQueue();
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
    worker.postMessage(data);
  }

  private processQueue(): void {
    if (this.queue.length === 0) return;

    const availableWorker = this.workers.find(w => !this.busyWorkers.has(w));
    if (availableWorker) {
      const { data, resolve, reject } = this.queue.shift()!;
      this.executeOnWorker(availableWorker, data, resolve, reject);
    }
  }

  terminate(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.busyWorkers.clear();
    this.queue = [];
  }
}