import Vue from "vue";
import VueRouter from "vue-router";
import Sum from "@/components/sum.vue";
import Fish from "@/components/fish.vue";
import point24 from "@/components/point24.vue";
import Month from "@/components/month.vue";
import Tortoise from "@/components/Tortoise.vue";
import Sort from "@/components/Sort.vue";
import Pairs from "@/components/Pairs.vue";
import Spider from "@/components/Spider.vue";
import Chess from "@/components/Chess.vue";

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
  {
    path: "/Sort",
    component: Sort
  },
  {
    path: "/Pairs",
    component: Pairs
  },
  {
    path: "/Spider",
    component: Spider
  },
  {
    path: "/Chess",
    component: Chess
  }
];

const router = new VueRouter({
  routes
});

export default router;
