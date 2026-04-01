<script setup lang="ts">
import AppSidebar from "./AppSidebar.vue";
import AppHeader from "./AppHeader.vue";

const props = withDefaults(
  defineProps<{
    activeItem?: string;
  }>(),
  {
    activeItem: "Calendar",
  },
);
</script>

<template>
  <div class="app-layout">
    <AppSidebar :active-item="props.activeItem" />
    <div class="app-layout__right">
      <AppHeader />
      <main class="app-layout__content">
        <h1 class="page-header">Calendar</h1>
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-layout {
  display: flex;
  flex-direction: row;
  height: 100vh;
  overflow: hidden;
}

.app-layout__right {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.app-layout__content {
  background-color: #f0f0f7;
  padding: 32px 95px 103px 75px;
  flex: 1;
  overflow-y: auto;
  .page-header {
    font-size: 28px;
    font-weight: normal;
    color: $side-bar-color;
    margin-bottom: 32px;
  }
}
</style>
