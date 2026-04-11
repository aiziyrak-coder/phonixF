import { useState, useEffect } from 'react';

const VIEWPORT_FRACTION = 0.15;
const MIN_PX = 240;

function measureChatPanelWidth(): number {
  if (typeof window === 'undefined') return MIN_PX;
  return Math.max(MIN_PX, Math.round(window.innerWidth * VIEWPORT_FRACTION));
}

/**
 * O‘ng chat paneli kengligi: ekranning ~15%, juda tor bo‘lib qolmasligi uchun pastdan chegara.
 */
export function useChatDockInsetPx(enabled: boolean): number {
  const [px, setPx] = useState(measureChatPanelWidth);

  useEffect(() => {
    if (!enabled) return;
    setPx(measureChatPanelWidth());
    const onResize = () => setPx(measureChatPanelWidth());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [enabled]);

  return enabled ? px : 0;
}
