'use client';

import React, { useState } from 'react';
import { Post, Reply, CurrentUser } from '@/types';
import { communityStore } from '@/lib/store';
import { soundEngine } from '@/lib/soundscape';
import { MaskAvatar } from './MaskAvatar';
import { TrustBadge } from './TrustBadge';
import { PostCard } from './PostCard';
import { ShieldCheck, ArrowRight, Heart, Sparkles } from 'lucide-react';

interface MySpaceViewProps {
  onOpenThread: (postId: string) => void;
  onOpenModeration?: () => void;
}

export const MySpaceView: React.FC<MySpaceViewProps> = ({
  onOpenThread,
  onOpenModeration,
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'saved'>('posts');
  const user = communityStore.getCurrentUser();
  const allPosts = communityStore.getPosts();
  const allReplies = communityStore.getAllReplies();
  const bookmarks = communityStore.getBookmarks();

  const myPosts = allPosts.filter((p) => p.is_author);
  const myReplies = allReplies.filter((r) => r.is_author);
  const savedPosts = allPosts.filter((p) => bookmarks.includes(p.id));

  const toggleRole = () => {
    soundEngine.playClick();
    const nextRole = user.role === 'moderator' ? 'user' : 'moderator';
    communityStore.switchRole(nextRole);
  };

  const getNextBadgeThreshold = () => {
    if (user.trust_score < 5) return { next: 'Listener', needed: 5 - user.trust_score };
    if (user.trust_score < 20) return { next: 'Helper', needed: 20 - user.trust_score };
    if (user.trust_score < 50) return { next: 'Guide', needed: 50 - user.trust_score };
    if (user.trust_score < 100) return { next: 'Trusted Voice', needed: 100 - user.trust_score };
    return { next: 'Max Standing', needed: 0 };
  };

  const nextGoal = getNextBadgeThreshold();

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-24 animate-in fade-in duration-200">
      {/* Top Chamber Header */}
      <div className="border-b border-[rgba(233,236,238,0.08)] pb-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-[#e5ab37] font-medium font-sans">
              Your Private Corner • Only visible to you
            </div>
            <h1 className="font-serif text-3xl font-normal text-[#e9ecee] mt-1">
              My Corner
            </h1>
            <p className="text-xs text-[#aab9c7] mt-1 max-w-lg leading-relaxed">
              Your mask identity changes in every conversation so no one can connect your posts, but your helpfulness points follow your account.
            </p>
          </div>

          {/* Moderator Role Switcher for Test Evaluation */}
          <button
            onClick={toggleRole}
            className={`px-3 py-1.5 border text-xs font-sans transition-all ${
              user.role === 'moderator'
                ? 'border-purple-400 text-purple-300 bg-purple-950/20'
                : 'border-[rgba(233,236,238,0.15)] text-[#8ea3b5] hover:border-white hover:text-white'
            }`}
          >
            <ShieldCheck size={12} className="inline mr-1.5" />
            <span>{user.role === 'moderator' ? 'Moderator Mode Active' : 'Switch to Moderator'}</span>
          </button>
        </div>

        {/* Human Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-xs">
          <div>
            <p className="text-xs text-[#8ea3b5] font-medium mb-2">
              Community Standing
            </p>
            <TrustBadge level={user.trust_level} />
            <p className="text-[11px] text-[#8ea3b5] mt-2 font-sans leading-normal">
              Only this tier badge is displayed beside your mask.
            </p>
          </div>

          <div>
            <p className="text-xs text-[#8ea3b5] font-medium mb-1">
              Trust Points
            </p>
            <div className="text-2xl font-semibold text-[#e5ab37]">
              {user.trust_score} <span className="text-xs font-normal text-[#aab9c7]">points</span>
            </div>
            <p className="text-[11px] text-[#8ea3b5] mt-1 font-sans">
              {nextGoal.needed > 0
                ? `${nextGoal.needed} more points to reach ${nextGoal.next}`
                : 'Highest standing tier reached.'}
            </p>
          </div>

          <div>
            <p className="text-xs text-[#8ea3b5] font-medium mb-1">
              How Points Grow
            </p>
            <ul className="text-[11px] text-[#aab9c7] space-y-1 font-sans">
              <li>• +1 when someone likes your advice</li>
              <li>• +5 when an author marks your advice most helpful</li>
              <li>• +1 for every safe, helpful reply</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-[rgba(233,236,238,0.08)] pb-3 text-xs font-medium">
        <button
          onClick={() => {
            soundEngine.playClick();
            setActiveTab('posts');
          }}
          className={`transition-colors pb-1 border-b ${
            activeTab === 'posts'
              ? 'border-[#e5ab37] text-white font-medium'
              : 'border-transparent text-[#8ea3b5] hover:text-[#e9ecee]'
          }`}
        >
          My Posts ({myPosts.length})
        </button>

        <button
          onClick={() => {
            soundEngine.playClick();
            setActiveTab('replies');
          }}
          className={`transition-colors pb-1 border-b ${
            activeTab === 'replies'
              ? 'border-[#e5ab37] text-white font-medium'
              : 'border-transparent text-[#8ea3b5] hover:text-[#e9ecee]'
          }`}
        >
          My Advice ({myReplies.length})
        </button>

        <button
          onClick={() => {
            soundEngine.playClick();
            setActiveTab('saved');
          }}
          className={`transition-colors pb-1 border-b ${
            activeTab === 'saved'
              ? 'border-[#e5ab37] text-white font-medium'
              : 'border-transparent text-[#8ea3b5] hover:text-[#e9ecee]'
          }`}
        >
          Saved Stories ({savedPosts.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {myPosts.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-[rgba(233,236,238,0.08)] p-8 text-xs text-[#8ea3b5]">
              <p>You haven't shared a problem yet.</p>
            </div>
          ) : (
            myPosts.map((post) => (
              <div key={post.id} className="relative">
                {post.status === 'draft' && (
                  <span className="absolute -top-2.5 right-4 z-10 px-2 py-0.5 text-[10px] bg-[#e5ab37] text-black font-semibold rounded-sm">
                    Draft
                  </span>
                )}
                <PostCard post={post} onOpenThread={onOpenThread} />
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'replies' && (
        <div className="space-y-3">
          {myReplies.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-[rgba(233,236,238,0.08)] p-8 text-xs text-[#8ea3b5]">
              <p>You haven't replied to anyone yet. Visit the room to see if someone needs your perspective.</p>
            </div>
          ) : (
            myReplies.map((reply) => (
              <div
                key={reply.id}
                onClick={() => {
                  soundEngine.playClick();
                  onOpenThread(reply.post_id);
                }}
                className="cursor-pointer border border-[rgba(233,236,238,0.08)] bg-[#13151f] hover:bg-[#161824] p-5 transition-all text-[#e9ecee]"
              >
                <div className="flex items-center justify-between mb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <MaskAvatar name={reply.mask_name} seed={reply.mask_seed} size="sm" />
                    <span className="font-medium text-[#e9ecee]">{reply.mask_name}</span>
                    {reply.is_helped && (
                      <span className="text-[11px] text-[#e5ab37] font-sans font-medium">Author found this most helpful</span>
                    )}
                  </div>
                  <span className="text-[#aab9c7] text-xs">
                    {reply.like_count} {reply.like_count === 1 ? 'person helped' : 'people helped'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#aab9c7] line-clamp-3 leading-relaxed mb-3 font-sans">
                  {reply.body}
                </p>

                <div className="flex items-center justify-between text-[11px] text-[#8ea3b5] pt-2 border-t border-[rgba(233,236,238,0.06)]">
                  <span>Open thread</span>
                  <ArrowRight size={11} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="space-y-4">
          {savedPosts.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-[rgba(233,236,238,0.08)] p-8 text-xs text-[#8ea3b5]">
              <p>No saved stories. Tap the bookmark icon on any post to keep it close.</p>
            </div>
          ) : (
            savedPosts.map((post) => (
              <PostCard key={post.id} post={post} onOpenThread={onOpenThread} />
            ))
          )}
        </div>
      )}
    </div>
  );
};
