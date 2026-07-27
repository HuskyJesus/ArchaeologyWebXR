/* Minimal synchronous event bus. Used so that state changes can refresh the
   HUD, the minimap, the evidence board and the XR panels without any of
   those modules importing each other. */

const listeners = new Map();

export function on(event, handler) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(handler);
  return () => off(event, handler);
}

export function off(event, handler) {
  const set = listeners.get(event);
  if (set) set.delete(handler);
}

export function emit(event, payload) {
  const set = listeners.get(event);
  if (!set) return;
  // Copy before iterating so a handler can unsubscribe safely.
  [...set].forEach((handler) => {
    try {
      handler(payload);
    } catch (err) {
      console.error(`[events] handler for "${event}" failed`, err);
    }
  });
}

export const EVENTS = {
  stateChanged: 'state:changed',
  daysChanged: 'state:days',
  stationChanged: 'state:station',
  evidenceChanged: 'state:evidence',
  settingsChanged: 'settings:changed',
  panelOpened: 'panel:opened',
  panelClosed: 'panel:closed',
  toast: 'ui:toast',
  xrSessionStart: 'xr:start',
  xrSessionEnd: 'xr:end'
};
