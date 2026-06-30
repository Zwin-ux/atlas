import { createRoot } from "react-dom/client";
import { App } from "./App";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root element for Atlas widget.");
}

createRoot(root).render(<App />);
