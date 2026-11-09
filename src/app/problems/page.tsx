'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Post, Category } from '@/types';
import { communityStore } from '@/lib/store';
import { soundEngine } from '@/lib/soundscape';
import { Plus } from 'lucide-react';

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  return `${Math.floor(months / 12)} years ago`;
}

export default function ProblemsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [sortTab, setSortTab] = useState<'latest' | 'most_helped' | 'unanswered'>('latest');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPosts(communityStore.getPosts());
    communityStore.syncWithServer();
    const unsub = communityStore.subscribe(() => {
      setPosts(communityStore.getPosts());
    });
    return () => unsub();
  }, []);

  const categories: Array<Category | 'All'> = [
    'All',
    'Career',
    'Relationships',
    'Mental Health',
    'Financial',
    'Family',
    'Studies',
    'Existential',
  ];

  const filteredPosts = posts.filter((post) => {
    if (sortTab === 'unanswered' && post.reply_count > 0) return false;
    if (selectedCategory !== 'All' && post.category !== selectedCategory) return false;
    return true;
  });

  filteredPosts.sort((a, b) => {
    if (sortTab === 'most_helped') {
      if (b.reply_count !== a.reply_count) {
        return b.reply_count - a.reply_count;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="min-h-screen bg-[#13151f] text-[#f2f2f5] pt-[110px] sm:pt-[140px] pb-32">
      {/* Centered Column: about 1200px wide, max 90% on small screens */}
      <div className="w-[90%] max-w-[1200px] mx-auto page-fade-drift">
        
        {/* Header & Controls */}
        <div className="mb-10 sm:mb-14">
          <div className="text-[12px] uppercase tracking-[0.22em] font-medium text-[#7c8299] mb-4">
            ALL PROBLEMS
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-6 pb-6 border-b border-[rgba(255,255,255,0.10)]">
            <h1 className="font-serif text-[38px] sm:text-[46px] md:text-[54px] font-normal leading-none tracking-[-0.015em]">
              The Public Ledger
            </h1>

            <Link
              href="/share"
              className="btn-outline inline-flex items-center gap-2 self-start sm:self-auto !h-[44px] !px-6 text-[11px]"
            >
              <Plus size={12} className="text-[#f2f2f5]" />
              <span>SHARE A BURDEN</span>
            </Link>
          </div>

          {/* Sorting Tabs & Category Filter */}
          <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Tracked Tabs: LATEST, MOST HELPED, UNANSWERED */}
            <div className="flex items-center gap-5 sm:gap-9 text-[11px] sm:text-[12px] uppercase font-medium tracking-[0.16em] sm:tracking-[0.22em] overflow-x-auto no-scrollbar max-w-full pb-1">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setSortTab('latest');
                }}
                className={`transition-colors duration-250 pb-1 border-b whitespace-nowrap ${
                  sortTab === 'latest'
                    ? 'border-[#f2f2f5] text-[#f2f2f5]'
                    : 'border-transparent text-[#7c8299] hover:text-[#f2f2f5]'
                }`}
              >
                LATEST
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setSortTab('most_helped');
                }}
                className={`transition-colors duration-250 pb-1 border-b whitespace-nowrap ${
                  sortTab === 'most_helped'
                    ? 'border-[#f2f2f5] text-[#f2f2f5]'
                    : 'border-transparent text-[#7c8299] hover:text-[#f2f2f5]'
                }`}
              >
                MOST HELPED
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setSortTab('unanswered');
                }}
                className={`transition-colors duration-250 pb-1 border-b whitespace-nowrap ${
                  sortTab === 'unanswered'
                    ? 'border-[#f2f2f5] text-[#f2f2f5]'
                    : 'border-transparent text-[#7c8299] hover:text-[#f2f2f5]'
                }`}
              >
                UNANSWERED
              </button>
            </div>

            {/* Category Filter Pills (Outline) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedCategory(cat);
                  }}
                  className={`
                    px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] transition-all duration-200 border rounded-[2px] whitespace-nowrap
                    ${
                      selectedCategory === cat
                        ? 'border-white/60 text-[#f2f2f5] bg-white/5'
                        : 'border-[rgba(255,255,255,0.12)] text-[#7c8299] hover:border-white/30 hover:text-[#aab0c4]'
                    }
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List of Problems (Project-List Style: ~117px tall rows, 1px divider, hover 4px shift) */}
        {mounted && filteredPosts.length > 0 ? (
          <div key={`${selectedCategory}-${sortTab}`} className="tab-pane-transition border-t border-[rgba(255,255,255,0.10)] divide-y divide-[rgba(255,255,255,0.10)]">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => {
                  soundEngine.playClick();
                  router.push(`/problems/${post.id}`);
                }}
                className="
                  group relative py-7 sm:py-0 sm:h-[117px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 
                  cursor-pointer transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-1
                "
              >
                {/* Left side: Problem Title (Serif 32px, truncated) */}
                <div className="sm:w-[48%] md:w-[52%] lg:w-[55%] pr-4">
                  <h2 className="font-serif text-[24px] sm:text-[28px] lg:text-[32px] font-normal text-[#f2f2f5] group-hover:text-white transition-colors duration-250 truncate">
                    {post.title || post.body}
                  </h2>
                </div>

                {/* Middle info: Relative Time (Sans 18px dim) & Category (Sans 18px dim) */}
                <div className="flex items-center gap-6 sm:gap-10 text-[14px] sm:text-[18px] text-[#7c8299] font-sans shrink-0">
                  <span className="w-28 sm:w-36 truncate">{formatRelativeTime(post.created_at)}</span>
                  <span className="w-24 sm:w-32 truncate">{post.category}</span>
                </div>

                {/* Right side: Outline Button "READ · N" */}
                <div className="sm:ml-auto self-start sm:self-center shrink-0">
                  <span className="btn-outline inline-flex items-center justify-center !h-[44px] !px-6 text-[12px] group-hover:border-white/60 group-hover:text-white">
                    READ · {post.reply_count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Honest Empty State */
          <div className="py-24 border-t border-[rgba(255,255,255,0.10)] text-center max-w-[500px] mx-auto">
            <p className="font-serif text-[28px] text-[#f2f2f5] mb-3">
              The room is quiet tonight.
            </p>
            <p className="font-sans text-[17px] text-[#aab0c4] leading-[1.7] mb-8">
              No one has posted in this category yet. Be the first to say what is on your mind.
            </p>
            <Link
              href="/share"
              className="btn-outline inline-flex items-center gap-2.5 !h-[50px] !px-8"
            >
              <Plus size={12} className="text-[#f2f2f5]" />
              <span>SHARE A BURDEN</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

