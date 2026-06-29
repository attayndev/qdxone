/**
 * The QDXone commercial. Hosted in Supabase Storage (public `marketing` bucket),
 * not bundled in the app. Click-to-play with controls — no autoplay, so it never
 * competes with the hero CTA or hurts load time (preload=metadata only).
 */

const VIDEO_URL =
  "https://tctukuzzjxihmqqeoifz.supabase.co/storage/v1/object/public/marketing/qdxone-commercial.mp4";

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
        <div className="mt-6 rounded-2xl overflow-hidden border border-[color:var(--brand-line)] shadow-xl bg-black">
          <video controls preload="metadata" playsInline className="w-full h-auto block">
            <source src={VIDEO_URL} type="video/mp4" />
            Your browser doesn&apos;t support embedded video.
          </video>
        </div>
      </div>
    </section>
  );
}
