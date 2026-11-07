'use client';

import React, { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  isPlaying?: boolean;
  className?: string;
  bars?: number;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isPlaying = false,
  className = '',
  bars = 18,
}) => {
  const heights = [
    0.3, 0.7, 0.45, 0.85, 0.6, 0.95, 0.4, 0.75, 0.5, 0.88, 0.35, 0.65, 0.9, 0.4, 0.7, 0.55, 0.8, 0.3,
  ];

  return (
    <div className={`flex items-end gap-[2px] h-3.5 select-none ${className}`}>
      {Array.from({ length: bars }).map((_, i) => {
        const baseH = heights[i % heights.length];
        return (
          <span
            key={i}
            className={`w-[1.5px] rounded-none transition-all duration-300 ${
              isPlaying
                ? 'bg-amber-400 animate-pulse'
                : 'bg-zinc-700 hover:bg-zinc-500'
            }`}
            style={{
              height: isPlaying ? `${Math.max(15, baseH * 100)}%` : `${baseH * 50}%`,
              animationDelay: `${(i * 0.08).toFixed(2)}s`,
              animationDuration: '1.2s',
            }}
          />
        );
      })}
    </div>
  );
};

