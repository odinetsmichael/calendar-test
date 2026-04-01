<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  name: string;
  fill?: string;
}>();

const icons = import.meta.glob("@/assets/icons/*.svg", {
  eager: true,
  import: "default",
});

const iconComponent = computed(() => {
  return icons[`/src/assets/icons/${props.name}.svg`];
});
</script>

<template>
  <div class="icon-item">
    <component :is="iconComponent" v-if="iconComponent" />
  </div>
</template>

<style scoped lang="scss">
.icon-item {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
