'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Post } from '@/types';
import { soundEngine } from '@/lib/soundscape';
import { hashString } from '@/lib/anonymity';
import { ArrowUpRight, Heart, Sparkles } from 'lucide-react';

interface RadarViewProps {
  posts: Post[];
  onOpenThread: (postId: string) => void;
}

export const RadarView: React.FC<RadarViewProps> = ({ posts, onOpenThread }) => {
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [angle, setAngle] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Soft gentle sweep
  useEffect(() => {
    let animId: number;
    const animate = () => {
      setAngle((prev) => (prev + 0.5) % 360);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative border border-[rgba(233,236,238,0.1)] bg-[#0e1017] p-6 text-[#e9ecee] overflow-hidden select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between text-xs text-[#8ea3b5] mb-4 border-b border-[rgba(233,236,238,0.06)] pb-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-block w-2 h-2 rounded-full bg-[#e5ab37] animate-pulse" />
          <span className="font-medium text-[#e9ecee]">The Night Sky</span>
          <span className="text-[#8ea3b5] hidden sm:inline">— Floating stories from people awake right now</span>
        </div>
        <div className="text-xs text-[#8ea3b5]">
          <span>{posts.length} stories in the room</span>
        </div>
      </div>

      {/* Coordinate Stage */}
      <div
        ref={containerRef}
        className="relative w-full h-[440px] sm:h-[500px] flex items-center justify-center overflow-hidden"
      >
        {/* Soft orbital circles */}
        <div className="absolute w-[140px] h-[140px] rounded-full border border-white/[0.04] pointer-events-none" />
        <div className="absolute w-[280px] h-[280px] rounded-full border border-white/[0.04] pointer-events-none" />
        <div className="absolute w-[420px] h-[420px] rounded-full border border-white/[0.04] pointer-events-none" />
        <div className="absolute w-[560px] h-[560px] rounded-full border border-white/[0.03] pointer-events-none" />

        {/* Soft sweep beam */}
        <div
          className="absolute w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] pointer-events-none origin-center"
          style={{
            transform: `rotate(${angle}deg)`,
            background:
              'conic-gradient(from 0deg at 50% 50%, rgba(229,171,55,0.09) 0deg, transparent 40deg, transparent 360deg)',
            borderRadius: '50%',
          }}
        />

        {/* Floating Story Beacons */}
        {posts.map((post) => {
          const hash = hashString(post.id + post.created_at);
          const theta = ((hash % 360) * Math.PI) / 180;
          const radiusNorm = 0.2 + ((hash % 70) / 100) * 0.7;
          const maxR = 210;
          const x = Math.cos(theta) * radiusNorm * maxR;
          const y = Math.sin(theta) * radiusNorm * maxR;

          const isSelected = activePost?.id === post.id;

          return (
            <div
              key={post.id}
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 group"
              onMouseEnter={() => {
                soundEngine.playClick();
                setActivePost(post);
              }}
              onClick={() => {
                soundEngine.playResonance();
                onOpenThread(post.id);
              }}
            >
              {/* Outer Pulse */}
              {post.is_urgent && (
                <span className="absolute -inset-2 rounded-full border border-rose-500/40 animate-ping pointer-events-none" />
              )}

              {/* Lantern beacon */}
              <button
                className={`relative w-4 h-4 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#e5ab37] bg-[#e5ab37]/20 scale-125'
                    : post.is_urgent
                    ? 'border-rose-400 bg-rose-950/40'
                    : post.helped_reply_id
                    ? 'border-emerald-400 bg-emerald-950/40'
                    : 'border-white/30 bg-[#13151f] hover:border-white'
                }`}
                title={`${post.mask_name} • ${post.category}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected
                      ? 'bg-[#e5ab37]'
                      : post.is_urgent
                      ? 'bg-rose-400'
                      : post.helped_reply_id
                      ? 'bg-emerald-400'
                      : 'bg-[#aab9c7]'
                  }`}
                />
              </button>

              {/* Mask name tag */}
              <div
                className={`absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs transition-opacity ${
                  isSelected ? 'opacity-100 text-white font-medium' : 'opacity-0 group-hover:opacity-100 text-[#8ea3b5]'
                }`}
              >
                <span>{post.mask_name}</span>
                <span className="opacity-60 ml-1.5">• {post.category}</span>
              </div>
            </div>
          );
        })}

        {/* Selected Story Preview Card */}
        {activePost && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md border border-[rgba(233,236,238,0.15)] bg-[#13151f]/95 backdrop-blur-md p-4 text-[#e9ecee] z-20 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs text-[#8ea3b5] mb-1.5">
              <span className="text-[#e5ab37] font-medium">{activePost.mask_name}</span>
              <div className="flex items-center gap-2">
                <span>{activePost.category}</span>
                {activePost.is_urgent && <span className="text-rose-300">• Needs support</span>}
              </div>
            </div>

            {activePost.title && (
              <h4 className="font-serif text-sm font-normal text-white line-clamp-1 mb-1">
                {activePost.title}
              </h4>
            )}

            <p className="text-xs text-[#aab9c7] line-clamp-2 leading-relaxed mb-3 font-sans">
              {activePost.body}
            </p>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-[rgba(233,236,238,0.08)]">
              <span className="text-[#8ea3b5]">{activePost.reply_count} replies</span>
              <button
                onClick={() => {
                  soundEngine.playResonance();
                  onOpenThread(activePost.id);
                }}
                className="inline-flex items-center gap-1 text-[#e5ab37] hover:text-white"
              >
                <span>Read story & reply</span>
                <ArrowUpRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[rgba(233,236,238,0.06)] text-xs text-[#8ea3b5]">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#aab9c7]" /> Story
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Needs support
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Found help
          </span>
        </div>
        <span>Hover a light to read • Click to reply</span>
      </div>
    </div>
  );
};
