import Vue from "vue";
import VueRouter from "vue-router";
import Sum from "@/components/sum.vue";
import Fish from "@/components/fish.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    redirect: "/fish"
  },
  {
    path: "/fish",
    component: Fish
  },
  {
    path: "/blackjack",
    component: Sum
  }
];

const router = new VueRouter({
  routes
});

export default router;
