import { createApp } from "vue";
import { createPinia } from "pinia";
import { Button, Cell, Loading, Tag } from "vant";
import "./style.css";
import App from "./App.vue";
import { router } from "./router";
createApp(App)
  .use(createPinia())
  .use(router)
  .use(Button)
  .use(Cell)
  .use(Loading)
  .use(Tag)
  .mount("#app");
