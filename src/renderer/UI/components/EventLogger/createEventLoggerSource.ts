import { Emitter } from '@tgdf';

import { EventLoggerFormatter, EventLoggerSource, EventLoggerEntry } from './EventLogger';

export const createEventLoggerSource = <T, K extends keyof T>(
  emitter: Emitter<T>,
  events: readonly K[],
  formatMessage: EventLoggerFormatter<T, K> = defaultFormatMessage
): EventLoggerSource => ({
  subscribe: (log) => {
    const subscriptions = events.map((event) => {
      const cb = (payload: T[K]) => {
        const text = formatMessage({ event, payload } as EventLoggerEntry<T, K>);
        if (text !== null) log(text);
      };
      emitter.on(event, cb);
      return { event, cb };
    });
    return () => subscriptions.forEach(({ event, cb }) => emitter.off(event, cb));
  },
});

const defaultFormatMessage = ({ event, payload }: { event: PropertyKey; payload: unknown }) => {
  const eventName = String(event);
  if (payload === undefined || payload === null) return eventName;
  if (typeof payload === 'object') return `${eventName}: ${JSON.stringify(payload)}`;
  return `${eventName}: ${String(payload)}`;
};
