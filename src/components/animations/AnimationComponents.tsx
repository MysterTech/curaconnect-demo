import React, { useState, useEffect } from 'react';

// Fade In Animation Component
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const FadeIn: React.FC<FadeInProps> = ({ 
  children, 
  delay = 0, 
  duration = 300, 
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-opacity ease-in-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
};

// Slide In Animation Component
interface SlideInProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 300,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getTransform = () => {
    if (isVisible) return 'translate(0, 0)';
    
    switch (direction) {
      case 'left':
        return 'translateX(-20px)';
      case 'right':
        return 'translateX(20px)';
      case 'up':
        return 'translateY(20px)';
      case 'down':
        return 'translateY(-20px)';
      default:
        return 'translateY(20px)';
    }
  };

  return (
    <div
      className={`transition-all ease-out ${className}`}
      style={{
        transform: getTransform(),
        opacity: isVisible ? 1 : 0,
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
};

// Scale Animation Component
interface ScaleProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  hover?: boolean;
}

export const Scale: React.FC<ScaleProps> = ({
  children,
  delay = 0,
  duration = 200,
  className = '',
  hover = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getScale = () => {
    if (!isVisible) return 'scale(0.95)';
    if (hover && isHovered) return 'scale(1.02)';
    return 'scale(1)';
  };

  return (
    <div
      className={`transition-transform ease-out ${className}`}
      style={{
        transform: getScale(),
        opacity: isVisible ? 1 : 0,
        transitionDuration: `${duration}ms`
      }}
      onMouseEnter={() => hover && setIsHovered(true)}
      onMouseLeave={() => hover && setIsHovered(false)}
    >
      {children}
    </div>
  );
};

// Stagger Animation for Lists
interface StaggerProps {
  children: React.ReactNode[];
  delay?: number;
  staggerDelay?: number;
  className?: string;
}

export const Stagger: React.FC<StaggerProps> = ({
  children,
  delay = 0,
  staggerDelay = 100,
  className = ''
}) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <FadeIn delay={delay + (index * staggerDelay)} key={index}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
};

// Pulse Animation Component
interface PulseProps {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
}

export const Pulse: React.FC<PulseProps> = ({
  children,
  className = '',
  active = true
}) => {
  return (
    <div
      className={`${active ? 'animate-pulse' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

// Bounce Animation Component
interface BounceProps {
  children: React.ReactNode;
  className?: string;
  trigger?: boolean;
}

export const Bounce: React.FC<BounceProps> = ({
  children,
  className = '',
  trigger = false
}) => {
  return (
    <div
      className={`transition-transform duration-200 ${
        trigger ? 'animate-bounce' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

// Spin Animation Component
interface SpinProps {
  children: React.ReactNode;
  className?: string;
  spinning?: boolean;
}

export const Spin: React.FC<SpinProps> = ({
  children,
  className = '',
  spinning = true
}) => {
  return (
    <div
      className={`${spinning ? 'animate-spin' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

// Progress Bar Animation
interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  color?: string;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = '',
  color = 'bg-blue-500',
  animated = true
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentProgress(progress);
    }, 100);

    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div
        className={`h-2 rounded-full transition-all duration-500 ease-out ${color} ${
          animated ? 'transition-all' : ''
        }`}
        style={{ width: `${Math.min(100, Math.max(0, currentProgress))}%` }}
      />
    </div>
  );
};

// Typing Animation Component
interface TypingAnimationProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export const TypingAnimation: React.FC<TypingAnimationProps> = ({
  text,
  speed = 50,
  className = '',
  onComplete
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {currentIndex < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
};

// Floating Action Button with Animation
interface FloatingButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  children,
  onClick,
  className = '',
  position = 'bottom-right'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  return (
    <button
      onClick={onClick}
      className={`
        fixed ${positionClasses[position]} z-50
        w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg
        hover:bg-blue-700 hover:scale-110 active:scale-95
        transition-all duration-200 ease-out
        flex items-center justify-center
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

// Card Hover Animation
interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        transition-all duration-200 ease-out
        hover:shadow-lg hover:-translate-y-1
        active:translate-y-0 active:shadow-md
        cursor-pointer
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Loading Skeleton Animation
interface SkeletonProps {
  className?: string;
  lines?: number;
  avatar?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  lines = 3,
  avatar = false
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {avatar && (
        <div className="flex items-center space-x-4 mb-4">
          <div className="rounded-full bg-gray-300 h-10 w-10"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`h-4 bg-gray-300 rounded ${
              index === lines - 1 ? 'w-2/3' : 'w-full'
            }`}
          />
        ))}
      </div>
    </div>
  );
};