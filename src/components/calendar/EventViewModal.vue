<script setup lang="ts">
import {
  ref,
  reactive,
  computed,
  watch,
  nextTick,
  onMounted,
  onUnmounted,
} from "vue";
import { useEventsStore } from "@/stores/events";
import { EVENT_COLORS } from "@/types";
import type { EventColor } from "@/types";

interface FormState {
  title: string;
  date: string;
  time: string;
  color: EventColor;
  duration: number;
  notes: string;
}

const props = defineProps<{
  anchorEl: HTMLElement | null;
  visible: boolean;
  eventId: string | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [eventId: string];
  deleted: [eventId: string];
}>();

const COLOR_NAMES: Record<string, string> = {
  "#6C7EE1": "Indigo",
  "#EF4444": "Red",
  "#10B981": "Green",
  "#F59E0B": "Amber",
  "#8B5CF6": "Purple",
  "#EC4899": "Pink",
};

const MODAL_WIDTH = 320;
const MODAL_HEIGHT = 300;
const ARROW_HEIGHT = 8;
const VIEWPORT_PAD = 8;

// Cached at module level — created once, shared across all component instances
const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});
const TIME_FMT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const store = useEventsStore();

const mode = ref<"view" | "edit">("view");
const form = reactive<FormState>({
  title: "",
  date: "",
  time: "",
  color: EVENT_COLORS[0].hex,
  duration: 60,
  notes: "",
});
const titleError = ref(false);
const durationError = ref(false);
const isFlipped = ref(false);
const positionStyle = ref<Record<string, string>>({});
const modalRef = ref<HTMLDivElement | null>(null);
const titleInputRef = ref<HTMLInputElement | null>(null);
const editBtnRef = ref<HTMLButtonElement | null>(null);
const swatchRefs = ref<HTMLButtonElement[]>([]);

const currentEvent = computed(() =>
  props.eventId
    ? (store.events.find((e) => e.id === props.eventId) ?? null)
    : null,
);

function calcPosition(anchorEl: HTMLElement) {
  const rect = anchorEl.getBoundingClientRect();
  const modalH = modalRef.value?.offsetHeight ?? MODAL_HEIGHT;
  let top = rect.top - modalH - ARROW_HEIGHT;
  let left = rect.left + rect.width / 2 - MODAL_WIDTH / 2;
  let flipped = false;
  if (top < VIEWPORT_PAD) {
    top = rect.bottom + ARROW_HEIGHT;
    flipped = true;
  }
  if (flipped && top + modalH > window.innerHeight - VIEWPORT_PAD) {
    top = window.innerHeight - modalH - VIEWPORT_PAD;
  }
  left = Math.max(
    VIEWPORT_PAD,
    Math.min(left, window.innerWidth - MODAL_WIDTH - VIEWPORT_PAD),
  );
  return { top, left, flipped, rect };
}

function applyPosition() {
  if (!props.anchorEl) return;
  const { top, left, flipped, rect } = calcPosition(props.anchorEl);
  isFlipped.value = flipped;
  const arrowX = Math.max(
    12,
    Math.min(rect.left + rect.width / 2 - left, MODAL_WIDTH - 12),
  );
  positionStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    "--arrow-x": `${arrowX}px`,
  };
}

let rafId: number | null = null;

function onResize() {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    applyPosition();
    rafId = null;
  });
}

function resetForm() {
  const e = currentEvent.value!;
  Object.assign(form, {
    title: e.title,
    date: e.date,
    time: e.time,
    color: e.color,
    duration: e.duration,
    notes: e.notes ?? "",
  });
  titleError.value = false;
  durationError.value = false;
}

function validateForm(): boolean {
  titleError.value =
    form.title.trim().length === 0 || form.title.trim().length > 100;
  durationError.value = form.duration < 1 || form.duration > 480;
  if (!form.date || !form.time) return false;
  if (titleError.value) {
    nextTick(() => titleInputRef.value?.focus());
    return false;
  }
  if (durationError.value) {
    return false;
  }
  return true;
}

function saveEdit() {
  if (!validateForm()) return;
  store.updateEvent(props.eventId!, {
    title: form.title.trim(),
    date: form.date,
    time: form.time,
    color: form.color,
    duration: form.duration,
    notes: form.notes.trim() || undefined,
  });
  emit("saved", props.eventId!);
  mode.value = "view";
  nextTick(() => editBtnRef.value?.focus());
}

function discardEdit() {
  resetForm();
  mode.value = "view";
  nextTick(() => editBtnRef.value?.focus());
}

function handleDelete() {
  if (!props.eventId) return;
  store.deleteEvent(props.eventId);
  emit("deleted", props.eventId);
}

function switchToEdit() {
  mode.value = "edit";
  nextTick(() => titleInputRef.value?.focus());
}

function onSwatchKeydown(e: KeyboardEvent, index: number) {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    const next = (index + 1) % EVENT_COLORS.length;
    form.color = EVENT_COLORS[next].hex;
    nextTick(() => swatchRefs.value[next]?.focus());
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    const prev = (index - 1 + EVENT_COLORS.length) % EVENT_COLORS.length;
    form.color = EVENT_COLORS[prev].hex;
    nextTick(() => swatchRefs.value[prev]?.focus());
  }
}

function trapFocus(e: KeyboardEvent) {
  if (!modalRef.value || e.key !== "Tab") return;
  const focusable = Array.from(
    modalRef.value.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  );
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function onDocKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    e.preventDefault();
    emit("close");
  } else {
    trapFocus(e);
  }
}

function onDocMousedown(e: MouseEvent) {
  if (modalRef.value && !modalRef.value.contains(e.target as Node)) {
    emit("close");
  }
}

const formattedDate = computed(() => {
  if (!currentEvent.value) return "";
  const [y, mo, d] = currentEvent.value.date.split("-").map(Number);
  return DATE_FMT.format(new Date(y, mo - 1, d));
});

const formattedTime = computed(() => {
  if (!currentEvent.value) return "";
  const [h, m] = currentEvent.value.time.split(":").map(Number);
  return TIME_FMT.format(new Date(2000, 0, 1, h, m));
});

const formattedDuration = computed(() => {
  if (!currentEvent.value) return "";
  const mins = currentEvent.value.duration;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
});

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      if (!currentEvent.value) {
        console.warn(`[EventViewModal] Event "${props.eventId}" not found`);
        emit("close");
        return;
      }
      resetForm();
      mode.value = "view";
      nextTick(() => {
        applyPosition();
        modalRef.value
          ?.querySelector<HTMLElement>('[aria-label="Close modal"]')
          ?.focus();
      });
      document.addEventListener("keydown", onDocKeydown);
      document.addEventListener("mousedown", onDocMousedown);
    } else {
      document.removeEventListener("keydown", onDocKeydown);
      document.removeEventListener("mousedown", onDocMousedown);
      if (props.anchorEl && document.contains(props.anchorEl)) {
        props.anchorEl.focus();
      }
    }
  },
  { immediate: true },
);

watch(
  () => props.eventId,
  () => {
    if (props.visible && currentEvent.value) {
      resetForm();
      mode.value = "view";
    }
  },
);

watch(currentEvent, (val) => {
  if (props.visible && val === null) emit("close");
});

onMounted(() => window.addEventListener("resize", onResize, { passive: true }));
onUnmounted(() => {
  window.removeEventListener("resize", onResize);
  if (rafId !== null) cancelAnimationFrame(rafId);
  document.removeEventListener("keydown", onDocKeydown);
  document.removeEventListener("mousedown", onDocMousedown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="props.visible && currentEvent"
        ref="modalRef"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        class="event-view-modal"
        :class="{ 'modal--flipped': isFlipped }"
        :style="positionStyle"
      >
        <!-- Always present for aria-labelledby — sr-only in EDIT mode -->
        <h2 v-if="mode === 'view'" id="modal-title" class="sr-only">
          {{ currentEvent.title }}
        </h2>
        <h2 v-else id="modal-title" class="sr-only">Edit Event</h2>

        <!-- Header -->
        <div class="modal-header">
          <span
            v-if="mode === 'view'"
            class="color-dot"
            :style="{ backgroundColor: currentEvent.color }"
          ></span>
          <span v-if="mode === 'view'" class="header-title-text">{{
            currentEvent.title
          }}</span>
          <span v-else class="header-edit-label">Edit Event</span>
          <div class="header-actions">
            <button
              class="btn-trash"
              type="button"
              aria-label="Delete event"
              @click="handleDelete"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="3,6 5,6 21,6" />
                <path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6" />
                <path d="M10,11v6M14,11v6" />
                <path d="M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2" />
              </svg>
            </button>
            <button
              class="btn-close-x"
              type="button"
              aria-label="Close modal"
              @click="emit('close')"
            >
              ×
            </button>
          </div>
        </div>

        <!-- VIEW BODY -->
        <div v-if="mode === 'view'" class="modal-body">
          <div class="view-row">
            <span class="view-icon">📅</span>
            <span>{{ formattedDate }}</span>
          </div>
          <div class="view-row">
            <span class="view-icon">🕐</span>
            <span>{{ formattedTime }}</span>
          </div>
          <div class="view-row">
            <span class="view-icon">⏱</span>
            <span>{{ formattedDuration }}</span>
          </div>
          <div v-if="currentEvent.notes" class="view-row">
            <span class="view-icon">📝</span>
            <span>{{ currentEvent.notes }}</span>
          </div>
        </div>

        <!-- EDIT BODY -->
        <div v-else class="modal-body">
          <div class="field field-title">
            <input
              ref="titleInputRef"
              v-model="form.title"
              type="text"
              aria-label="Event name"
              :aria-invalid="titleError ? 'true' : undefined"
              :class="{ error: titleError }"
              placeholder="Event name"
              maxlength="100"
              @input="titleError = false"
            />
            <span v-if="titleError" role="alert" class="field-error"
              >Title is required (max 100 characters).</span
            >
          </div>
          <div class="field input-icon-row">
            <svg
              class="icon"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <rect
                x="1"
                y="3"
                width="14"
                height="12"
                rx="2"
                stroke="#9ca3af"
                stroke-width="1.5"
              />
              <path d="M1 7h14" stroke="#9ca3af" stroke-width="1.5" />
              <path
                d="M5 1v4M11 1v4"
                stroke="#9ca3af"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <input v-model="form.date" type="date" aria-label="Event date" />
          </div>
          <div class="field input-icon-row">
            <svg
              class="icon"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle
                cx="8"
                cy="8"
                r="6.5"
                stroke="#9ca3af"
                stroke-width="1.5"
              />
              <path
                d="M8 5v3.5l2.5 1.5"
                stroke="#9ca3af"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <input v-model="form.time" type="time" aria-label="Event time" />
          </div>
          <div class="field input-icon-row">
            <svg
              class="icon"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle
                cx="8"
                cy="9"
                r="5.5"
                stroke="#9ca3af"
                stroke-width="1.5"
              />
              <path
                d="M8 6.5v2.5l1.5 1"
                stroke="#9ca3af"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <path
                d="M6 1h4M8 1v2"
                stroke="#9ca3af"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <input
              v-model.number="form.duration"
              type="number"
              min="1"
              max="480"
              aria-label="Duration in minutes"
              :aria-invalid="durationError ? 'true' : undefined"
              @input="durationError = false"
            />
          </div>
          <span v-if="durationError" role="alert" class="field-error"
            >Duration must be between 1 and 480 minutes.</span
          >
          <div class="field">
            <div class="swatches" role="radiogroup" aria-label="Event color">
              <button
                v-for="(c, index) in EVENT_COLORS"
                :key="c.hex"
                :ref="
                  (el) => {
                    if (el) swatchRefs[index] = el as HTMLButtonElement;
                  }
                "
                type="button"
                role="radio"
                :aria-checked="form.color === c.hex"
                :aria-label="COLOR_NAMES[c.hex] ?? c.hex"
                class="color-swatch"
                :class="{ selected: form.color === c.hex }"
                :style="{ backgroundColor: c.hex, '--swatch-color': c.hex }"
                :tabindex="form.color === c.hex ? 0 : -1"
                @click="form.color = c.hex"
                @keydown="onSwatchKeydown($event, index)"
              />
            </div>
          </div>
          <div class="field">
            <textarea
              v-model="form.notes"
              aria-label="Event notes"
              placeholder="Add notes (optional)"
              maxlength="500"
              rows="2"
              class="notes-textarea"
            />
          </div>
        </div>

        <!-- FOOTER -->
        <div class="modal-footer">
          <template v-if="mode === 'view'">
            <button type="button" class="btn-close-view" @click="emit('close')">
              CLOSE
            </button>
            <button
              ref="editBtnRef"
              type="button"
              class="btn-edit"
              @click="switchToEdit"
            >
              EDIT
            </button>
          </template>
          <template v-else>
            <button type="button" class="btn-discard" @click="discardEdit">
              DISCARD
            </button>
            <button type="button" class="btn-save" @click="saveEdit">
              SAVE
            </button>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.event-view-modal {
  position: fixed;
  width: 320px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 10px 15px -3px rgb(0 0 0 / 0.1);
  z-index: 9999;
  font-family: inherit;
}
.event-view-modal::after {
  content: "";
  position: absolute;
  bottom: -8px;
  left: var(--arrow-x, 50%);
  transform: translateX(-50%);
  border: 8px solid transparent;
  border-top-color: #ffffff;
  border-bottom: none;
  pointer-events: none;
}
.event-view-modal.modal--flipped::after {
  top: -8px;
  bottom: unset;
  border-top: none;
  border-bottom: 8px solid #ffffff;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
.modal-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
.header-title-text {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.header-edit-label {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.btn-trash {
  background: none;
  border: none;
  cursor: pointer;
  color: #ef4444;
  padding: 4px;
  display: flex;
  align-items: center;
}
.btn-trash:hover {
  opacity: 0.8;
}
.btn-trash:focus-visible {
  outline: 2px solid #ef4444;
  outline-offset: 2px;
  border-radius: 2px;
}
.btn-close-x {
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  font-size: 18px;
  padding: 0 4px;
  line-height: 1;
}
.btn-close-x:hover {
  color: #374151;
}
.btn-close-x:focus-visible {
  outline: 2px solid #6c7ee1;
  outline-offset: 2px;
  border-radius: 2px;
}
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.view-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  padding: 4px 0;
}
.view-icon {
  flex-shrink: 0;
  width: 16px;
}
.field {
  margin-bottom: 12px;
}
.field-title input {
  border: none;
  border-bottom: 1.5px solid #e5e7eb;
  border-radius: 0;
  outline: none;
  font-size: 15px;
  width: 100%;
  padding: 4px 0;
  background: transparent;
  font-family: inherit;
}
.field-title input:focus {
  border-bottom-color: #6c7ee1;
}
.field-title input.error {
  border-bottom-color: #ef4444;
}
.field-error {
  display: block;
  color: #ef4444;
  font-size: 11px;
  margin-top: 2px;
}
.input-icon-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.input-icon-row .icon {
  flex-shrink: 0;
}
.input-icon-row input {
  flex: 1;
  border: none;
  border-bottom: 1.5px solid #e5e7eb;
  outline: none;
  font-size: 14px;
  padding: 4px 0;
  background: transparent;
  font-family: inherit;
  color: #374151;
}
.input-icon-row input:focus {
  border-bottom-color: #6c7ee1;
}
.swatches {
  display: flex;
  gap: 8px;
  align-items: center;
}
.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  transition: box-shadow 0.15s;
}
.color-swatch:focus {
  outline: none;
}
.color-swatch:focus-visible {
  outline: 2px solid #6c7ee1;
  outline-offset: 2px;
}
.color-swatch.selected {
  box-shadow:
    0 0 0 2px #ffffff,
    0 0 0 4px var(--swatch-color, #6c7ee1);
}
.notes-textarea {
  width: 100%;
  border: none;
  border-bottom: 1.5px solid #e5e7eb;
  outline: none;
  font-size: 13px;
  padding: 4px 0;
  background: transparent;
  font-family: inherit;
  resize: vertical;
}
.notes-textarea:focus {
  border-bottom-color: #6c7ee1;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}
.btn-close-view,
.btn-discard {
  background: none;
  border: none;
  cursor: pointer;
  color: #ef4444;
  font-weight: 500;
  font-size: 14px;
  padding: 6px 12px;
  font-family: inherit;
}
.btn-close-view:hover,
.btn-discard:hover {
  opacity: 0.8;
}
.btn-close-view:focus-visible,
.btn-discard:focus-visible {
  outline: 2px solid #ef4444;
  outline-offset: 2px;
  border-radius: 4px;
}
.btn-edit,
.btn-save {
  background: #eef0fc;
  border: none;
  cursor: pointer;
  color: #6c7ee1;
  font-weight: 500;
  font-size: 14px;
  padding: 6px 16px;
  border-radius: 6px;
  font-family: inherit;
}
.btn-edit:hover,
.btn-save:hover {
  background: #dde1f8;
}
.btn-edit:focus-visible,
.btn-save:focus-visible {
  outline: 2px solid #6c7ee1;
  outline-offset: 2px;
}
.modal-enter-active,
.modal-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
