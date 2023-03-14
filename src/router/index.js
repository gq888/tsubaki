import Vue from "vue";
import VueRouter from "vue-router";
import Sum from "@/components/sum.vue";
import Fish from "@/components/fish.vue";
import point24 from "@/components/point24.vue";
import Month from "@/components/month.vue";
import Tortoise from "@/components/Tortoise.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    redirect: "/month"
  },
  {
    path: "/month",
    component: Month
  },
  {
    path: "/fish",
    component: Fish
  },
  {
    path: "/point24",
    component: point24
  },
  {
    path: "/blackjack",
    component: Sum
  },
  {
    path: "/Tortoise",
    component: Tortoise
  },
];

const router = new VueRouter({
  routes
});

export default router;
