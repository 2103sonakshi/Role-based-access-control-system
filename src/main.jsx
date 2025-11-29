import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Provider } from "react-redux";
import { persistor, store } from "./Redux/Store.js";
import { PersistGate } from "redux-persist/integration/react";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
  // 1. ADDED: React StrictMode is essential for catching hidden bugs
  <React.StrictMode>
    {/* 2. BrowserRouter wraps everything that uses routing */}
    <BrowserRouter>
      {/* Toaster is usually fine here */}
      <Toaster />
      {/* 3. Provider must wrap PersistGate which wraps the App */}
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <App />
        </PersistGate>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);
