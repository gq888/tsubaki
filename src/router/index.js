import Vue from "vue";
import VueRouter from "vue-router";
import Sum from "@/components/sum.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    redirect: "/blackjack"
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
