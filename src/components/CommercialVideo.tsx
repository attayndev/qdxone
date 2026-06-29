"use client";

/**
 * The QDXone commercial (hosted on YouTube). A click-to-play facade: only the
 * thumbnail loads on page view; YouTube's player iframe loads on click. Keeps the
 * homepage fast and avoids autoplay competing with the hero CTA.
 */

import { useState } from "react";

const VIDEO_ID = "XPEMA4BkPRA";

export function CommercialVideo({
  heading,
  sub,
  className = "",
}: {
  heading?: string;
  sub?: string;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <section className={`px-4 sm:px-6 py-10 sm:py-14 ${className}`}>
      <div className="max-w-3xl mx-auto text-center">
        {heading && (
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{heading}</h2>
        )}
        {sub && (
          <p className="mt-2 text-[color:var(--brand-ink-muted)] max-w-xl mx-auto">{sub}</p>
        )}
        <div className="mt-6 relative rounded-2xl overflow-hidden border border-[color:var(--brand-line)] shadow-xl bg-black aspect-video">
          {playing ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`}
              title="QDX One"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label="Play the QDX One video"
              className="group absolute inset-0 h-full w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`}
                onError={(e) => {
                  e.currentTarget.src = `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`;
                }}
                alt="Watch the QDX One video"
                className="h-full w-full object-cover transition group-hover:opacity-90"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--brand-pink)] shadow-lg transition group-hover:scale-105">
                  <span className="ml-1 block border-y-[10px] border-l-[16px] border-y-transparent border-l-white" />
                </span>
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
