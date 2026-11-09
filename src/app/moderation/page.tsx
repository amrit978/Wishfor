'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReportItem } from '@/types';
import { communityStore } from '@/lib/store';
import { soundEngine } from '@/lib/soundscape';
import { SplitLayout } from '@/components/SplitLayout';
import { ShieldAlert, CheckCircle, EyeOff, AlertOctagon } from 'lucide-react';

export default function ModerationPage() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [filter, setFilter] = useState<'pending' | 'resolved' | 'all'>('pending');
  const [mounted, setMounted] = useState(false);

  const loadData = () => {
    setReports(communityStore.getReports());
  };

  useEffect(() => {
    setMounted(true);
    loadData();
    const unsub = communityStore.subscribe(loadData);
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
    loadData();
  };

  if (!mounted) return null;

  return (
    <SplitLayout eyebrow="SECURITY" title="Moderator Review">
      <div className="space-y-10 max-w-[680px]">
        
        {/* Filters */}
        <div className="flex items-center gap-6 text-[12px] uppercase tracking-[0.22em] font-medium border-b border-[rgba(255,255,255,0.10)] pb-4">
          <button
            onClick={() => setFilter('pending')}
            className={`transition-colors ${filter === 'pending' ? 'text-white' : 'text-[#7c8299] hover:text-white'}`}
          >
            PENDING ({reports.filter((r) => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`transition-colors ${filter === 'resolved' ? 'text-white' : 'text-[#7c8299] hover:text-white'}`}
          >
            RESOLVED ({reports.filter((r) => r.status === 'resolved').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`transition-colors ${filter === 'all' ? 'text-white' : 'text-[#7c8299] hover:text-white'}`}
          >
            ALL
          </button>
        </div>

        {/* Reports list */}
        {filteredReports.length > 0 ? (
          <div className="divide-y divide-[rgba(255,255,255,0.10)]">
            {filteredReports.map((report) => (
              <div key={report.id} className="py-6 space-y-4">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-[#7c8299]">
                  <span className="text-[#e2869a]">REASON: {report.reason.replace('_', ' ')}</span>
                  <span>TARGET: {report.target_type.toUpperCase()}</span>
                </div>

                <div className="p-4 border border-[rgba(255,255,255,0.10)] bg-white/[0.02] text-sm text-[#aab0c4] font-sans">
                  Target ID: <span className="text-white font-mono">{report.target_id}</span>
                </div>

                {report.status === 'pending' && (
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => handleAction(report.id, 'dismiss')}
                      className="btn-outline !h-[38px] !px-4 text-[11px]"
                    >
                      DISMISS
                    </button>
                    <button
                      onClick={() => handleAction(report.id, 'hide_content')}
                      className="btn-outline !h-[38px] !px-4 text-[11px] text-[#e5ab37] border-[#e5ab37]/40"
                    >
                      HIDE CONTENT
                    </button>
                    <button
                      onClick={() => handleAction(report.id, 'penalize_and_hide')}
                      className="btn-outline !h-[38px] !px-4 text-[11px] text-[#e2869a] border-[#e2869a]/40"
                    >
                      PENALIZE & HIDE
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-[#7c8299] font-sans text-[16px]">
            No flagged content pending review. The community is tranquil.
          </div>
        )}
      </div>
    </SplitLayout>
  );
}

