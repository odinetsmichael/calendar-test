import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import type { CalendarEvent } from "@/types";
import { toFCEventInput } from "@/utils/eventMapper";
import { loadFromStorage, makeDebouncedSave } from "@/utils/storage";

const STORAGE_KEY = "calendar-events";

export const useEventsStore = defineStore("events", () => {
  const events = ref<CalendarEvent[]>(
    loadFromStorage<CalendarEvent[]>(STORAGE_KEY) ?? [],
  );
  const selectedEventId = ref<string | null>(null);
  const selectedDate = ref<string | null>(null);
  const selectedTime = ref<string | null>(null);
  // Memoised mapping — recalculates only when events array changes
  const fcEvents = computed(() => events.value.map(toFCEventInput));

  // Debounced write avoids blocking the main thread on every deep mutation
  const debouncedSave = makeDebouncedSave<CalendarEvent[]>(STORAGE_KEY, 300);
  watch(events, (val) => debouncedSave(val), { deep: true });
  console.log(events);

  function addEvent(payload: Omit<CalendarEvent, "id">): string {
    const id = crypto.randomUUID();
    const newEvent: CalendarEvent = { id, ...payload };
    events.value.push(newEvent);
    return id;
  }

  function updateEvent(
    id: string,
    patch: Partial<Omit<CalendarEvent, "id">>,
  ): void {
    const idx = events.value.findIndex((e) => e.id === id);
    if (idx === -1) return;
    events.value[idx] = { ...events.value[idx], ...patch };
  }

  function deleteEvent(id: string): void {
    events.value = events.value.filter((e) => e.id !== id);
    if (selectedEventId.value === id) {
      selectedEventId.value = null;
    }
  }
  return {
    events,
    fcEvents,
    selectedEventId,
    selectedDate,
    selectedTime,
    addEvent,
    updateEvent,
    deleteEvent,
  };
});
