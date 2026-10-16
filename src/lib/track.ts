type Win = Window & {
  fbq?: (...a: unknown[]) => void
  ttq?: { track: (...a: unknown[]) => void }
}

/** Fires an event on whichever pixels are loaded; silently does nothing otherwise. */
export function track(event: 'ViewContent' | 'InitiateCheckout' | 'Purchase', data: Record<string, unknown>) {
  const w = window as Win
  try {
    w.fbq?.('track', event, data)
    const tt = { ViewContent: 'ViewContent', InitiateCheckout: 'InitiateCheckout', Purchase: 'PlaceAnOrder' }[event]
    w.ttq?.track(tt, data)
  } catch {
    /* tracking must never break ordering */
  }
}
