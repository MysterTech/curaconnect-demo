import React, { useEffect, useRef, useState } from 'react';
import { AudioVisualizationData } from '../../services/AudioVisualizationService';

interface AudioVisualizerProps {
  audioData?: AudioVisualizationData;
  isActive?: boolean;
  type?: 'bars' | 'waveform' | 'circle';
  className?: string;
  height?: number;
  barCount?: number;
  color?: string;
  backgroundColor?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioData,
  isActive = false,
  type = 'bars',
  className = '',
  height = 60,
  barCount = 32,
  color = '#10b981',
  backgroundColor = '#f3f4f6'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [dimensions, setDimensions] = useState({ width: 300, height });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    resizeObserver.observe(canvas.parentElement!);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!isActive) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      drawStaticVisualization();
      return;
    }

    const animate = () => {
      drawVisualization();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, audioData, dimensions, type, barCount, color, backgroundColor]);

  const drawVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!audioData || !isActive) {
      drawStaticVisualization();
      return;
    }

    switch (type) {
      case 'bars':
        drawBars(ctx, audioData);
        break;
      case 'waveform':
        drawWaveform(ctx, audioData);
        break;
      case 'circle':
        drawCircle(ctx, audioData);
        break;
    }
  };

  const drawStaticVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw static bars or waveform
    if (type === 'bars') {
      drawStaticBars(ctx);
    } else if (type === 'waveform') {
      drawStaticWaveform(ctx);
    } else if (type === 'circle') {
      drawStaticCircle(ctx);
    }
  };

  const drawBars = (ctx: CanvasRenderingContext2D, data: AudioVisualizationData) => {
    const barWidth = dimensions.width / barCount;
    const frequencyData = data.frequencyData;
    
    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * frequencyData.length);
      const value = frequencyData[dataIndex] || 0;
      
      // Normalize value (frequency data is typically in dB, convert to 0-1)
      const normalizedValue = Math.max(0, Math.min(1, (value + 90) / 90));
      const barHeight = normalizedValue * dimensions.height * 0.8;
      
      const x = i * barWidth;
      const y = dimensions.height - barHeight;
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, dimensions.height, 0, 0);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, lightenColor(color, 0.3));
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth - 2, barHeight);
    }
  };

  const drawWaveform = (ctx: CanvasRenderingContext2D, data: AudioVisualizationData) => {
    const waveformData = data.waveformData;
    const sliceWidth = dimensions.width / waveformData.length;
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.beginPath();
    
    let x = 0;
    for (let i = 0; i < waveformData.length; i++) {
      const value = waveformData[i];
      const y = (value + 1) * dimensions.height / 2; // Convert from -1,1 to canvas coordinates
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.stroke();
  };

  const drawCircle = (ctx: CanvasRenderingContext2D, data: AudioVisualizationData) => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const baseRadius = Math.min(dimensions.width, dimensions.height) * 0.2;
    const maxRadius = Math.min(dimensions.width, dimensions.height) * 0.4;
    
    // Draw multiple circles based on frequency data
    const frequencyData = data.frequencyData;
    const circleCount = 8;
    
    for (let i = 0; i < circleCount; i++) {
      const dataIndex = Math.floor((i / circleCount) * frequencyData.length);
      const value = frequencyData[dataIndex] || 0;
      const normalizedValue = Math.max(0, Math.min(1, (value + 90) / 90));
      
      const radius = baseRadius + (normalizedValue * (maxRadius - baseRadius));
      const alpha = 0.3 - (i * 0.03);
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const drawStaticBars = (ctx: CanvasRenderingContext2D) => {
    const barWidth = dimensions.width / barCount;
    
    for (let i = 0; i < barCount; i++) {
      // Create random-looking but consistent static pattern
      const staticHeight = (Math.sin(i * 0.5) * 0.3 + 0.1) * dimensions.height;
      
      const x = i * barWidth;
      const y = dimensions.height - staticHeight;
      
      ctx.fillStyle = `${color}40`; // 25% opacity
      ctx.fillRect(x, y, barWidth - 2, staticHeight);
    }
  };

  const drawStaticWaveform = (ctx: CanvasRenderingContext2D) => {
    ctx.lineWidth = 2;
    ctx.strokeStyle = `${color}40`;
    ctx.beginPath();
    
    const points = 100;
    const sliceWidth = dimensions.width / points;
    
    for (let i = 0; i < points; i++) {
      const x = i * sliceWidth;
      const y = dimensions.height / 2 + Math.sin(i * 0.1) * dimensions.height * 0.1;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  };

  const drawStaticCircle = (ctx: CanvasRenderingContext2D) => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(dimensions.width, dimensions.height) * 0.3;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = `${color}40`;
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const lightenColor = (color: string, amount: number): string => {
    // Simple color lightening function
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.min(255, Math.floor(r + (255 - r) * amount));
    const newG = Math.min(255, Math.floor(g + (255 - g) * amount));
    const newB = Math.min(255, Math.floor(b + (255 - b) * amount));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };

  return (
    <div className={`relative ${className}`} style={{ height: `${height}px` }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-md"
        style={{ height: `${height}px` }}
      />
      
      {/* Audio level indicator */}
      {audioData && isActive && (
        <div className="absolute top-2 right-2 text-xs text-gray-500">
          {Math.round(audioData.audioLevel * 100)}%
        </div>
      )}
      
      {/* Clipping warning */}
      {audioData?.isClipping && (
        <div className="absolute top-2 left-2 text-xs text-red-600 font-medium animate-pulse">
          CLIPPING
        </div>
      )}
    </div>
  );
};

// Simple bars visualizer for minimal use cases
export const SimpleAudioBars: React.FC<{
  audioLevel: number;
  isActive: boolean;
  barCount?: number;
  className?: string;
}> = ({ audioLevel, isActive: _isActive, barCount = 5, className = '' }) => {
  return (
    <div className={`flex items-end space-x-1 ${className}`}>
      {Array.from({ length: barCount }).map((_, index) => {
        const threshold = (index + 1) / barCount;
        const isActive = audioLevel > threshold;
        
        return (
          <div
            key={index}
            className={`w-1 transition-all duration-150 ${
              isActive ? 'bg-green-500' : 'bg-gray-300'
            }`}
            style={{
              height: `${8 + index * 4}px`
            }}
          />
        );
      })}
    </div>
  );
};