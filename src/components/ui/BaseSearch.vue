<script setup lang="ts">
import BaseIcon from "./BaseIcon.vue";
const props = defineProps<{
  placeholder?: string;
}>();
</script>

<template>
  <div class="search-wrapper">
    <BaseIcon name="icon_search" class="icon" />
    <input
      class="search-input"
      type="search"
      :placeholder="placeholder"
      maxlength="500"
      aria-label="Search"
    />
  </div>
</template>
<style scoped lang="scss">
.search-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  .icon {
    cursor: pointer;
    height: 16px;
    width: 16px;
    margin-right: 10px;
  }
  .search-input {
    width: 100%;
    border: none;
    height: 100%;
    outline: none;
    &::placeholder {
      color: $default-text-color;
      font-size: 13px;
    }
  }
}
</style>
