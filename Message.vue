<template>
    <div class="msg" :class="{ multiline }" @click="onMessageClick">
      <span v-html="textEscaped"></span>
    </div>
</template>

<script lang="ts" src="./Message.ts"></script>