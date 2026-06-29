/**
 * Build schema.org `JobPosting` structured data (JSON-LD) for a public posting.
 * Embedding this on the crawlable apply page is what gets a job into Google for
 * Jobs — free, organic reach, no per-post fee. Pure (no I/O); the page resolves
 * the data and renders the <script type="application/ld+json">.
 *
 * Google requires: title, description, datePosted, hiringOrganization,
 * jobLocation (for non-remote). We supply those plus recommended fields
 * (employmentType, identifier, directApply) when we have them.
 */

export interface JobPostingJsonLdInput {
  jobTitle: string;
  /** Role description (plain text or HTML). Falls back to a basic line if empty. */
  description: string | null | undefined;
  datePosted: string; // ISO 8601
  orgName: string;
  orgLogo?: string | null;
  careersUrl: string; // org careers home (hiringOrganization.sameAs)
  jobUrl: string; // this posting's public URL (canonical/identifier)
  location?: {
    streetAddress?: string | null;
    addressLocality?: string | null; // city
    addressRegion?: string | null; // state/region
    postalCode?: string | null;
  } | null;
}

/**
 * Minimal, dependency-free Markdown → HTML for the description. Role descriptions
 * are AI-drafted Markdown; Google for Jobs renders the description as HTML, so
 * raw `#`/`**`/`-` would show literally. Emits only the safe subset Google
 * supports (<p>, <strong>, <em>, <ul>, <li>), HTML-escaping text content.
 */
export function markdownToJobHtml(md: string): string {
  const inline = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  const out: string[] = [];
  let inList = false;
  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };
  for (const raw of md.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      closeList();
      continue;
    }
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (heading) {
      closeList();
      out.push(`<p><strong>${inline(heading[1])}</strong></p>`);
    } else if (bullet) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(bullet[1])}</li>`);
    } else {
      closeList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  return out.join("");
}

export function jobPostingJsonLd(i: JobPostingJsonLdInput): Record<string, unknown> {
  const description =
    i.description && i.description.trim().length > 0
      ? markdownToJobHtml(i.description.trim())
      : `<p>${i.jobTitle} position at ${i.orgName}. Apply now — a short application and a quick assessment.</p>`;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: i.jobTitle,
    description,
    datePosted: i.datePosted,
    employmentType: ["FULL_TIME", "PART_TIME"],
    hiringOrganization: {
      "@type": "Organization",
      name: i.orgName,
      sameAs: i.careersUrl,
      ...(i.orgLogo ? { logo: i.orgLogo } : {}),
    },
    directApply: true,
    identifier: { "@type": "PropertyValue", name: i.orgName, value: i.jobUrl },
  };

  const loc = i.location;
  if (loc && (loc.addressLocality || loc.streetAddress || loc.postalCode)) {
    jsonLd.jobLocation = {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        ...(loc.streetAddress ? { streetAddress: loc.streetAddress } : {}),
        ...(loc.addressLocality ? { addressLocality: loc.addressLocality } : {}),
        ...(loc.addressRegion ? { addressRegion: loc.addressRegion } : {}),
        ...(loc.postalCode ? { postalCode: loc.postalCode } : {}),
        addressCountry: "US",
      },
    };
  }
  return jsonLd;
}

/** Serialize for a <script> tag, escaping `<` so a description can't break out. */
export function jsonLdScript(obj: Record<string, unknown>): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}
