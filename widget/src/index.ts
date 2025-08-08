import React from "react";
import ReactDOM from "react-dom/client";
import Chat from "./Chat";
import "./styles.css";

interface ChatbotConfig {
  clientId: string;
  theme?: {
    primary_color: string;
    background_color: string;
    text_color: string;
  };
  welcome_message?: string;
  position?: "bottom-right" | "bottom-left";
  enabled?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL;
const WEB_SOCKET_URL = import.meta.env.VITE_WEB_SOCKET_URL;

class ChatbotWidget {
  private container: HTMLDivElement | null = null;
  private root: any = null;
  private config: ChatbotConfig;
  private websocket: WebSocket | null = null;

  constructor(config: ChatbotConfig) {
    this.config = config;
    this.init();
  }

  private async init() {
    await this.loadConfig();
    this.createContainer();
    this.render();
    this.setupWebSocket();
  }

  private async loadConfig() {
    try {
      console.log("Loading chatbot config from server...");
      const response = await fetch(`${API_URL}/config/${this.config.clientId}`);
      if (response.ok) {
        const serverConfig = await response.json();
        this.config = { ...this.config, ...serverConfig };
      }
    } catch (error) {
      console.error("Failed to load chatbot config:", error);
    }
  }

  private createContainer() {
    this.container = document.createElement("div");
    this.container.id = "chatbot-widget-container";
    this.container.style.cssText = `
      position: fixed;
      ${this.config.position === "bottom-left" ? "left: 20px;" : "right: 20px;"}
      bottom: 20px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    `;
    document.body.appendChild(this.container);
  }

  private render() {
    if (!this.container || !this.config.enabled) return;

    this.root = ReactDOM.createRoot(this.container);
    this.root.render(
      React.createElement(Chat, {
        config: this.config,
        onConfigUpdate: (newConfig: any) => {
          this.config = { ...this.config, ...newConfig };
          this.render(); // Re-render with new config
        },
      })
    );
  }

  private setupWebSocket() {
    const wsUrl = `${WEB_SOCKET_URL}/realtime/${this.config.clientId}`;

    try {
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          this.config = { ...this.config, ...update };
          this.render();
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      this.websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Failed to setup WebSocket:", error);
    }
  }

  public destroy() {
    if (this.websocket) {
      this.websocket.close();
    }
    if (this.root) {
      this.root.unmount();
    }
    if (this.container) {
      document.body.removeChild(this.container);
    }
  }
}

function initializeWidget() {
  const scripts = document.querySelectorAll("script[data-client-id]");

  scripts.forEach((script) => {
    const clientId = script.getAttribute("data-client-id");
    const position =
      (script.getAttribute("data-position") as
        | "bottom-right"
        | "bottom-left") || "bottom-right";

    if (clientId) {
      new ChatbotWidget({
        clientId,
        position,
      });
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeWidget);
} else {
  initializeWidget();
}
