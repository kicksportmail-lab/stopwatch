import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("=== MAIN.TSX STARTED ===");

const rootElement = document.getElementById("root");
console.log("Root element:", rootElement);

if (!rootElement) {
    document.body.innerHTML = '<h1 style="color:red;padding:20px;">ERROR: Root element not found!</h1>';
    throw new Error("Root element not found");
}

try {
    console.log("Creating React root...");
    const root = createRoot(rootElement);

    console.log("Rendering App...");
    root.render(<App />);

    console.log("=== APP RENDERED SUCCESSFULLY ===");
} catch (error) {
    console.error("=== RENDER ERROR ===", error);
    document.body.innerHTML = `<h1 style="color:red;padding:20px;">RENDER ERROR: ${error}</h1>`;
}
