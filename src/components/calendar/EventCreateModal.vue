<script setup lang="ts">
import { ref, reactive, watch, nextTick, onMounted, onUnmounted } from "vue";
import { useEventsStore } from "@/stores/events";
import { EVENT_COLORS } from "@/types";
import type { EventColor } from "@/types";
import BaseIcon from "../ui/BaseIcon.vue";

const props = defineProps<{
  visible: boolean;
  anchorEl: HTMLElement | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [eventId: string];
}>();

const store = useEventsStore();

const MODAL_WIDTH = 320;
const MODAL_HEIGHT = 280;
const ARROW_HEIGHT = 8;
const VIEWPORT_PAD = 8;

const modalRef = ref<HTMLDivElement | null>(null);
const titleInput = ref<HTMLInputElement | null>(null);
const swatchRefs = ref<HTMLButtonElement[]>([]);

const positionStyle = ref<Record<string, string>>({});
const isFlipped = ref(false);
const titleError = ref(false);

const form = reactive({
  notes: "",
  title: "",
  date: "",
  time: "09:00",
  color: EVENT_COLORS[0].hex as EventColor,
});

function todayStr(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function calcPosition(anchorEl: HTMLElement): {
  top: number;
  left: number;
  flipped: boolean;
  rect: DOMRect;
} {
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

  left = Math.max(VIEWPORT_PAD, left);
  left = Math.min(left, window.innerWidth - MODAL_WIDTH - VIEWPORT_PAD);

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

function onSwatchKeydown(e: KeyboardEvent, index: number) {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    const next = (index + 1) % EVENT_COLORS.length;
    form.color = EVENT_COLORS[next].hex;
    swatchRefs.value[next]?.focus();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    const prev = (index - 1 + EVENT_COLORS.length) % EVENT_COLORS.length;
    form.color = EVENT_COLORS[prev].hex;
    swatchRefs.value[prev]?.focus();
  }
}

function trapFocus(e: KeyboardEvent) {
  if (!modalRef.value) return;
  const focusableSelector =
    'input, button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const els = Array.from(
    modalRef.value.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter((el) => !("disabled" in el && (el as HTMLButtonElement).disabled));
  if (els.length === 0) return;
  const first = els[0];
  const last = els[els.length - 1];
  if (e.key === "Tab") {
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

function onDocumentKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") emit("close");
}

function onDocumentMousedown(e: MouseEvent) {
  if (modalRef.value && !modalRef.value.contains(e.target as Node)) {
    emit("close");
  }
}

function validate(): boolean {
  titleError.value = false;
  if (!form.title.trim()) {
    titleError.value = true;
    nextTick(() => titleInput.value?.focus());
    return false;
  }
  return true;
}

function handleSave() {
  if (!validate()) return;
  const id = store.addEvent({
    notes: form.notes.trim(),
    title: form.title.trim(),
    date: form.date,
    time: form.time,
    color: form.color,
    duration: 60,
  });
  store.selectedEventId = id;
  emit("saved", id);
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      form.title = "";
      form.date = store.selectedDate ?? todayStr();
      form.time = store.selectedTime ?? "09:00";
      form.color = EVENT_COLORS[0].hex;
      form.notes = "";
      titleError.value = false;
      document.addEventListener("mousedown", onDocumentMousedown);
      document.addEventListener("keydown", onDocumentKeydown);
      nextTick(() => {
        titleInput.value?.focus();
        applyPosition();
      });
    } else {
      document.removeEventListener("mousedown", onDocumentMousedown);
      document.removeEventListener("keydown", onDocumentKeydown);
    }
  },
  { immediate: true },
);
const dateInput = ref<HTMLInputElement | null>(null);
function openCalendar() {
  dateInput.value?.showPicker();
}
const timeInput = ref<HTMLInputElement | null>(null);
function openTime() {
  timeInput.value?.showPicker();
}
watch(
  () => props.anchorEl,
  () => {
    if (props.visible) applyPosition();
  },
);

onMounted(() => {
  window.addEventListener("resize", onResize, { passive: true });
});
onUnmounted(() => {
  window.removeEventListener("resize", onResize);
  if (rafId !== null) cancelAnimationFrame(rafId);
  document.removeEventListener("mousedown", onDocumentMousedown);
  document.removeEventListener("keydown", onDocumentKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="props.visible"
        ref="modalRef"
        class="modal"
        :class="{ flip: isFlipped }"
        :style="positionStyle"
        @keydown="trapFocus"
        role="dialog"
        aria-modal="true"
        aria-label="Create event"
      >
        <button class="btn-close" aria-label="Close" @click="emit('close')" />

        <div class="fields">
          <div class="field">
            <input
              ref="titleInput"
              v-model="form.title"
              type="text"
              placeholder="event name"
              class="field-input"
              :class="{ error: titleError }"
              aria-label="Event name"
              :aria-invalid="titleError ? 'true' : undefined"
              :aria-describedby="titleError ? 'title-error' : undefined"
            />
            <span
              v-if="titleError"
              id="title-error"
              class="field-error"
              role="alert"
              >Event name is required</span
            >
          </div>

          <div class="field input-icon-row">
            <input
              ref="dateInput"
              v-model="form.date"
              type="date"
              aria-label="Event date"
              class="field-input field-input-calendar"
              id="calendar-input"
            />
            <BaseIcon
              name="small-calendar"
              class="icon"
              @click="openCalendar"
            />
          </div>

          <div class="field input-icon-row">
            <input
              ref="timeInput"
              v-model="form.time"
              type="time"
              aria-label="Event time"
              class="field-input-time"
            />
            <BaseIcon name="clock" class="icon" @click="openTime" />
          </div>

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
                role="radio"
                :aria-checked="form.color === c.hex"
                :aria-label="c.label"
                class="swatch"
                :class="{ selected: form.color === c.hex }"
                :style="{ backgroundColor: c.hex, '--swatch-color': c.hex }"
                :tabindex="form.color === c.hex ? 0 : -1"
                @click="form.color = c.hex"
                @keydown.enter.prevent="form.color = c.hex"
                @keydown.space.prevent="form.color = c.hex"
                @keydown="onSwatchKeydown($event, index)"
              />
            </div>
          </div>
          <div class="field">
            <input
              ref="titleInput"
              v-model="form.notes"
              type="text"
              placeholder="notes"
              class="field-input"
              aria-label="notes"
            />
          </div>
        </div>

        <div class="actions">
          <button class="btn-cancel" @click="emit('close')">Cancel</button>
          <button class="btn-save" @click="handleSave">Save</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal {
  position: fixed;
  border-radius: 10px;
  padding: 22px 27.5px 25px 25.5px;
  background: #ffffff 0% 0% no-repeat padding-box;
  border: 1px solid #43425d;
  box-shadow: 0px 3px 18px #00000029;
  width: 201px;
  z-index: 9999;
  .btn-close {
    position: absolute;
    display: flex;
    top: 6px;
    right: 7px;
    background: none;
    border: 2px solid #d6d6d6;
    border-radius: 100%;
    cursor: pointer;
    width: 20px;
    height: 20px;
    color: #9ca3af;
    padding: 0;
    transition: 0.4s ease-in-out;
    &::after {
      content: "✖";
      font-size: 10px;
      width: 100%;
      align-items: center;
      justify-content: center;
    }
    &:hover {
      color: #ff5f5f;
      border: 2px solid #ff5f5f;
    }
  }
  .fields {
    display: flex;
    flex-direction: column;
    gap: 20.5px;
    .field {
      width: 100%;
      height: 29px;
      border-bottom: 1px solid #d6d6d6;
      .field-input {
        position: relative;
        width: 100%;
        height: 100%;
        outline: none;
        border: unset;
      }
      .field-input-calendar {
        height: 100%;
        text-align: left;
        font-size: 9px !important;
        font-family: "Source Sans 3", sans-serif;
        color: #43425d;
        padding: 0;
      }
      .icon {
        cursor: pointer;
        margin-right: 3.1px;
      }
      /* Chrome, Safari, Edge */
      .field-input-calendar::-webkit-calendar-picker-indicator {
        opacity: 0;
        position: absolute;
        height: 100%;
        cursor: pointer;
      }
      /* Firefox (частично) */
      .field-input-calendar {
        position: relative;
      }
      .field-input::placeholder {
        position: absolute;
        top: 0;
        font-size: 9px !important;
        font-family: "Source Sans 3", sans-serif;
        color: #d6d6d6;
      }
      .field-input-time::-webkit-calendar-picker-indicator {
        opacity: 0;
        pointer-events: none;
      }
    }
  }
}

.modal::after {
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

.modal.flip::after {
  top: -8px;
  bottom: unset;
  border-top: none;
  border-bottom: 8px solid #ffffff;
}

.field-title input.error {
  border-bottom-color: #ef4444;
}

.field-error {
  display: block;
  color: #ef4444;
  font-size: 11px;
  margin-top: 4px;
}

.input-icon-row {
  display: flex;
  align-items: center;
  gap: 8px;
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
  height: 100%;
  width: 100%;
  display: flex;
  gap: 8px;
  align-items: center;
}
.swatch {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: box-shadow 0.15s;
}
.swatch:focus {
  outline: none;
}
.swatch:focus-visible {
  outline: 2px solid #6c7ee1;
  outline-offset: 2px;
}
.swatch.selected {
  box-shadow:
    0 0 0 2px #ffffff,
    0 0 0 4px var(--swatch-color, #6c7ee1);
}

.actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 30px;
  margin-bottom: 0;
}
.btn-cancel {
  background: none;
  border: none;
  cursor: pointer;
  color: #ff5f5f;
  font-weight: 500;
  font-size: 12px;
  padding: 6px 12px;
  transition: 0.4s ease-in-out;
}
.btn-cancel:hover {
  opacity: 0.8;
}
.btn-save {
  background: none;
  border: none;
  cursor: pointer;
  color: #6a6996;
  font-weight: 500;
  font-size: 12px;
  padding: 6px 12px;
  transition: 0.4s ease-in-out;
}
.btn-save:hover {
  opacity: 0.8;
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
