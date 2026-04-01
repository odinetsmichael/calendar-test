import type { CalendarEvent, FCEventInput } from "@/types";

function toLocalISOString(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 19);
}

export function toFCEventInput(event: CalendarEvent): FCEventInput {
  const startISO = `${event.date}T${event.time}:00`;
  const durationMs = Math.max(event.duration, 1) * 60 * 1000;
  const endISO = toLocalISOString(
    new Date(new Date(startISO).getTime() + durationMs),
  );
  return {
    id: event.id,
    title: event.title,
    start: startISO,
    end: endISO,
    backgroundColor: event.color,
    borderColor: event.color,
    extendedProps: { originalEvent: event },
  };
}
