<template>
  <div class="">
    <span class="message abso">
      <slot></slot>
    </span>
  </div>
</template>

<script>
  export default {
    name: 'message',
    props: ['corners'],
  }
</script>

<style>
@import url("./sum.css");
.message {
  border: 1px solid #2C3E50;
  border-radius: 5px;
  background-color: white;
}
</style>
