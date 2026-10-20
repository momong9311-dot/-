/* 제품·도구 라인 아이콘 */
const ICON = {
  bottle:'<rect x="14" y="24" width="20" height="36" rx="3"/><rect x="19" y="16" width="10" height="8"/><path d="M24 16V8h10"/><path d="M18 36h12" stroke-width="1"/>',
  tube:'<path d="M14 6h20l-3 42H17z"/><rect x="19" y="48" width="10" height="10" rx="1.5"/><path d="M14 12h20" stroke-width="1"/>',
  ampoule:'<rect x="19" y="6" width="10" height="38" rx="2"/><path d="M19 44l3 8h4l3-8"/><path d="M24 52v6"/><path d="M19 16h10" stroke-width="1"/>',
  jar:'<rect x="8" y="28" width="32" height="28" rx="3"/><rect x="6" y="20" width="36" height="8" rx="2"/><path d="M14 40h20" stroke-width="1"/>',
  spray:'<rect x="15" y="26" width="18" height="34" rx="3"/><rect x="19" y="18" width="10" height="8"/><rect x="18" y="12" width="13" height="6"/><path d="M31 15h6M38 12l3-2M38 18l3 2"/>',
  dropper:'<rect x="14" y="32" width="20" height="26" rx="3"/><rect x="18" y="24" width="12" height="8"/><path d="M21 24v-9a3 3 0 0 1 6 0v9"/>',
  tool:'<rect x="11" y="6" width="9" height="40" rx="2"/><rect x="28" y="6" width="9" height="40" rx="2"/><path d="M15.5 46v8h17v-8"/><path d="M24 54v6"/>',
  card:'<rect x="9" y="8" width="30" height="48" rx="2"/><path d="M15 20h18M15 28h18M15 36h11"/>',
  scope:'<circle cx="24" cy="22" r="13"/><circle cx="24" cy="22" r="6"/><path d="M24 35v23M18 58h12"/>',
  steam:'<rect x="10" y="32" width="28" height="24" rx="3"/><path d="M18 26c-3-4 3-6 0-10M30 26c-3-4 3-6 0-10M24 26c-3-4 3-6 0-10"/>',
  scissors:'<circle cx="16" cy="50" r="6"/><circle cx="32" cy="50" r="6"/><path d="M20 45 34 6M28 45 14 6"/>',
  dryer:'<path d="M8 12h24a11 11 0 0 1 0 22H8z"/><path d="M20 34l-3 22h8l2-22"/><path d="M4 18v10"/>',
  cup:'<path d="M10 24h24v18a10 10 0 0 1-10 10h-4a10 10 0 0 1-10-10z"/><path d="M34 28h4a5 5 0 0 1 0 10h-4"/><path d="M18 18c-2-3 2-4 0-8M26 18c-2-3 2-4 0-8"/>',
  stone:'<ellipse cx="24" cy="38" rx="16" ry="11"/><path d="M14 36c4-3 16-3 20 0" stroke-width="1"/>'
};
const svg = k => `<svg viewBox="0 0 48 64" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${ICON[k]||ICON.bottle}</svg>`;

