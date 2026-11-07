'use client';

import React, { useState, useEffect } from 'react';
import { ReportItem } from '@/types';
import { communityStore } from '@/lib/store';
import { soundEngine } from '@/lib/soundscape';
import {
  ShieldAlert,
  CheckCircle,
  EyeOff,
  AlertOctagon,
  ArrowLeft,
  Clock,
} from 'lucide-react';

interface ModerationPanelProps {
  onBack: () => void;
  onOpenThread?: (postId: string) => void;
}

export const ModerationPanel: React.FC<ModerationPanelProps> = ({
  onBack,
}) => {
  const [reports, setReports] = useState<ReportItem[]>(() => communityStore.getReports());
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending');

  const refresh = () => {
    setReports(communityStore.getReports());
  };

  useEffect(() => {
    refresh();
    const unsub = communityStore.subscribe(refresh);
    return () => unsub();
  }, []);

  const filteredReports = reports.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const handleAction = (
    reportId: string,
    action: 'dismiss' | 'hide_content' | 'penalize_and_hide'
  ) => {
    communityStore.resolveReport(reportId, action);
    soundEngine.playClick();
    refresh();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between text-xs">
        <button
          onClick={() => {
            soundEngine.playClick();
            onBack();
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 border border-[rgba(233,236,238,0.12)] bg-[#13151f] text-[#8ea3b5] hover:text-white transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Back to My Corner</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 border border-purple-500/30 bg-purple-950/20 text-purple-300 text-xs">
          <ShieldAlert size={13} />
          <span>Moderator Panel Active</span>
        </div>
      </div>

      {/* Overview Card */}
      <div className="relative border border-[rgba(233,236,238,0.12)] bg-[#13151f] p-6 text-[#e9ecee]">
        <h1 className="text-base font-serif font-normal text-white mb-1">
          Community Care & Moderation
        </h1>
        <p className="text-xs text-[#aab9c7] font-sans max-w-2xl leading-relaxed">
          Reports submitted by community members. Content that reaches 3 flags is automatically hidden pending moderator review. Real identities remain sealed.
        </p>

        {/* Filter Tabs */}
        <div className="mt-5 flex items-center gap-2 pt-4 border-t border-[rgba(233,236,238,0.08)] text-xs">
          <button
            onClick={() => {
              soundEngine.playClick();
              setFilter('pending');
            }}
            className={`px-3 py-1 border transition-colors ${
              filter === 'pending'
                ? 'border-purple-400 bg-purple-950/40 text-purple-200 font-medium'
                : 'border-transparent text-[#8ea3b5] hover:text-[#e9ecee]'
            }`}
          >
            Pending Review ({reports.filter((r) => r.status === 'pending').length})
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setFilter('resolved');
            }}
            className={`px-3 py-1 border transition-colors ${
              filter === 'resolved'
                ? 'border-purple-400 bg-purple-950/40 text-purple-200 font-medium'
                : 'border-transparent text-[#8ea3b5] hover:text-[#e9ecee]'
            }`}
          >
            Resolved ({reports.filter((r) => r.status === 'resolved' || r.status === 'dismissed').length})
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setFilter('all');
            }}
            className={`px-3 py-1 border transition-colors ${
              filter === 'all'
                ? 'border-purple-400 bg-purple-950/40 text-purple-200 font-medium'
                : 'border-transparent text-[#8ea3b5] hover:text-[#e9ecee]'
            }`}
          >
            All Reports ({reports.length})
          </button>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[rgba(233,236,238,0.08)] bg-[#13151f]/40 p-8">
          <CheckCircle size={24} className="mx-auto text-emerald-400 mb-2" />
          <p className="text-xs text-[#aab9c7]">
            No pending reports in this queue.
          </p>
          <p className="mt-1 text-[11px] text-[#8ea3b5]">
            The community is tranquil and respectful.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="border border-[rgba(233,236,238,0.08)] bg-[#13151f] p-5 text-[#e9ecee] space-y-3 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] border ${
                      report.reason === 'unsafe_advice'
                        ? 'bg-rose-950/50 text-rose-300 border-rose-800'
                        : report.reason === 'doxxing'
                        ? 'bg-amber-950/50 text-amber-300 border-amber-800'
                        : 'bg-purple-950/50 text-purple-300 border-purple-800'
                    }`}
                  >
                    {report.reason.replace('_', ' ')}
                  </span>

                  <span className="text-[11px] text-[#8ea3b5]">
                    Type: <strong className="text-[#e9ecee] capitalize">{report.target_type}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[#8ea3b5]">
                  <Clock size={11} />
                  <span>{new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span
                    className={`px-1.5 py-0.2 border text-[10px] capitalize ${
                      report.status === 'pending'
                        ? 'border-amber-500/50 text-amber-300 bg-amber-950/30'
                        : 'border-emerald-500/50 text-emerald-300 bg-emerald-950/30'
                    }`}
                  >
                    {report.status}
                  </span>
                </div>
              </div>

              {report.target_preview && (
                <blockquote className="border-l border-[rgba(233,236,238,0.2)] bg-[#0e1017] p-2.5 text-xs text-[#aab9c7] italic line-clamp-2">
                  "{report.target_preview}"
                </blockquote>
              )}

              {report.details && (
                <p className="text-xs text-[#aab9c7] font-sans">
                  <span className="text-[#8ea3b5]">Context:</span> {report.details}
                </p>
              )}

              {report.status === 'pending' && (
                <div className="pt-2 border-t border-[rgba(233,236,238,0.06)] flex flex-wrap items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => handleAction(report.id, 'dismiss')}
                    className="px-3 py-1.5 border border-[rgba(233,236,238,0.12)] text-[#8ea3b5] hover:text-white hover:border-[rgba(233,236,238,0.25)] transition-colors"
                  >
                    Dismiss (Safe)
                  </button>

                  <button
                    onClick={() => handleAction(report.id, 'hide_content')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 transition-colors"
                  >
                    <EyeOff size={12} />
                    <span>Hide Content</span>
                  </button>

                  <button
                    onClick={() => handleAction(report.id, 'penalize_and_hide')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-500/60 text-rose-300 hover:bg-rose-500/10 transition-colors"
                  >
                    <AlertOctagon size={12} />
                    <span>Remove & Penalize (-5 pts)</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
