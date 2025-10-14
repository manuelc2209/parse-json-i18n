import "@builder.io/qwik/qwikloader.js";

import { render } from "@builder.io/qwik";
import "./index.css";
import "./global.css";
import Component from "./editor/index.tsx";

render(document.getElementById("app") as HTMLElement, <Component />);
