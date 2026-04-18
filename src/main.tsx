import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// get the root element
const rootElement = document.getElementById("root");

// start the app
if (rootElement) {
    createRoot(rootElement).render(<App />);
} else {
    console.error("No root element found");
}
