/* eslint-disable prefer-spread, prefer-rest-params, @typescript-eslint/no-unused-expressions */
/**
 * X (Twitter) Ads Conversion Pixel Utility
 */

export function initXPixel(pixelId: string) {
  if (typeof window === 'undefined') return;

  // Already initialized?
  if (!(window as any).twq) {
    (function(e: any, t: any, n: string, s?: any, u?: any, a?: any) {
      e.twq || (s = e.twq = function() {
        s.exe ? s.exe.apply(s, arguments) : s.queue.push(arguments);
      }, s.version = '1.1', s.queue = [], u = t.createElement(n), u.async = !0, u.src = 'https://static.ads-twitter.com/uwt.js',
      a = t.getElementsByTagName(n)[0], a.parentNode.insertBefore(u, a))
    })(window, document, 'script');

    (window as any).twq('config', pixelId);
    (window as any).twq('track', 'PageView');
    console.log('[X Ads] Base pixel initialized.');
  }
}

export function trackXEvent(eventId: string, data?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  const twq = (window as any).twq;
  if (twq) {
    twq('event', eventId, data);
    console.log('[X Ads] Tracked event:', eventId, data);
  } else {
    console.warn('[X Ads] twq is not defined. Track failed for event:', eventId, data);
  }
}
