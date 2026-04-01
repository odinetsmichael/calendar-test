<script setup lang="ts">
import BaseSearch from "../ui/BaseSearch.vue";
import BaseIcon from "../ui/BaseIcon.vue";

const props = withDefaults(
  defineProps<{
    chatBadgeCount?: number;
  }>(),
  {
    chatBadgeCount: 0,
  },
);

const hasNotification = true;
</script>

<template>
  <header class="app-header">
    <BaseSearch placeholder="Search transactions, invoices or help" />

    <div class="header-icons" role="toolbar">
      <BaseIcon name="help_outline" class="icon" />
      <BaseIcon name="message" class="icon" />
      <BaseIcon
        name="bell"
        class="icon bell"
        :class="{ notification: hasNotification }"
      />
    </div>

    <div class="header-divider" />

    <!-- User profile -->
    <div type="button" class="user-profile" aria-label="User menu">
      <span class="user-name">John Doe</span>
      <BaseIcon name="arrow-bottom" class="icon" />
      <div class="avatar">
        <img src="@/assets/images/avatar.png" alt="avatar" />
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  display: flex;
  height: 70px;
  background: #ffff;
  box-shadow: 0px 2px 6px #0000000a;
  align-items: center;
  padding: 16px 20px;
  gap: 20px;
  .header-icons {
    display: flex;
    align-items: center;
    gap: 30px;
    position: relative;

    .icon {
      cursor: pointer;
    }
    .bell {
      position: relative;
    }
    .notification {
      &::after {
        content: "";
        position: absolute;
        top: -5px;
        right: -3px;
        width: 10px;
        height: 10px;
        border-radius: 100%;
        border: 2px solid white;
        background-color: $notification-color;
      }
    }
  }
  .header-divider {
    width: 1px;
    height: 28px;
    background: #ebebf2;
  }
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 11px;
  cursor: pointer;
  flex-shrink: 0;
  background: transparent;
  border: none;
  padding: 0;
  .user-name {
    color: $default-text-color;
    font-size: 13px;
  }
  .avatar {
    border-radius: 100%;
    width: 38px;
    height: 38px;
    img {
      object-fit: cover;
      border-radius: 100%;
      width: 38px;
      height: 38px;
    }
  }
}
</style>
