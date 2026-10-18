// Neutral, built-in placeholders used when a real thumbnail or avatar isn't available.
// They're plain inline SVGs (no stock photos, no external requests).

const svg = (body: string, w: number, h: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`
  )}`;

/** Dark tile with a small film-frame icon, for missing video/image thumbnails. */
export const MEDIA_PLACEHOLDER = svg(
  `<rect width="160" height="90" fill="#11151E"/>` +
    `<rect x="66" y="31" width="28" height="28" rx="5" fill="none" stroke="#3A4256" stroke-width="2.5"/>` +
    `<path d="M76 39 L86 45 L76 51 Z" fill="#3A4256"/>`,
  160,
  90
);

/** Grey person silhouette, for users without a profile photo. */
export const AVATAR_PLACEHOLDER = svg(
  `<rect width="64" height="64" fill="#1C2230"/>` +
    `<circle cx="32" cy="25" r="11" fill="#4A5368"/>` +
    `<path d="M12 56 C14 42 50 42 52 56 Z" fill="#4A5368"/>`,
  64,
  64
);

/** Plain dark gradient, used as the default "Starting soon" scene background in Live Studio. */
export const STANDBY_BACKGROUND = svg(
  `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0B1020"/><stop offset="1" stop-color="#1A1240"/></linearGradient></defs>` +
    `<rect width="1920" height="1080" fill="url(#g)"/>`,
  1920,
  1080
);
