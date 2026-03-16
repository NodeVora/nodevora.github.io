import { initLLM } from "./llm.js";
import { initSystemPanel } from "./system.js";
import { initSidebar } from "./sidebar.js";
import { initChatManager, sendMessage } from "./chat.js";
import { initScroll } from "./scroll.js";

const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const newChatBtn = document.getElementById("newChatBtn");

initSidebar();
initScroll();
initSystemPanel();
initChatManager();

sendBtn.onclick = sendMessage;

input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

newChatBtn.onclick = () => window.createNewChat();

initLLM();
