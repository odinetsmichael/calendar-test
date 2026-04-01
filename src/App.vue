<script setup lang="ts">
import { ref, nextTick } from "vue";
import AppLayout from "./components/layout/AppLayout.vue";
import AppHeader from "./components/layout/AppHeader.vue";
import CalendarView from "./components/calendar/CalendarView.vue";
import EventCreateModal from "./components/calendar/EventCreateModal.vue";
import EventViewModal from "./components/calendar/EventViewModal.vue";
import { useEventsStore } from "@/stores/events";
import type { CalendarViewName, NavigationAction } from "@/types";

const store = useEventsStore();

const currentView = ref<CalendarViewName>("dayGridMonth");
const navigationAction = ref<NavigationAction>(null);
const createModalVisible = ref(false);
const createModalAnchorEl = ref<HTMLElement | null>(null);

const viewModalVisible = ref(false);
const viewModalAnchorEl = ref<HTMLElement | null>(null);

function handleNavigate(action: NavigationAction): void {
  navigationAction.value = action;
  nextTick(() => {
    navigationAction.value = null;
  });
}

function handleViewChange(view: CalendarViewName): void {
  currentView.value = view;
}

function formatDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function onDateClick(dateStr: string, anchorEl: HTMLElement): void {
  const date = new Date(dateStr);
  const formattedDate = formatDateLocal(date);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const formattedTime = `${hours}:${minutes}`;

  store.selectedDate = formattedDate;
  store.selectedTime = formattedTime;

  createModalAnchorEl.value = anchorEl;
  createModalVisible.value = true;
}

function onCreateModalClose(): void {
  createModalVisible.value = false;
}

function onEventSaved(eventId: string): void {
  createModalVisible.value = false;
  if (import.meta.env.DEV) console.log("event-saved", eventId);
}

function onEventClick(eventId: string, anchorEl: HTMLElement): void {
  createModalVisible.value = false;
  store.selectedEventId = eventId;
  viewModalAnchorEl.value = anchorEl;
  viewModalVisible.value = true;
}

function onViewModalClose(): void {
  viewModalVisible.value = false;
  store.selectedEventId = null;
}

function onViewModalSaved(eventId: string): void {
  if (import.meta.env.DEV) console.log("event-updated", eventId);
}

function onViewModalDeleted(eventId: string): void {
  viewModalVisible.value = false;
  store.selectedEventId = null;
  if (import.meta.env.DEV) console.log("event-deleted", eventId);
}
const periodTitle = ref<string>("");
function onUpdateTitle(title: string): void {
  periodTitle.value = title;
}
</script>

<template>
  <AppLayout>
    <template #header>
      <AppHeader :current-view="currentView" :period-title="periodTitle" />
    </template>

    <CalendarView
      :current-view="currentView"
      :navigation-action="navigationAction"
      @view-change="handleViewChange"
      @navigate="handleNavigate"
      @update:title="onUpdateTitle"
      :period-title="periodTitle"
      @date-click="onDateClick"
      @event-click="onEventClick"
    />
    <EventCreateModal
      :visible="createModalVisible"
      :anchor-el="createModalAnchorEl"
      @close="onCreateModalClose"
      @saved="onEventSaved"
    />
    <EventViewModal
      :visible="viewModalVisible"
      :anchor-el="viewModalAnchorEl"
      :event-id="store.selectedEventId"
      @close="onViewModalClose"
      @saved="onViewModalSaved"
      @deleted="onViewModalDeleted"
    />
  </AppLayout>
</template>
