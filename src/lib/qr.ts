import QRCode from "qrcode";

/**
 * Render a QR code for `data` as an inline SVG string. Used for printable
 * in-store flyers that point at a job posting's public link. Generated
 * server-side — no external API calls.
 */
export async function qrSvg(data: string): Promise<string> {
  return QRCode.toString(data, {
    type: "svg",
    margin: 1,
    width: 220,
    errorCorrectionLevel: "M",
  });
}
