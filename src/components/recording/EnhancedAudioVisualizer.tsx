import React, { useEffect, useRef, useState } from 'react';
import { AudioMonitor, AudioWarning } from '../../utils/AudioMonitor';

interface EnhancedAudioVisualizerProps {
  isActive: boolean;
  audioLevel?: number;
  type?: 'bars' | 'waveform' | 'circle';
  height?: number;
  className?: string;
  showWarnings?: boolean;
  onWarning?: (warning: AudioWarning) => void;
}

export const EnhancedAudioVisualizer: React.FC<EnhancedAudioVisualizerProps> = ({
  isActive,
  audioLevel = 0,
  type = 'bars',
  height = 120,
  className = '',
  showWarnings = true,
  onWarning
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [audioMonitor] = useState(() => new AudioMonitor());
  const [currentWarning, setCurrentWarning] = useState<AudioWarning | null>(null);
  const [audioQuality, setAudioQuality] = useState<'excellent' | 'good' | 'fair' | 'poor' | 'none'>('none');

  useEffect(() => {
    if (isActive) {
      audioMonitor.start();
      
      const handleWarning = (warning: AudioWarning) => {
        setCurrentWarning(warning);
        if (onWarning) {
          onWarning(warning);
        }
        
        // Auto-dismiss warning after 10 seconds
        setTimeout(() => {
          setCurrentWarning(null);
        }, 10000);
      };

      audioMonitor.onWarning(handleWarning);

      return () => {
        audioMonitor.stop();
        audioMonitor.removeWarningCallback(handleWarning);
      };
    } else {
      audioMonitor.stop();
      setCurrentWarning(null);
      setAudioQuality('none');
    }
  }, [isActive, audioMonitor, onWarning]);

  useEffect(() => {
    if (isActive) {
      audioMonitor.updateAudioLevel(audioLevel);
      setAudioQuality(audioMonitor.getAudioQuality());
    }
  }, [audioLevel, isActive, audioMonitor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      if (!isActive) {
        // Draw inactive state
        ctx.fillStyle = '#E5E7EB';
        ctx.fillRect(0, height / 2 - 2, width, 4);
        return;
      }

      // Get color based on audio quality
      const color = getQualityColor(audioQuality);

      switch (type) {
        case 'bars':
          drawBars(ctx, width, height, audioLevel, color);
          break;
        case 'waveform':
          drawWaveform(ctx, width, height, audioLevel, color);
          break;
        case 'circle':
          drawCircle(ctx, width, height, audioLevel, color);
          break;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, audioLevel, type, audioQuality]);

  const getQualityColor = (quality: string): string => {
    switch (quality) {
      case 'excellent':
        return '#10B981'; // green-500
      case 'good':
        return '#3B82F6'; // blue-500
      case 'fair':
        return '#F59E0B'; // yellow-500
      case 'poor':
        return '#EF4444'; // red-500
      case 'none':
      default:
        return '#9CA3AF'; // gray-400
    }
  };

  const drawBars = (ctx: CanvasRenderingContext2D, width: number, height: number, level: number, color: string) => {
    const barCount = 20;
    const barWidth = width / barCount - 2;
    const activeBarCount = Math.floor(barCount * level);

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + 2);
      const barHeight = (height / 2) * (i < activeBarCount ? 1 : 0.2);
      const y = (height - barHeight) / 2;

      ctx.fillStyle = i < activeBarCount ? color : '#E5E7EB';
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  };

  const drawWaveform = (ctx: CanvasRenderingContext2D, width: number, height: number, level: number, color: string) => {
    const centerY = height / 2;
    const amplitude = (height / 2) * level;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let x = 0; x < width; x++) {
      const y = centerY + Math.sin((x / width) * Math.PI * 4 + Date.now() / 200) * amplitude;
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  };

  const drawCircle = (ctx: CanvasRenderingContext2D, width: number, height: number, level: number, color: string) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 10;
    const radius = maxRadius * (0.3 + level * 0.7);

    // Draw outer circle
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw inner circle (animated)
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Draw center dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();
  };

  const getWarningIcon = (type: string) => {
    switch (type) {
      case 'no_audio':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'low_audio':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'clipping':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getWarningColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className={className}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={height}
          className="w-full"
          style={{ height: `${height}px` }}
        />
        
        {/* Audio quality indicator */}
        {isActive && (
          <div className="absolute top-2 right-2">
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              audioQuality === 'excellent' ? 'bg-green-100 text-green-800' :
              audioQuality === 'good' ? 'bg-blue-100 text-blue-800' :
              audioQuality === 'fair' ? 'bg-yellow-100 text-yellow-800' :
              audioQuality === 'poor' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {audioQuality.charAt(0).toUpperCase() + audioQuality.slice(1)}
            </div>
          </div>
        )}
      </div>

      {/* Warning display */}
      {showWarnings && currentWarning && (
        <div className={`mt-3 p-3 border rounded-md ${getWarningColor(currentWarning.severity)}`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getWarningIcon(currentWarning.type)}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{currentWarning.message}</p>
            </div>
            <button
              onClick={() => setCurrentWarning(null)}
              className="flex-shrink-0 ml-3"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
