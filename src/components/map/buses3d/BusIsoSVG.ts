import type { OperatorConfig } from '../../../config/operators';

function escape(s: string): string {
  return s.replace(/"/g, '&quot;');
}

export function busIsoSVG(op: OperatorConfig): string {
  const body = escape(op.bodyColor);
  const accent = escape(op.accentColor);
  const window = escape(op.windowColor);
  const isArt = op.vehicleType === 'articulado';

  const w = 28;
  const h = isArt ? 64 : 50;
  const cx = w / 2;
  const half = h / 2;

  if (isArt) {
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;filter:drop-shadow(0 1px 0 rgba(0,0,0,0.18));">
  <defs>
    <linearGradient id="vlBus-body" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${body}" stop-opacity="0.85"/>
      <stop offset="0.5" stop-color="${body}" stop-opacity="1"/>
      <stop offset="1" stop-color="${body}" stop-opacity="0.85"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="7" fill="url(#vlBus-body)" stroke="rgba(0,0,0,0.32)" stroke-width="0.8"/>
  <rect x="3.5" y="${half - 2}" width="${w - 7}" height="4" fill="rgba(0,0,0,0.18)"/>
  <rect x="4" y="${half - 1.4}" width="${w - 8}" height="2.8" fill="${accent}"/>
  <rect x="5" y="5" width="${w - 10}" height="${half - 9}" rx="3" fill="${window}" opacity="0.9"/>
  <rect x="5" y="${half + 4}" width="${w - 10}" height="${half - 9}" rx="3" fill="${window}" opacity="0.9"/>
  <rect x="6" y="${h - 6}" width="${w - 12}" height="2" rx="1" fill="${accent}"/>
  <circle cx="${cx - 4}" cy="3.8" r="1.1" fill="#FFE27A"/>
  <circle cx="${cx + 4}" cy="3.8" r="1.1" fill="#FFE27A"/>
  <circle cx="${cx - 4}" cy="${h - 3.6}" r="1" fill="#DA1E28"/>
  <circle cx="${cx + 4}" cy="${h - 3.6}" r="1" fill="#DA1E28"/>
</svg>`;
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;filter:drop-shadow(0 1px 0 rgba(0,0,0,0.18));">
  <defs>
    <linearGradient id="vlBus-body" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${body}" stop-opacity="0.82"/>
      <stop offset="0.5" stop-color="${body}" stop-opacity="1"/>
      <stop offset="1" stop-color="${body}" stop-opacity="0.82"/>
    </linearGradient>
  </defs>
  <rect x="2.5" y="3" width="${w - 5}" height="${h - 6}" rx="8" fill="url(#vlBus-body)" stroke="rgba(0,0,0,0.32)" stroke-width="0.8"/>
  <path d="M 5 7 Q ${cx} 3.5 ${w - 5} 7 L ${w - 5} 13 L 5 13 Z" fill="${window}" opacity="0.92"/>
  <rect x="5" y="${half - 9}" width="${w - 10}" height="6" rx="1.5" fill="${window}" opacity="0.78"/>
  <rect x="5" y="${half + 1}" width="${w - 10}" height="6" rx="1.5" fill="${window}" opacity="0.78"/>
  <rect x="4" y="${h - 12}" width="${w - 8}" height="1.6" fill="${accent}" opacity="0.85"/>
  <rect x="6" y="${h - 6}" width="${w - 12}" height="1.8" rx="0.9" fill="${accent}" opacity="0.9"/>
  <circle cx="${cx - 4}" cy="4.6" r="1.1" fill="#FFE27A"/>
  <circle cx="${cx + 4}" cy="4.6" r="1.1" fill="#FFE27A"/>
  <circle cx="${cx - 4}" cy="${h - 3.6}" r="1" fill="#DA1E28"/>
  <circle cx="${cx + 4}" cy="${h - 3.6}" r="1" fill="#DA1E28"/>
</svg>`;
}
