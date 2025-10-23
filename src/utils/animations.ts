/**
 * Animation and transition utilities for the Medical Scribe application
 */

// Easing functions
export const easingFunctions = {
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
};

// Animation durations
export const durations = {
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 750
};

// Page transition configurations
export const pageTransitions = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3, ease: 'easeInOut' }
  },
  slideLeft: {
    initial: { x: 300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 },
    transition: { duration: 0.3, ease: 'easeInOut' }
  },
  slideUp: {
    initial: { y: 50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -50, opacity: 0 },
    transition: { duration: 0.3, ease: 'easeInOut' }
  },
  scale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
    transition: { duration: 0.3, ease: 'easeInOut' }
  }
};

// Modal animations
export const modalAnimations = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
  },
  modal: {
    initial: { scale: 0.95, opacity: 0, y: 20 },
    animate: { scale: 1, opacity: 1, y: 0 },
    exit: { scale: 0.95, opacity: 0, y: 20 },
    transition: { duration: 0.2, ease: 'easeOut' }
  }
};

// Button animations
export const buttonAnimations = {
  tap: {
    whileTap: { scale: 0.95 },
    transition: { duration: 0.1 }
  },
  hover: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.2 }
  },
  bounce: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { type: 'spring', stiffness: 400, damping: 17 }
  }
};

// List item animations
export const listAnimations = {
  container: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  },
  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  }
};

// Loading animations
export const loadingAnimations = {
  spinner: {
    animate: { rotate: 360 },
    transition: { duration: 1, repeat: Infinity, ease: 'linear' }
  },
  pulse: {
    animate: { scale: [1, 1.05, 1] },
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
  },
  dots: {
    animate: { y: [0, -10, 0] },
    transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' }
  }
};

// Recording animations
export const recordingAnimations = {
  pulse: {
    animate: { 
      scale: [1, 1.1, 1],
      opacity: [1, 0.8, 1]
    },
    transition: { 
      duration: 1.5, 
      repeat: Infinity, 
      ease: 'easeInOut' 
    }
  },
  wave: {
    animate: { 
      scaleY: [1, 1.5, 1],
      scaleX: [1, 0.8, 1]
    },
    transition: { 
      duration: 0.8, 
      repeat: Infinity, 
      ease: 'easeInOut' 
    }
  }
};

// Notification animations
export const notificationAnimations = {
  slideInRight: {
    initial: { x: 300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 300, opacity: 0 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  slideInTop: {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -100, opacity: 0 },
    transition: { duration: 0.3, ease: 'easeOut' }
  }
};

// Utility functions for animations
export const animationUtils = {
  /**
   * Create a stagger animation for multiple elements
   */
  createStagger: (delay: number = 0.1) => ({
    animate: {
      transition: {
        staggerChildren: delay
      }
    }
  }),

  /**
   * Create a spring animation
   */
  createSpring: (stiffness: number = 300, damping: number = 30) => ({
    type: 'spring',
    stiffness,
    damping
  }),

  /**
   * Create a delayed animation
   */
  createDelayed: (animation: any, delay: number) => ({
    ...animation,
    transition: {
      ...animation.transition,
      delay
    }
  }),

  /**
   * Create a repeating animation
   */
  createRepeating: (animation: any, repeatCount: number = Infinity) => ({
    ...animation,
    transition: {
      ...animation.transition,
      repeat: repeatCount
    }
  })
};

// CSS class utilities for animations
export const animationClasses = {
  // Fade animations
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  
  // Slide animations
  slideInLeft: 'animate-slide-in-left',
  slideInRight: 'animate-slide-in-right',
  slideInUp: 'animate-slide-in-up',
  slideInDown: 'animate-slide-in-down',
  
  // Scale animations
  scaleIn: 'animate-scale-in',
  scaleOut: 'animate-scale-out',
  
  // Bounce animations
  bounce: 'animate-bounce',
  bounceIn: 'animate-bounce-in',
  
  // Pulse animations
  pulse: 'animate-pulse',
  heartbeat: 'animate-heartbeat',
  
  // Spin animations
  spin: 'animate-spin',
  spinSlow: 'animate-spin-slow',
  
  // Shake animations
  shake: 'animate-shake',
  wobble: 'animate-wobble'
};

// Intersection Observer utility for scroll animations
export class ScrollAnimationObserver {
  private observer: IntersectionObserver;
  private elements: Map<Element, () => void> = new Map();

  constructor(options: IntersectionObserverInit = {}) {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const callback = this.elements.get(entry.target);
          if (callback) {
            callback();
            this.unobserve(entry.target);
          }
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
      ...options
    });
  }

  observe(element: Element, callback: () => void) {
    this.elements.set(element, callback);
    this.observer.observe(element);
  }

  unobserve(element: Element) {
    this.elements.delete(element);
    this.observer.unobserve(element);
  }

  disconnect() {
    this.observer.disconnect();
    this.elements.clear();
  }
}

// Performance utilities
export const performanceUtils = {
  /**
   * Debounce function for animation triggers
   */
  debounce: (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function for scroll animations
   */
  throttle: (func: Function, limit: number) => {
    let inThrottle: boolean;
    return function executedFunction(...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Request animation frame utility
   */
  raf: (callback: () => void) => {
    if (typeof window !== 'undefined') {
      return window.requestAnimationFrame(callback);
    }
    return setTimeout(callback, 16);
  },

  /**
   * Cancel animation frame utility
   */
  cancelRaf: (id: number) => {
    if (typeof window !== 'undefined') {
      window.cancelAnimationFrame(id);
    } else {
      clearTimeout(id);
    }
  }
};

// Presets for common UI elements
export const presets = {
  card: {
    hover: 'transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
    click: 'active:translate-y-0 active:shadow-md'
  },
  button: {
    primary: 'transition-all duration-200 hover:scale-105 active:scale-95',
    secondary: 'transition-colors duration-200 hover:bg-gray-100',
    danger: 'transition-all duration-200 hover:bg-red-700 active:scale-95'
  },
  input: {
    focus: 'transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    error: 'transition-all duration-200 border-red-500 focus:ring-red-500'
  },
  modal: {
    backdrop: 'transition-opacity duration-200',
    content: 'transition-all duration-200 transform'
  }
};