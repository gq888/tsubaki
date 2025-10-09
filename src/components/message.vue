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
  width: 10px;
  height: 10px;
}
.bubble2 {
  width: 6px;
  height: 6px;
  top: -4px;
  left: 1px;
}
.bubble3 {
  width: 4px;
  height: 4px;
  top: -9px;
  left: 1px;
}
.arrow .bubble {
  display: none;
}
.arrow {
  transform: rotate(45deg);
}
.bubble {
  border-radius: 100%;
  margin-top: -1px;
}
.direction1 {
  margin-left: -5px;
  top: -5px;
  left: 50%;
}
.message {
  /* border: 1px solid #2C3E50; */
  border-radius: 5px;
  padding: 5px;
  font-size: 16px;
  color: black;
  /* width: 100%; */
  opacity: 0.7;
}
</style>
