<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, {
  type DateClickArg,
  type EventDropArg,
  type EventResizeDoneArg,
} from "@fullcalendar/interaction";
import type { EventClickArg, EventContentArg } from "@fullcalendar/core";
import { useEventsStore } from "@/stores/events";
import type { CalendarViewName, NavigationAction } from "@/types";
import { parseFCDate, calcDuration } from "@/utils/date";

const CALENDAR_PLUGINS = [dayGridPlugin, timeGridPlugin, interactionPlugin];

const props = withDefaults(
  defineProps<{
    currentView: CalendarViewName;
    navigationAction: NavigationAction;
    periodTitle?: string;
  }>(),
  {
    currentView: "dayGridMonth",
  },
);

const emit = defineEmits<{
  "update:title": [title: string];
  "date-click": [dateStr: string, anchorEl: HTMLElement];
  "event-click": [eventId: string, anchorEl: HTMLElement];
  navigate: [action: NavigationAction];
  "view-change": [view: CalendarViewName];
}>();

const store = useEventsStore();

const calendarRef = ref<InstanceType<typeof FullCalendar>>();

function getApi() {
  return calendarRef.value!.getApi();
}

function handleDateClick(info: DateClickArg): void {
  if (!info.dateStr) return;
  store.selectedDate = info.dateStr;
  emit("date-click", info.dateStr, info.dayEl);
}

function handleEventClick(info: EventClickArg): void {
  if (!info.event.id) return;
  store.selectedEventId = info.event.id;
  emit("event-click", info.event.id, info.el);
}

async function handleEventDrop(info: EventDropArg): Promise<void> {
  const { id, startStr } = info.event;
  try {
    store.updateEvent(id, parseFCDate(startStr));
  } catch {
    info.revert();
  }
}

async function handleEventResize(info: EventResizeDoneArg): Promise<void> {
  const { id, startStr, endStr } = info.event;
  if (!endStr) {
    info.revert();
    return;
  }
  try {
    const duration = calcDuration(startStr, endStr);
    if (duration < 1) throw new Error("Duration too short");
    store.updateEvent(id, { duration });
  } catch {
    info.revert();
  }
}

const calendarOptions = computed(() => ({
  eventContent: (arg: { event: { title: string } }) => {
    return {
      html: `<div class="event-title">${arg.event.title}</div>`,
    };
  },
  slotLabelFormat: {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  },
  allDaySlot: true,

  plugins: CALENDAR_PLUGINS,
  initialView: props.currentView,
  slotDuration: "02:00:00",
  snapDuration: "01:00:00",
  slotLabelInterval: "02:00:00",
  slotMinTime: "00:00:00",
  slotMaxTime: "24:00:00",
  expandRows: false,
  dayMaxEvents: 2,
  headerToolbar: false as const,
  fixedWeekCount: false,
  nowIndicator: true,
  editable: true,
  droppable: false,
  selectable: true,
  selectMirror: true,

  weekends: true,
  height: "auto",
  events: store.fcEvents,
  dateClick: handleDateClick,
  eventClick: handleEventClick,
  eventDrop: handleEventDrop,
  eventResize: handleEventResize,
}));

watch(
  () => props.currentView,
  async (view) => {
    getApi().changeView(view);
    await nextTick();
    emit("update:title", getApi().view.title);
  },
);

watch(
  () => props.navigationAction,
  async (action) => {
    if (!action) return;
    const api = getApi();
    if (action === "prev") api.prev();
    if (action === "next") api.next();
    if (action === "today") api.today();
    await nextTick();
    emit("update:title", api.view.title);
  },
);

onMounted(async () => {
  await nextTick();
  emit("update:title", getApi().view.title);
});
</script>

<template>
  <div class="calendar">
    <div class="calendar-header">
      <h2 class="calendar-title">Calendar View</h2>
      <div class="view-toggles" role="group" aria-label="Calendar view">
        <button
          class="view-btn"
          :class="{ 'view-btn--active': currentView === 'dayGridMonth' }"
          :aria-pressed="currentView === 'dayGridMonth'"
          type="button"
          @click="emit('view-change', 'dayGridMonth')"
        >
          Month
        </button>
        <button
          class="view-btn view-btn_week"
          :class="{ 'view-btn--active': currentView === 'timeGridWeek' }"
          :aria-pressed="currentView === 'timeGridWeek'"
          type="button"
          @click="emit('view-change', 'timeGridWeek')"
        >
          Week
        </button>
        <button
          class="view-btn view-btn_day"
          :class="{ 'view-btn--active': currentView === 'timeGridDay' }"
          :aria-pressed="currentView === 'timeGridDay'"
          type="button"
          @click="emit('view-change', 'timeGridDay')"
        >
          Day
        </button>
        <button class="view-btn view-btn_agenda" type="button">Agenda</button>
      </div>
    </div>
    <div class="flex-container">
      <div class="nav-group">
        <button
          class="nav-btn left-btn"
          aria-label="Go to today"
          type="button"
          @click="emit('navigate', 'today')"
        >
          <span>Today</span>
        </button>
        <button
          class="nav-btn middle-btn"
          aria-label="Previous period"
          type="button"
          @click="emit('navigate', 'prev')"
        >
          <span>Back</span>
        </button>

        <button
          class="nav-btn right-btn"
          aria-label="Next period"
          type="button"
          @click="emit('navigate', 'next')"
        >
          <span>Next</span>
        </button>
      </div>
      <h3 class="period-title">{{ periodTitle }}</h3>
    </div>

    <FullCalendar
      ref="calendarRef"
      :options="calendarOptions"
      class="calendar-view"
    />
  </div>
</template>

<style lang="scss">
.calendar {
  background-color: white;
  height: 859px;
  padding: 19px 20px 35px 20px;
  .calendar-header {
    height: 32px;
    display: flex;
    justify-content: space-between;
    align-items: top;
    margin-bottom: 5px;
    .view-toggles {
      display: flex;
      width: max-content;
      border-radius: 4px;
      border: 1px solid #d7dae2;
      height: 32px;
      .view-btn {
        padding: 8px;
        background-color: white;
        border: none;
        cursor: pointer;
        color: $default-text-color;
        font-size: 13px;
        width: 68px;
        transition: 0.3s ease-in-out;
        box-shadow: 0px 2px 3px #0000000d;
        &_week {
          width: 61px;
          border-left: 1px solid #d7dae2;
          border-right: 1px solid #d7dae2;
        }
        &_day {
          width: 55px;
          border-right: 1px solid #d7dae2;
        }
        &__agenda {
          width: 78px;
        }
      }
      .view-btn--active {
        color: #3b86ff;
      }
    }
    .calendar-title {
      color: $default-text-color;
      font-weight: normal;
      font-size: 18px;
    }
  }
  .flex-container {
    display: flex;
    position: relative;
    width: 100%;
    height: 32px;
    margin-bottom: 20px;
    .period-title {
      width: 100%;
      align-items: center;
      display: flex;
      justify-content: center;
      color: #4d4f5c;
      font-size: 18px;
      font-weight: normal;
    }
    .nav-group {
      position: absolute;
      display: flex;
      width: max-content;
      border-radius: 4px;
      border: 1px solid #d7dae2;
      height: 32px;
      .nav-btn {
        padding: 8px;
        background-color: white;
        border: none;
        cursor: pointer;
        color: $default-text-color;
        font-size: 13px;
        width: 68px;
        transition: 0.3s ease-in-out;
        box-shadow: 0px 2px 3px #0000000d;
        &:hover {
          color: #3b86ff;
          transition: 0.3s ease-in-out;
        }
      }
      .middle-btn {
        width: 58px !important;
        border-left: 1px solid #d7dae2;
        border-right: 1px solid #d7dae2;
      }
    }
  }

  .calendar-view {
    height: 100%;
  }
}
</style>
