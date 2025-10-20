import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
// import { preload } from "./utils/help.js";

// preload();

const app = createApp(App);
app.use(router);
app.use(store);
app.mount("#app");
