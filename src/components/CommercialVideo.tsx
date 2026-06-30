/**
 * The QDXone commercial, self-hosted on Cloudflare R2 and served by the Worker
 * at /media/qdxone.mp4 (Range-enabled, edge-cached). `preload="metadata"` keeps
 * the page light — only a few KB of headers load until the visitor hits play —
 * so it doesn't compete with the hero CTA. No third-party embed, no cookies.
 */

const VIDEO_SRC = "/media/qdxone.mp4";

export function CommercialVideo({
  heading,
  sub,
  className = "",
}: {
  heading?: string;
  sub?: string;
  className?: string;
}) {
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
          <video
            className="absolute inset-0 h-full w-full"
            src={VIDEO_SRC}
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload"
          >
            <p className="text-white p-4">
              Your browser can’t play this video.{" "}
              <a href={VIDEO_SRC} className="underline">
                Download it
              </a>{" "}
              instead.
            </p>
          </video>
        </div>
      </div>
    </section>
  );
}
