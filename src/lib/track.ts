type Win = Window & {
  fbq?: (...a: unknown[]) => void
  ttq?: { track: (...a: unknown[]) => void }
}

/**
 * Fires an event on whichever pixels are loaded; silently does nothing otherwise.
 * `eventId` lets Meta/TikTok de-duplicate the same event if it is also sent server-side (Conversions API).
 */
export function track(
  event: 'ViewContent' | 'InitiateCheckout' | 'Purchase',
  data: Record<string, unknown>,
  eventId?: string,
) {
  // Never report events from the admin preview.
  if (window.location.pathname.startsWith('/preview')) return
  const w = window as Win
  try {
    if (eventId) w.fbq?.('track', event, data, { eventID: eventId })
    else w.fbq?.('track', event, data)
    const tt = { ViewContent: 'ViewContent', InitiateCheckout: 'InitiateCheckout', Purchase: 'PlaceAnOrder' }[event]
    if (eventId) w.ttq?.track(tt, data, { event_id: eventId })
    else w.ttq?.track(tt, data)
  } catch {
    /* tracking must never break ordering */
  }
}
