import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SocketProvider } from "./context/SocketContext";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import './index.css'

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SocketProvider>
      <App />
      <Toaster />
    </SocketProvider>
  </StrictMode>,
);
