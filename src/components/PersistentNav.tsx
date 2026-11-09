'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export const PersistentNav: React.FC = () => {
  const pathname = usePathname();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);

  // Do not show on Home ("The Room")
  const isHomePage = pathname === '/';

  useEffect(() => {
    if (isHomePage) return;

    const checkScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 150) {
        setIsScrollable(true);
        const scrolled = (window.scrollY / scrollHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, scrolled)));
      } else {
        setIsScrollable(false);
      }
    };

    checkScroll();
    window.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      window.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [pathname, isHomePage]);

  if (isHomePage) return null;

  return (
    <>
      {/* Persistent Bottom-Left Button: "← BACK TO THE ROOM" (53px from left, 45px from bottom) */}
      <div className="fixed bottom-[35px] sm:bottom-[45px] left-6 sm:left-[53px] z-40">
        <Link
          href="/"
          className="btn-outline inline-flex items-center gap-2.5 !h-[48px] sm:!h-[50px] !px-5 sm:!px-7"
          title="Return to the full-viewport Room"
        >
          <ArrowLeft size={13} className="shrink-0 -ml-1 text-[#f2f2f5]" />
          <span>BACK TO THE ROOM</span>
        </Link>
      </div>

      {/* Persistent Bottom-Right 1px Vertical Scroll Indicator Line (100px tall, 46px from edge) */}
      {isScrollable && (
        <div
          className="fixed bottom-[45px] right-[46px] w-[1px] h-[100px] bg-white/10 z-40 hidden md:block select-none pointer-events-none"
          aria-hidden="true"
        >
          {/* Active scroll tracker tick */}
          <div
            className="w-[2px] -left-[0.5px] bg-white/70 absolute transition-all duration-75"
            style={{
              height: '24px',
              top: `${(scrollProgress * (100 - 24)) / 100}%`,
            }}
          />
        </div>
      )}
    </>
  );
};

