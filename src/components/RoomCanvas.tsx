'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Post } from '@/types';
import { soundEngine } from '@/lib/soundscape';

interface RoomCanvasProps {
  posts: Post[];
  onSelectPost?: (post: Post) => void;
}

export const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'Mental Health':
    case 'Personal':
      return '#e2869a'; // soft pink
    case 'Career':
      return '#e5ab37'; // amber
    case 'Studies':
    case 'Financial':
    case 'Money':
      return '#7ec89f'; // green
    case 'Relationships':
    case 'Family':
      return '#a78bfa'; // violet
    case 'Existential':
    default:
      return '#68b9d0'; // cyan
  }
};

// Deterministic pseudo-random coordinate generator from ID
function hashToCoords(id: string): { x: number; y: number } {
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash1 = (hash1 << 5) - hash1 + char;
    hash1 |= 0;
    hash2 = (hash2 << 7) - hash2 + char * 31;
    hash2 |= 0;
  }
  // Span across a 2400x1600 organic plane
  const normX = ((Math.abs(hash1) % 2000) - 1000) * 1.2;
  const normY = ((Math.abs(hash2) % 1400) - 700) * 1.1;
  return { x: normX, y: normY };
}

export const RoomCanvas: React.FC<RoomCanvasProps> = ({ posts, onSelectPost }) => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pan offsets & momentum
  const panRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const velocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);

  const [hasBgImage, setHasBgImage] = useState<boolean | null>(null);
  const [hoveredPost, setHoveredPost] = useState<{
    post: Post;
    screenX: number;
    screenY: number;
  } | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Check if /public/bg/room.webp exists
  useEffect(() => {
    const img = new Image();
    img.src = '/bg/room.webp';
    img.onload = () => setHasBgImage(true);
    img.onerror = () => setHasBgImage(false);
  }, []);

  // Momentum animation loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (!isDraggingRef.current) {
        // Friction / inertia
        velocityRef.current.vx *= 0.92;
        velocityRef.current.vy *= 0.92;

        if (Math.abs(velocityRef.current.vx) > 0.1 || Math.abs(velocityRef.current.vy) > 0.1) {
          panRef.current.x += velocityRef.current.vx * dt * 60;
          panRef.current.y += velocityRef.current.vy * dt * 60;

          // Clamp bounds
          panRef.current.x = Math.max(-1200, Math.min(1200, panRef.current.x));
          panRef.current.y = Math.max(-800, Math.min(800, panRef.current.y));
        }
      }

      // Render canvas fog fallback if no background image
      const canvas = canvasRef.current;
      if (canvas && hasBgImage === false) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          // Deep navy-teal background
          ctx.fillStyle = '#0c0f1d';
          ctx.fillRect(0, 0, w, h);

          // Atmospheric subtle fog blooms
          const t = prefersReducedMotion ? 0 : currentTime * 0.0004;
          const blooms = [
            { x: w * 0.3 + Math.sin(t) * 80 + panRef.current.x * 0.2, y: h * 0.4 + Math.cos(t) * 60 + panRef.current.y * 0.2, r: 420, color: 'rgba(20, 36, 68, 0.45)' },
            { x: w * 0.75 + Math.cos(t * 0.8) * 90 + panRef.current.x * 0.15, y: h * 0.6 + Math.sin(t * 0.7) * 70 + panRef.current.y * 0.15, r: 500, color: 'rgba(16, 44, 58, 0.35)' },
            { x: w * 0.5 + Math.sin(t * 1.2) * 60 + panRef.current.x * 0.1, y: h * 0.8 + Math.cos(t * 0.9) * 50 + panRef.current.y * 0.1, r: 380, color: 'rgba(25, 28, 55, 0.4)' },
          ];

          blooms.forEach((b) => {
            const radGrad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
            radGrad.addColorStop(0, b.color);
            radGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
          });

          // Soft vignette around borders
          const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
          vignette.addColorStop(0, 'transparent');
          vignette.addColorStop(1, 'rgba(8, 9, 15, 0.85)');
          ctx.fillStyle = vignette;
          ctx.fillRect(0, 0, w, h);
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [hasBgImage, prefersReducedMotion]);

  // Handle Canvas Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pointer drag events for canvas exploration
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    velocityRef.current = { vx: 0, vy: 0 };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    panRef.current.x += dx;
    panRef.current.y += dy;
    velocityRef.current = { vx: dx, vy: dy };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Wheel zoom / pan
  const handleWheel = (e: React.WheelEvent) => {
    panRef.current.x -= e.deltaX * 0.8;
    panRef.current.y -= e.deltaY * 0.8;
    panRef.current.x = Math.max(-1200, Math.min(1200, panRef.current.x));
    panRef.current.y = Math.max(-800, Math.min(800, panRef.current.y));
  };

  const handleLightClick = (post: Post) => {
    soundEngine.playClick();
    if (onSelectPost) {
      onSelectPost(post);
    } else {
      router.push(`/problems/${post.id}`);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      className="absolute inset-0 w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing touch-none z-0"
    >
      {/* Background Image (if present in /public/bg/room.webp) */}
      {hasBgImage && (
        <div
          className="absolute inset-[-100px] bg-cover bg-center transition-transform duration-75 pointer-events-none"
          style={{
            backgroundImage: "url('/bg/room.webp')",
            transform: `translate3d(${panRef.current.x * 0.3}px, ${panRef.current.y * 0.3}px, 0)`,
          }}
        />
      )}

      {/* Canvas Fog Fallback (if no image exists) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Atmospheric vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_30%,_rgba(10,12,20,0.85)_100%)]" />

      {/* Problem Lights Plane */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate3d(${panRef.current.x}px, ${panRef.current.y}px, 0)`,
        }}
      >
        {posts.map((post) => {
          const coords = hashToCoords(post.id);
          const color = getCategoryColor(post.category);
          const isUnanswered = post.reply_count === 0;

          // Responsive size based on replies: 7px core up to 13px
          const coreSize = Math.min(13, 7 + Math.log2(post.reply_count + 1) * 1.5);
          const haloSize = coreSize * 4;

          // Center coordinate calculation
          const cx = typeof window !== 'undefined' ? window.innerWidth / 2 + coords.x : 500 + coords.x;
          const cy = typeof window !== 'undefined' ? window.innerHeight / 2 + coords.y : 400 + coords.y;

          return (
            <div
              key={post.id}
              style={{
                position: 'absolute',
                left: `${cx}px`,
                top: `${cy}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className="pointer-events-auto cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation();
                handleLightClick(post);
              }}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredPost({
                  post,
                  screenX: rect.left + rect.width / 2,
                  screenY: rect.top,
                });
              }}
              onMouseLeave={() => setHoveredPost(null)}
            >
              {/* Outer Halo */}
              <div
                className={`
                  rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none
                  ${isUnanswered && !prefersReducedMotion ? 'room-light-pulse' : 'opacity-40'}
                  group-hover:opacity-90 group-hover:scale-125 transition-all duration-300
                `}
                style={{
                  width: `${haloSize}px`,
                  height: `${haloSize}px`,
                  background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                }}
              />

              {/* Core Light */}
              <div
                className="rounded-full relative z-10 transition-transform duration-200 group-hover:scale-150"
                style={{
                  width: `${coreSize}px`,
                  height: `${coreSize}px`,
                  backgroundColor: color,
                  boxShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Floating Outlined Tooltip */}
      {hoveredPost && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 bg-[#0c0d14]/95 border border-[rgba(255,255,255,0.22)] backdrop-blur-sm max-w-xs shadow-2xl transition-opacity duration-150"
          style={{
            left: `${hoveredPost.screenX}px`,
            top: `${hoveredPost.screenY - 10}px`,
          }}
        >
          <div className="font-serif text-[15px] text-[#f2f2f5] leading-snug line-clamp-2">
            {hoveredPost.post.title || hoveredPost.post.body.slice(0, 50)}
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[#7c8299] flex items-center justify-between gap-4 font-sans">
            <span>{hoveredPost.post.category}</span>
            <span>
              {hoveredPost.post.reply_count} {hoveredPost.post.reply_count === 1 ? 'reply' : 'replies'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

