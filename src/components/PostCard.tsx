'use client';

import React, { useState } from 'react';
import { Post } from '@/types';
import { MaskAvatar } from './MaskAvatar';
import { TrustBadge } from './TrustBadge';
import { ReportModal } from './ReportModal';
import { communityStore } from '@/lib/store';
import { soundEngine } from '@/lib/soundscape';
import {
  MessageSquare,
  Bookmark,
  Flag,
  Trash2,
  CheckCircle2,
  Flame,
  Share2,
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  onOpenThread: (postId: string) => void;
  onDeleted?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onOpenThread,
  onDeleted,
}) => {
  const [isSaved, setIsSaved] = useState(post.is_saved || false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showCopyNotice, setShowCopyNotice] = useState(false);

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = communityStore.toggleBookmark(post.id);
    setIsSaved(updated);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete your post? This cannot be undone.')) {
      communityStore.deletePost(post.id);
      if (onDeleted) onDeleted(post.id);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + `?post=${post.id}`);
      setShowCopyNotice(true);
      setTimeout(() => setShowCopyNotice(false), 2000);
    }
  };

  const formatTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(diff / (3600 * 1000));
    const days = Math.floor(diff / (24 * 3600 * 1000));

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <article
      onClick={() => {
        soundEngine.playClick();
        onOpenThread(post.id);
      }}
      className="group cursor-pointer border border-[rgba(233,236,238,0.08)] bg-[#13151f] hover:bg-[#161824] hover:border-[rgba(233,236,238,0.2)] p-6 transition-all duration-200 text-[#e9ecee] flex flex-col justify-between"
    >
      <div>
        {/* Top Minimal Meta Header */}
        <div className="flex items-center justify-between gap-3 mb-4 text-xs">
          <div className="flex items-center gap-3">
            <MaskAvatar
              name={post.mask_name}
              seed={post.mask_seed}
              size="md"
              isAsker={post.is_asker}
            />

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-[#e9ecee] group-hover:text-white transition-colors">
                  {post.mask_name}
                </span>

                <span className="text-[11px] text-[#e5ab37] font-medium font-sans">
                  Author
                </span>

                <TrustBadge level={post.trust_level} />
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#8ea3b5] mt-0.5">
                <span>{post.category}</span>
                <span>•</span>
                <span>{formatTime(post.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            {post.is_urgent && (
              <span className="text-rose-300 border border-rose-800/50 bg-rose-950/20 px-1.5 py-0.5 rounded-sm">
                Needs support
              </span>
            )}
            {post.helped_reply_id && (
              <span className="text-emerald-300 border border-emerald-800/50 bg-emerald-950/20 px-1.5 py-0.5 rounded-sm">
                Found help
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        {post.title && (
          <h3 className="font-serif text-lg font-normal text-[#e9ecee] mb-2 leading-snug group-hover:text-white transition-colors">
            {post.title}
          </h3>
        )}

        {/* Body preview */}
        <p className="text-xs sm:text-sm text-[#aab9c7] leading-relaxed font-sans line-clamp-3 sm:line-clamp-4 whitespace-pre-line mb-6 font-normal">
          {post.body}
        </p>
      </div>

      {/* Minimal Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[rgba(233,236,238,0.06)] text-xs text-[#6e8799]">
        <div className="flex items-center gap-1.5 text-[#aab9c7] group-hover:text-white transition-colors">
          <MessageSquare size={13} />
          <span>
            {post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleShare}
            className="p-1 hover:text-white transition-colors relative"
            title="Share whisper link"
          >
            <Share2 size={13} />
            {showCopyNotice && (
              <span className="absolute -top-7 right-0 text-[10px] bg-[#1a1c28] px-2 py-0.5 border border-[rgba(233,236,238,0.2)] text-[#e9ecee] whitespace-nowrap shadow-md">
                Copied link
              </span>
            )}
          </button>

          <button
            onClick={handleToggleBookmark}
            className={`p-1 transition-colors ${
              isSaved ? 'text-[#e5ab37]' : 'hover:text-white'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save whisper'}
          >
            <Bookmark size={13} fill={isSaved ? 'currentColor' : 'none'} />
          </button>

          <button
            onClick={() => setIsReportOpen(true)}
            className="p-1 hover:text-rose-400 transition-colors"
            title="Report"
          >
            <Flag size={13} />
          </button>

          {post.is_author && (
            <button
              onClick={handleDelete}
              className="p-1 hover:text-rose-400 transition-colors ml-1"
              title="Delete whisper"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="post"
        targetId={post.id}
        previewText={post.title || post.body}
      />
    </article>
  );
};
