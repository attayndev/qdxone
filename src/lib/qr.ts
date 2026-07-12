import QRCode from "qrcode";

/** QDX brand mark colors, hardcoded — downloaded QR files live outside site CSS. */
const BAR_SLATE = "#98a6be";
const BAR_BLUE = "#43568a";
const BAR_AMBER = "#f6a623";

function n(value: number): string {
  return value.toFixed(3);
}

/**
 * Render a QR code for `data` as an inline SVG string. Used for printable
 * in-store flyers that point at a job posting's public link. Generated
 * server-side — no external API calls. Error correction is bumped to "H"
 * because the centered brand badge eats roughly 8% of the code.
 */
export async function qrSvg(data: string): Promise<string> {
  const svg = await QRCode.toString(data, {
    type: "svg",
    margin: 1,
    width: 220,
    errorCorrectionLevel: "H",
  });
  return brandSvg(svg);
}

/** Overlay a centered white badge with the QDX three-bar mark onto a QR SVG. */
function brandSvg(svg: string): string {
  const match = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  if (!match) return svg;

  const viewW = parseFloat(match[1]);
  const viewH = parseFloat(match[2]);

  const markW = 0.26 * viewW;
  const markH = (markW * 24) / 34;
  const pad = 0.14 * markW;
  const badgeW = markW + 2 * pad;
  const badgeH = markH + 2 * pad;
  const badgeX = (viewW - badgeW) / 2;
  const badgeY = (viewH - badgeH) / 2;
  const markX = badgeX + pad;
  const markY = badgeY + pad;
  const scale = markW / 34;

  // Thin slate ring so the badge reads as a deliberate emblem instead of
  // melting into the QR's own white modules.
  const ring = 0.03 * badgeW;
  const badge = `<rect x="${n(badgeX)}" y="${n(badgeY)}" width="${n(badgeW)}" height="${n(badgeH)}" rx="${n(pad)}" fill="#ffffff" stroke="${BAR_SLATE}" stroke-width="${n(ring)}" />`;
  const mark =
    `<g transform="translate(${n(markX)} ${n(markY)}) scale(${n(scale)})">` +
    `<rect x="0" y="13" width="8" height="11" rx="4" fill="${BAR_SLATE}" />` +
    `<rect x="13" y="6" width="8" height="18" rx="4" fill="${BAR_BLUE}" />` +
    `<rect x="26" y="0" width="8" height="24" rx="4" fill="${BAR_AMBER}" />` +
    `</g>`;

  return svg.replace("</svg>", `${badge}${mark}</svg>`);
}

/**
 * Render a QR code as a branded PNG data URL. Browser-only (uses
 * `document`/`Image`/canvas) — for client-side downloads like the onboarding
 * share step's printable QR. Error correction is "H" for the same reason as
 * `qrSvg`: the badge covers part of the code.
 */
export async function qrPngDataUrl(data: string, size = 512): Promise<string> {
  const src = await QRCode.toDataURL(data, {
    width: size,
    margin: 2,
    errorCorrectionLevel: "H",
  });

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load QR image"));
    img.src = src;
  });

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;

  ctx.drawImage(img, 0, 0, size, size);

  const markW = 0.26 * size;
  const markH = (markW * 24) / 34;
  const pad = 0.14 * markW;
  const badgeW = markW + 2 * pad;
  const badgeH = markH + 2 * pad;
  const badgeX = (size - badgeW) / 2;
  const badgeY = (size - badgeH) / 2;
  const markX = badgeX + pad;
  const markY = badgeY + pad;
  const scale = markW / 34;
  const barRx = 4 * scale;

  ctx.fillStyle = "#ffffff";
  roundRectPath(ctx, badgeX, badgeY, badgeW, badgeH, pad);
  ctx.fill();
  ctx.strokeStyle = BAR_SLATE;
  ctx.lineWidth = 0.03 * badgeW;
  ctx.stroke();

  const bars: Array<[x: number, y: number, w: number, h: number, fill: string]> = [
    [0, 13, 8, 11, BAR_SLATE],
    [13, 6, 8, 18, BAR_BLUE],
    [26, 0, 8, 24, BAR_AMBER],
  ];
  for (const [bx, by, bw, bh, fill] of bars) {
    ctx.fillStyle = fill;
    roundRectPath(ctx, markX + bx * scale, markY + by * scale, bw * scale, bh * scale, barRx);
    ctx.fill();
  }

  return canvas.toDataURL("image/png");
}

/**
 * Rounded-rect path via moveTo/arcTo rather than ctx.roundRect, which Safari
 * didn't support until iOS 16.4.
 */
function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
