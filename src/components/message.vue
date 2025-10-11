<template>
  <div class="">
    <div class="message m-0 rela bg-fff" v-show="show">
      <slot></slot>
      <div class="abso corner bubble direction1 bg-fff">
        <div class="bubble bubble2 abso bg-fff"></div>
        <div class="bubble bubble3 abso bg-fff"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "message",
  props: ["corners", "show"],
  methods: {
    close() {
      this.$emit("close");
    },
  },
};
</script>

<style>
@import url("./sum.css");
.corner {
  width: 0.625rem;
  height: 0.625rem;
}
.bubble2 {
  width: 0.375rem;
  height: 0.375rem;
  top: -0.25rem;
  left: 0.0625rem;
}
.bubble3 {
  width: 0.25rem;
  height: 0.25rem;
  top: -0.5625rem;
  left: 0.0625rem;
}
.arrow .bubble {
  display: none;
}
.arrow {
  transform: rotate(45deg);
}
.bubble {
  border-radius: 100%;
  margin-top: -0.0625rem;
}
.direction1 {
  margin-left: -0.3125rem;
  top: -0.3125rem;
  left: 50%;
}
.message {
  /* border: 0.0625rem solid #2C3E50; */
  border-radius: 0.3125rem;
  padding: 0.3125rem;
  font-size: 1rem;
  color: black;
  /* width: 100%; */
  opacity: 0.7;
}
</style>
