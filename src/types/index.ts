export type CalendarViewName = "dayGridMonth" | "timeGridWeek" | "timeGridDay";
export type NavigationAction = "prev" | "next" | "today" | null;

export const EVENT_COLORS = Object.freeze([
  { hex: "#6C7EE1", name: "Indigo", label: "По умолчанию" },
  { hex: "#EF4444", name: "Red", label: "Красный" },
  { hex: "#10B981", name: "Green", label: "Зелёный" },
  { hex: "#F59E0B", name: "Amber", label: "Жёлтый" },
  { hex: "#8B5CF6", name: "Purple", label: "Фиолетовый" },
  { hex: "#EC4899", name: "Pink", label: "Розовый" },
] as const);

export type EventColor = (typeof EVENT_COLORS)[number]["hex"];

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  color: EventColor;
  duration: number; // минуты, default 60
  notes?: string;
}

export interface EventsState {
  events: CalendarEvent[];
  selectedEventId: string | null;
  selectedDate: string | null;
}

export interface FCEventExtendedProps {
  originalEvent: CalendarEvent;
}

export interface FCEventInput {
  id: string;
  title: string;
  start: string; // "YYYY-MM-DDTHH:MM:00"
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: FCEventExtendedProps;
}
