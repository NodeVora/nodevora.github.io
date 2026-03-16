import { renderMarkdown } from "./markdown.js";
import { addFact, getRelevantFacts } from "./memory.js";
import { getEngine } from "./llm.js";

const chatBox = document.getElementById("chat");
const input = document.getElementById("input");

let chats = {};
let currentChatId = null;

export function initChatManager() {

  chats = JSON.parse(localStorage.getItem("nodevora_chats") || "{}");
  currentChatId = localStorage.getItem("nodevora_current_chat");

}

export function createNewChat() {

  const id = "chat_" + Date.now();

  chats[id] = {
    id,
    title: "New Chat",
    messages: []
  };

  currentChatId = id;

}

export function addMessage(role, text) {

  const div = document.createElement("div");

  div.className = "msg " + role;

  div.innerHTML = renderMarkdown(text);

  chatBox.appendChild(div);
}

export async function sendMessage() {

  const text = input.value.trim();

  if (!text) return;

  addMessage("you", text);

  input.value = "";

  addFact(text);

  const facts = getRelevantFacts(text);

  const engine = getEngine();

  const messages = [
    { role: "system", content: facts.join("\n") },
    { role: "user", content: text }
  ];

  const reply = await engine.chat.completions.create({
    messages
  });

  addMessage("ai", reply.choices[0].message.content);
}
