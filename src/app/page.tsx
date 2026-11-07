'use client';

import React, { useState, useEffect } from 'react';
import { Post, Category } from '@/types';
import { communityStore } from '@/lib/store';
import { soundEngine } from '@/lib/soundscape';
import { Header } from '@/components/Header';
import { PostCard } from '@/components/PostCard';
import { ThreadView } from '@/components/ThreadView';
import { MySpaceView } from '@/components/MySpaceView';
import { ModerationPanel } from '@/components/ModerationPanel';
import { PostFormModal } from '@/components/PostFormModal';
import { GuidelinesModal } from '@/components/GuidelinesModal';
import { SpatialCanvas } from '@/components/SpatialCanvas';
import { RadarView } from '@/components/RadarView';
import { Search, Plus, LayoutGrid, Radio } from 'lucide-react';

export default function Home() {
  const [currentView, setCurrentView] = useState<'feed' | 'my-space' | 'moderation'>('feed');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [feedTab, setFeedTab] = useState<'latest' | 'trending' | 'unanswered'>('latest');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [displayMode, setDisplayMode] = useState<'grid' | 'radar'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

  // Live posts
  const [posts, setPosts] = useState<Post[]>([]);

  const refreshPosts = () => {
    setPosts(communityStore.getPosts());
  };

  useEffect(() => {
    refreshPosts();
    const unsub = communityStore.subscribe(refreshPosts);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const postParam = params.get('post');
      if (postParam) {
        setSelectedPostId(postParam);
      }
    }
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
    if (feedTab === 'unanswered' && post.reply_count > 0) return false;
    if (selectedCategory !== 'All' && post.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = post.title?.toLowerCase().includes(q);
      const matchBody = post.body.toLowerCase().includes(q);
      const matchCategory = post.category.toLowerCase().includes(q);
      const matchMask = post.mask_name.toLowerCase().includes(q);
      if (!matchTitle && !matchBody && !matchCategory && !matchMask) return false;
    }
    return true;
  });

  filteredPosts.sort((a, b) => {
    if (feedTab === 'trending') {
      if (b.reply_count !== a.reply_count) {
        return b.reply_count - a.reply_count;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleOpenThread = (postId: string) => {
    setSelectedPostId(postId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToFeed = () => {
    setSelectedPostId(null);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#13151f] text-[#e9ecee] selection:bg-[#e5ab37] selection:text-[#13151f] relative">
      <SpatialCanvas />

      {/* Sleek Minimalist Header */}
      <Header
        currentView={currentView}
        onNavigate={(view) => {
          setSelectedPostId(null);
          setCurrentView(view);
        }}
        onOpenNewPost={() => setIsNewPostOpen(true)}
        onOpenGuidelines={() => setIsGuidelinesOpen(true)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-5 sm:px-8 py-8 sm:py-12 relative z-10">
        {selectedPostId ? (
          <ThreadView
            postId={selectedPostId}
            onBack={handleBackToFeed}
            onPostDeleted={handleBackToFeed}
          />
        ) : currentView === 'my-space' ? (
          <MySpaceView
            onOpenThread={handleOpenThread}
            onOpenModeration={() => setCurrentView('moderation')}
          />
        ) : currentView === 'moderation' ? (
          <ModerationPanel
            onBack={() => setCurrentView('feed')}
            onOpenThread={handleOpenThread}
          />
        ) : (
          /* Main Minimalist Feed */
          <div className="space-y-12">
            {/* Humanized Hero - Warm, Quiet & Uncluttered */}
            <section className="space-y-4 pt-4 sm:pt-8 max-w-2xl">
              <div className="text-xs font-sans tracking-wide text-[#e5ab37]">
                Anonymous Peer Help • Safe & Confidential
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#e9ecee] leading-[1.15] tracking-tight">
                Say it. <br />
                <span className="text-[#aab9c7] italic">Someone is listening.</span>
              </h1>

              <p className="text-sm text-[#aab9c7] font-normal leading-relaxed">
                A quiet room where everyone wears a mask. No real names, no profiles, and no judgment. Share whatever weighs on you—career panic, family heartbreak, loneliness, quiet doubts—and kind strangers will reply.
              </p>
            </section>

            {/* Minimalist Filter Navigation */}
            <div className="border-t border-b border-[rgba(233,236,238,0.08)] py-3 space-y-3">
              {/* Top row: Categories (Minimal horizontal list) */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-6 overflow-x-auto no-scrollbar text-xs font-medium">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedCategory(cat);
                      }}
                      className={`whitespace-nowrap transition-colors text-xs pb-1 border-b ${
                        selectedCategory === cat
                          ? 'border-[#e5ab37] text-white font-semibold'
                          : 'border-transparent text-[#8ea3b5] hover:text-[#e9ecee]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search Bar (Minimalist inline) */}
                <div className="relative w-full sm:w-56">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8ea3b5]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search stories & advice..."
                    className="w-full pl-8 pr-3 py-1 bg-transparent border-b border-[rgba(233,236,238,0.12)] text-xs text-[#e9ecee] placeholder-[#8ea3b5] focus:border-[#e5ab37] focus:outline-none transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-[#8ea3b5] hover:text-white"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom row: Sort Options & View Toggle */}
              <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
                <div className="flex items-center gap-5 text-xs text-[#8ea3b5]">
                  <span>Show:</span>
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      setFeedTab('latest');
                    }}
                    className={`transition-colors ${
                      feedTab === 'latest' ? 'text-[#e9ecee] underline underline-offset-4 font-medium' : 'hover:text-[#aab9c7]'
                    }`}
                  >
                    Latest
                  </button>
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      setFeedTab('trending');
                    }}
                    className={`transition-colors ${
                      feedTab === 'trending' ? 'text-[#e9ecee] underline underline-offset-4 font-medium' : 'hover:text-[#aab9c7]'
                    }`}
                  >
                    Most helpful
                  </button>
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      setFeedTab('unanswered');
                    }}
                    className={`transition-colors ${
                      feedTab === 'unanswered' ? 'text-[#e9ecee] underline underline-offset-4 font-medium' : 'hover:text-[#aab9c7]'
                    }`}
                  >
                    Waiting for a reply
                  </button>
                </div>

                {/* Display Mode Switcher */}
                <div className="flex items-center gap-4 text-xs text-[#8ea3b5]">
                  <span>View:</span>
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      setDisplayMode('grid');
                    }}
                    className={`inline-flex items-center gap-1.5 transition-colors ${
                      displayMode === 'grid' ? 'text-[#e9ecee] underline underline-offset-4 font-medium' : 'hover:text-[#aab9c7]'
                    }`}
                  >
                    <LayoutGrid size={12} />
                    <span>Stories</span>
                  </button>
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      setDisplayMode('radar');
                    }}
                    className={`inline-flex items-center gap-1.5 transition-colors ${
                      displayMode === 'radar' ? 'text-[#e5ab37] underline underline-offset-4 font-medium' : 'hover:text-[#aab9c7]'
                    }`}
                  >
                    <Radio size={12} />
                    <span>The Night Sky</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Transmissions View: Radar Map or Minimal Cards */}
            {displayMode === 'radar' ? (
              <RadarView posts={filteredPosts} onOpenThread={handleOpenThread} />
            ) : filteredPosts.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-[rgba(233,236,238,0.08)] p-8">
                <p className="text-base text-[#e9ecee] font-serif">
                  The room is quiet right now.
                </p>
                <p className="mt-1 text-xs text-[#8ea3b5]">
                  If there is something weighing on you, feel free to speak first.
                </p>
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setIsNewPostOpen(true);
                  }}
                  className="mt-4 px-4 py-2 border border-[rgba(233,236,238,0.22)] hover:border-white text-xs text-[#e9ecee] transition-colors"
                >
                  + Share what's on your mind
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onOpenThread={handleOpenThread}
                    onDeleted={() => refreshPosts()}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="mt-auto border-t border-[rgba(233,236,238,0.08)] py-8 text-xs text-[#6e8799] relative z-10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#e9ecee]">WishFor</span>
            <span>—</span>
            <span>Anonymous Peer Sanctuary</span>
          </div>

          <div className="flex items-center gap-6 text-[11px] tracking-wider uppercase">
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsGuidelinesOpen(true);
              }}
              className="hover:text-white transition-colors"
            >
              Rules
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsGuidelinesOpen(true);
              }}
              className="hover:text-white transition-colors"
            >
              Helplines
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                communityStore.resetToSeed();
                window.location.reload();
              }}
              className="hover:text-white transition-colors"
            >
              Reset Demo
            </button>
          </div>
        </div>
      </footer>

      {/* Modal */}
      <PostFormModal
        isOpen={isNewPostOpen}
        onClose={() => setIsNewPostOpen(false)}
        onCreated={(newId) => {
          refreshPosts();
          setSelectedPostId(newId);
        }}
      />

      {/* Guidelines Modal */}
      <GuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />
    </div>
  );
}
