<script setup lang="ts">
import BaseIcon from "@/components/ui/BaseIcon.vue";
withDefaults(
  defineProps<{
    activeItem?: string;
  }>(),
  {
    activeItem: "Calendar",
  },
);

const navItems = Object.freeze([
  { label: "Home", icon: "home" },
  { label: "Dashboard", icon: "dashboard" },
  { label: "Inbox", icon: "inbox" },
  { label: "Products", icon: "products" },
  { label: "Invoices", icon: "receipt_long" },
  { label: "Customers", icon: "people" },
  { label: "Chat Room", icon: "chat" },
  { label: "Calendar", icon: "calendar" },
  { label: "Help Center", icon: "help_outline" },
  { label: "Settings", icon: "settings" },
]);
</script>

<template>
  <aside class="app-sidebar">
    <!-- Logo -->
    <div class="sidebar-logo">
      <span class="sidebar-logo__text">IMPEKABLE</span>
    </div>
    <!-- Navigation -->
    <nav class="sidebar-nav" aria-label="Main navigation">
      <ul>
        <li
          v-for="item in navItems"
          :key="item.label"
          class="nav-item"
          :class="{ 'nav-item--active': item.label === 'Calendar' }"
        >
          <BaseIcon :name="item.icon" class="icon" fill="#A5A4BF" />
          {{ item.label }}
        </li>
      </ul>
    </nav>
  </aside>
</template>

<style lang="scss">
.app-sidebar {
  box-shadow: 0px 2px 6px #0000000a;
  width: 260px;
  flex-shrink: 0;
  background: $side-bar-color;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  .sidebar-logo {
    display: flex;
    align-items: center;
    justify-content: left;
    padding-left: 20px;
    width: 100%;
    height: 70px;
    flex-shrink: 0;
    background: $side-bar-color-header;
    .sidebar-logo__text {
      font-size: 21px;
      font-weight: bold;
      color: #ffffff;
      letter-spacing: 3px;
    }
  }
  .nav-item {
    display: flex;
    align-items: center;
    height: 53px;
    padding: 3px 25px;
    cursor: pointer;
    color: #ffffff;
    .icon {
      svg {
        fill: #a5a4bf;
      }
      margin-right: 11px;
    }
    &--active {
      position: relative;
      background: $side-bar-color-active-list;
      &::before {
        content: "";
        position: absolute;
        left: 0;
        z-index: 5;
        width: 5px;
        height: 53px;
        background-color: #a3a0fb;
      }
    }
  }
}
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 16px;
}
</style>
