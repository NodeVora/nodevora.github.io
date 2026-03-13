import { CreateWebWorkerMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

/* =========================
   DOM REFERENCES
========================= */

const chatBox = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const sidebar = document.getElementById("sidebar");
const collapseBtn = document.getElementById("collapseBtn");
const ramUsageEl = document.getElementById("ramUsage");
const netSpeedEl = document.getElementById("netSpeed");
const netStatusEl = document.getElementById("netStatus");
const main = document.getElementById("main");
const scrollBtn = document.getElementById("scrollDownBtn");
const chatListEl = document.getElementById("chatList");
const newChatBtn = document.getElementById("newChatBtn");

let engine = null;

/* =========================
   MARKDOWN RENDERER
========================= */

function renderMarkdown(text) {
  if (!text) return "";
  let t = text;

  t = t.replace(/```([\s\S]*?)```/gim, "<pre><code>$1</code></pre>");
  t = t.replace(/^### (.*)$/gim, "<h3>$1</h3>");
  t = t.replace(/^## (.*)$/gim, "<h2>$1</h2>");
  t = t.replace(/^# (.*)$/gim, "<h1>$1</h1>");
  t = t.replace(/\*\*(.*?)\*\*/gim, "<b>$1</b>");
  t = t.replace(/\*(.*?)\*/gim, "<i>$1</i>");
  t = t.replace(/`([^`]+)`/gim, "<code>$1</code>");
  t = t.replace(/^\s*[-*] (.*)$/gim, "<ul><li>$1</li></ul>");
  t = t.replace(/\n/g, "<br>");

  return t.trim();
}

/* =========================
   MEMORY STORAGE (FACTS)
========================= */

let factMemory = [];
try {
  const storedFacts = localStorage.getItem("fact_memory");
  if (storedFacts) factMemory = JSON.parse(storedFacts);
} catch {
  factMemory = [];
}

function saveFacts() {
  localStorage.setItem("fact_memory", JSON.stringify(factMemory));
}

function addFact(text) {
  if (!factMemory.includes(text)) {
    factMemory.push(text);
    saveFacts();
  }
}

function getRelevantFacts(query, topK = 5) {
  const keywords = query.toLowerCase().split(/\s+/);
  const scored = factMemory.map(fact => {
    const score = keywords.reduce(
      (acc, kw) => acc + (fact.toLowerCase().includes(kw) ? 1 : 0),
      0
    );
    return { fact, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.filter(s => s.score > 0).slice(0, topK).map(s => s.fact);
}

/* =========================
   CHAT MANAGER (LOCAL STORAGE)
========================= */

let chats = {};
let currentChatId = null;

try {
  chats = JSON.parse(localStorage.getItem("nodevora_chats") || "{}");
  currentChatId = localStorage.getItem("nodevora_current_chat") || null;
} catch {
  chats = {};
  currentChatId = null;
}

function saveChats() {
  localStorage.setItem("nodevora_chats", JSON.stringify(chats));
  localStorage.setItem("nodevora_current_chat", currentChatId || "");
}

function createNewChat() {
  const id = "chat_" + Date.now();
  chats[id] = {
    id,
    title: "New Chat",
    messages: []
  };
  currentChatId = id;
  saveChats();
  renderChatList();
  chatBox.innerHTML = "";
  scrollToBottom({ smooth: false });
}

function renderChatList() {
  chatListEl.innerHTML = "";

  const chatArray = Object.values(chats).sort((a, b) => b.id.localeCompare(a.id));

  chatArray.forEach(chat => {
    const div = document.createElement("div");
    div.className = "chat-entry";

    div.innerHTML = `
      <div class="chat-entry-title">${chat.title || "Chat"}</div>
      <div class="delete-chat">✕</div>
    `;

    div.onclick = (e) => {
      if (e.target.classList.contains("delete-chat")) return;
      loadChatById(chat.id);
    };

    div.querySelector(".delete-chat").onclick = (e) => {
      e.stopPropagation();
      delete chats[chat.id];

      if (currentChatId === chat.id) {
        const ids = Object.keys(chats);
        currentChatId = ids[0] || null;
      }

      saveChats();
      renderChatList();

      if (currentChatId && chats[currentChatId]) {
        loadChatById(currentChatId);
      } else {
        chatBox.innerHTML = "";
      }
    };

    chatListEl.appendChild(div);
  });
}

let suppressSave = false;

function loadChatById(id) {
  if (!chats[id]) return;
  currentChatId = id;
  saveChats();

  chatBox.innerHTML = "";
  suppressSave = true;
  chats[id].messages.forEach(m => addMessage(m.role, m.text));
  suppressSave = false;

  scrollToBottom({ smooth: false });
}

/* =========================
   SCROLL HELPERS
========================= */

function scrollToBottom(options = { smooth: true }) {
  main.scrollTo({
    top: main.scrollHeight,
    behavior: options.smooth ? "smooth" : "auto"
  });
}

function isNearBottom(threshold = 200) {
  return main.scrollHeight - main.scrollTop - main.clientHeight < threshold;
}

/* =========================
   UI: MESSAGE BUBBLES
========================= */

function addMessage(role, text) {
  const div = document.createElement("div");

  div.className =
    role === "you" ? "msg you" :
    role === "ai" ? "msg ai" :
    "msg system";

  div.innerHTML = renderMarkdown(text);
  chatBox.appendChild(div);

  if (!suppressSave && currentChatId && chats[currentChatId]) {
    chats[currentChatId].messages.push({ role, text });

    if (
      role === "you" &&
      (!chats[currentChatId].title || chats[currentChatId].title === "New Chat")
    ) {
      chats[currentChatId].title = text.slice(0, 30) || "Chat";
    }

    saveChats();
    renderChatList();
  }

  if (isNearBottom(220)) scrollToBottom({ smooth: true });
}

/* =========================
   THINKING DOTS
========================= */

function showThinking() {
  const div = document.createElement("div");
  div.className = "thinking";
  div.id = "thinkingBubble";
  div.innerHTML = `
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
  `;
  chatBox.appendChild(div);
  scrollToBottom({ smooth: true });
}

function removeThinking() {
  const t = document.getElementById("thinkingBubble");
  if (t) t.remove();
}

/* =========================
   SIDEBAR COLLAPSE
========================= */

let collapsed = localStorage.getItem("sidebarCollapsed") === "true";

function applySidebarState() {
  if (collapsed) {
    sidebar.classList.add("collapsed");
    document.body.classList.add("sidebar-collapsed");
  } else {
    sidebar.classList.remove("collapsed");
    document.body.classList.remove("sidebar-collapsed");
  }
}

applySidebarState();

collapseBtn.onclick = () => {
  collapsed = !collapsed;
  localStorage.setItem("sidebarCollapsed", collapsed);
  applySidebarState();
};

/* =========================
   SYSTEM PANEL: RAM
========================= */

function updateRAM() {
  if (performance && performance.memory) {
    const used = performance.memory.usedJSHeapSize;
    const total = performance.memory.jsHeapSizeLimit;
    const pct = ((used / total) * 100).toFixed(1);
    ramUsageEl.textContent = pct + "%";
  } else {
    ramUsageEl.textContent = "--";
  }
}
setInterval(updateRAM, 2000);

/* =========================
   SYSTEM PANEL: NETWORK STATUS
========================= */

function updateNetworkStatus() {
  netStatusEl.textContent = navigator.onLine ? "Online" : "Offline";
}
window.addEventListener("online", updateNetworkStatus);
window.addEventListener("offline", updateNetworkStatus);
updateNetworkStatus();

/* =========================
   SYSTEM PANEL: SPEED TEST
========================= */

async function testNetworkSpeed() {
  const start = performance.now();
  try {
    await fetch("https://speed.cloudflare.com/__down?bytes=1000000", {
      cache: "no-store"
    });
    const duration = (performance.now() - start) / 1000;
    const mbps = (8 / duration).toFixed(1);
    netSpeedEl.textContent = mbps + " Mbps";
  } catch {
    netSpeedEl.textContent = "--";
  }
}
setInterval(testNetworkSpeed, 5000);

/* =========================
   INIT MODEL - Qwen2.5-1.5B
========================= */

async function initLLM() {
  addMessage("system", "Loading Qwen2.5‑1.5B‑Instruct…");

  try {
    engine = await CreateWebWorkerMLCEngine(
      new Worker("worker.js", { type: "module" }),
      "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
      {
        model_url: "https://huggingface.co/mlc-ai/Qwen2.5-1.5B-Instruct-q4f16_1-MLC/",
        initProgressCallback: (report) => {
          const pct = Math.round(report.progress * 100);
          addMessage("system", `${report.text || "Loading…"} (${pct}%)`);
        }
      }
    );

    addMessage("system", "Model loaded. Ready.");
  } catch (err) {
    addMessage("system", "Model load failed: " + err.message);
  }
}

/* =========================
   INTERNET SEARCH
========================= */

async function webSearch(query) {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) return "No results.";

    return data
      .map(
        (r, i) =>
          `${i + 1}. ${r.title}\n${r.url}\n${r.snippet || ""}`
      )
      .join("\n\n");
  } catch (e) {
    return "Search failed: " + e.message;
  }
}

/* =========================
   SCROLL-TO-BOTTOM BUTTON
========================= */

scrollBtn.addEventListener("click", () => {
  scrollToBottom({ smooth: true });
});

main.addEventListener("scroll", () => {
  if (isNearBottom(120)) {
    scrollBtn.classList.remove("show");
  } else {
    scrollBtn.classList.add("show");
  }
});

/* =========================
   BUILD LLM MESSAGES
========================= */

function buildLLMMessages(systemContent) {
  const chat = chats[currentChatId];
  const history = chat ? chat.messages : [];

  const llmHistory = history
    .filter(m => m.role === "you" || m.role === "ai")
    .map(m => ({
      role: m.role === "you" ? "user" : "assistant",
      content: m.text
    }));

  return [
    { role: "system", content: systemContent },
    ...llmHistory
  ];
}

/* =========================
   SEND MESSAGE
========================= */

sendBtn.onclick = async () => {
  const text = input.value.trim();
  if (!text) return;

  if (!currentChatId || !chats[currentChatId]) {
    createNewChat();
  }

  addMessage("you", text);
  input.value = "";

  addFact(text);

  const relevantFacts = getRelevantFacts(text);
  const memoryPrompt = relevantFacts.length
    ? "Relevant memory:\n" + relevantFacts.join("\n")
    : "";

  let searchContext = "";

  if (text.toLowerCase().startsWith("search ")) {
    const q = text.slice(7).trim() || text;
    addMessage("system", `Searching: ${q}`);
    searchContext = await webSearch(q);
  }

  const systemParts = [];
  if (memoryPrompt) systemParts.push(memoryPrompt);
  if (searchContext) systemParts.push("Web search results:\n" + searchContext);

  const systemContent =
    systemParts.join("\n\n") || "You are Nodevora, a helpful assistant.";

  const messages = buildLLMMessages(systemContent);

  showThinking();

  try {
    const reply = await engine.chat.completions.create({
      messages,
      stream: false
    });

    const aiText = reply.choices[0].message.content;

    removeThinking();
    addMessage("ai", aiText);
  } catch (e) {
    removeThinking();
    addMessage("system", "Error: " + e.message);
  }
};

/* =========================
   ENTER KEY HANDLING
========================= */

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

/* =========================
   STARTUP
========================= */

newChatBtn.onclick = createNewChat;   // <-- FIXED

renderChatList();

if (currentChatId && chats[currentChatId]) {
  loadChatById(currentChatId);
} else {
  createNewChat();
}

initLLM();
