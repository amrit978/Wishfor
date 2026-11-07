'use client';

import React, { useState, useEffect } from 'react';
import { communityStore } from '@/lib/store';
import { soundEngine } from '@/lib/soundscape';
import { NotificationItem, CurrentUser } from '@/types';
import { Bell, Plus, CheckCheck, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentView: 'feed' | 'my-space' | 'moderation';
  onNavigate: (view: 'feed' | 'my-space' | 'moderation') => void;
  onOpenNewPost: () => void;
  onOpenGuidelines: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenNewPost,
  onOpenGuidelines,
}) => {
  const [user, setUser] = useState<CurrentUser>(() => communityStore.getCurrentUser());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    communityStore.getNotifications()
  );
  const [showNotifs, setShowNotifs] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    const unsub = communityStore.subscribe(() => {
      setUser(communityStore.getCurrentUser());
      setNotifications(communityStore.getNotifications());
    });
    return () => unsub();
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleToggleSound = () => {
    const state = soundEngine.toggleAmbient();
    setIsPlayingAudio(state);
  };

  const handleMarkAllRead = () => {
    communityStore.markAllNotificationsAsRead();
    soundEngine.playClick();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(233,236,238,0.08)] bg-[#13151f]/90 backdrop-blur-md text-[#e9ecee]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-6">
        {/* Left: Gentle logo */}
        <div
          onClick={() => {
            soundEngine.playClick();
            onNavigate('feed');
          }}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          {/* Subtle minimal geometric glyph */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#e5ab37] transition-transform group-hover:scale-105">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 3" opacity="0.6" />
            <path d="M12 7 C10 10 10 13 12 16 C14 13 14 10 12 7 Z" fill="currentColor" opacity="0.9" />
          </svg>

          <div>
            <span className="text-sm font-serif tracking-normal text-[#e9ecee] group-hover:text-white transition-colors">
              WishFor
            </span>
            <span className="hidden sm:inline-block text-[11px] text-[#8ea3b5] ml-2 font-sans font-normal">
              Say it. Someone's listening.
            </span>
          </div>
        </div>

        {/* Center: Friendly, clear navigation */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-sans font-normal text-[#aab9c7]">
          <button
            onClick={() => {
              soundEngine.playClick();
              onNavigate('feed');
            }}
            className={`transition-colors hover:text-white ${
              currentView === 'feed' ? 'text-white font-medium' : ''
            }`}
          >
            The Room
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onNavigate('my-space');
            }}
            className={`transition-colors hover:text-white ${
              currentView === 'my-space' ? 'text-white font-medium' : ''
            }`}
          >
            My Corner
          </button>

          {user.role === 'moderator' && (
            <button
              onClick={() => {
                soundEngine.playClick();
                onNavigate('moderation');
              }}
              className={`transition-colors hover:text-white ${
                currentView === 'moderation' ? 'text-white font-medium' : 'text-purple-300'
              }`}
            >
              Moderation
            </button>
          )}

          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenGuidelines();
            }}
            className="transition-colors hover:text-white text-[#8ea3b5]"
          >
            Guidelines
          </button>
        </nav>

        {/* Right: Sound Toggle + Share button */}
        <div className="flex items-center gap-5">
          {/* Overworld-inspired Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="flex items-center gap-2 text-xs font-sans tracking-wide text-[#aab9c7] hover:text-white transition-colors cursor-pointer select-none"
            aria-label="Toggle ambient room sound"
            title="Calm ambient room tone (55Hz drone)"
          >
            <span className="text-[11px]">
              Sound <span className={isPlayingAudio ? 'text-[#e5ab37] font-medium' : 'text-[#8ea3b5]'}>{isPlayingAudio ? 'on' : 'off'}</span>
            </span>

            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
              {isPlayingAudio ? (
                <path d="M7 12 Q9.5 8 12 12 T17 12" stroke="#e5ab37" strokeWidth="1.2" strokeLinecap="round" />
              ) : (
                <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
              )}
            </svg>
          </button>

          {/* Clean Human Button */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenNewPost();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[rgba(233,236,238,0.22)] hover:border-white text-xs font-sans text-[#e9ecee] transition-all hover:bg-white/5 active:scale-95"
          >
            <Plus size={13} />
            <span>Share a problem</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                soundEngine.playClick();
                setShowNotifs(!showNotifs);
              }}
              className="text-[#aab9c7] hover:text-white transition-colors p-1"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-[#e5ab37]" />
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-3 w-80 border border-[rgba(233,236,238,0.15)] bg-[#13151f] p-4 text-[#e9ecee] shadow-2xl z-50 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-[rgba(233,236,238,0.08)] text-xs font-medium">
                  <span className="text-[#aab9c7]">Notifications ({unreadCount})</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-[#e5ab37] hover:underline flex items-center gap-1"
                    >
                      <CheckCheck size={11} />
                      <span>Mark read</span>
                    </button>
                  )}
                </div>

                <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-center py-6 text-xs text-[#8ea3b5]">
                      No new notifications right now.
                    </p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-2.5 border text-xs transition-colors ${
                          notif.is_read
                            ? 'border-[rgba(233,236,238,0.05)] bg-[#0e1017] text-[#aab9c7]'
                            : 'border-[rgba(233,236,238,0.15)] bg-[#1a1c28] text-[#e9ecee]'
                        }`}
                      >
                        <p className="leading-relaxed">{notif.message}</p>
                        <span className="text-[10px] text-[#8ea3b5] mt-1 block">
                          {new Date(notif.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
