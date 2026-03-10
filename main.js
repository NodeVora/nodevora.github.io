import { CreateWebWorkerMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

const chatBox = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");

let engine = null;

/* =========================
   MEMORY STORAGE (SAFE)
========================= */

let conversationMemory = [];
try {
  const stored = localStorage.getItem("chat_memory");
  if (stored) conversationMemory = JSON.parse(stored);
} catch (e) {
  console.warn("Failed to parse chat_memory, resetting.", e);
  conversationMemory = [];
}

let factMemory = [];
try {
  const storedFacts = localStorage.getItem("fact_memory");
  if (storedFacts) factMemory = JSON.parse(storedFacts);
} catch (e) {
  console.warn("Failed to parse fact_memory, resetting.", e);
  factMemory = [];
}

const MAX_CONVERSATION = 20;

/* =========================
   SAVE MEMORY
========================= */

function saveMemory() {
  localStorage.setItem("chat_memory", JSON.stringify(conversationMemory));
  localStorage.setItem("fact_memory", JSON.stringify(factMemory));
}

/* =========================
   ADD FACTS
========================= */

function addFact(text) {
  if (!factMemory.includes(text)) {
    factMemory.push(text);
    saveMemory();
  }
}

/* =========================
   GET RELEVANT FACTS
========================= */

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
   TRIM CONVERSATION
========================= */

function trimConversation() {
  if (conversationMemory.length > MAX_CONVERSATION) {
    conversationMemory = conversationMemory.slice(-MAX_CONVERSATION);
  }
}

/* =========================
   UI
========================= */

function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = "msg";
  div.innerHTML = `<b>${role}:</b> ${text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

/* =========================
   LOAD CHAT
========================= */

function loadChat() {
  conversationMemory.forEach(m => {
    addMessage(m.role === "user" ? "you" : "ai", m.content);
  });
}

/* =========================
   INIT MODEL - Official Qwen2.5-1.5B from Hugging Face
========================= */
async function initLLM() {
  addMessage("system", "Loading official Qwen2.5-1.5B-Instruct-q4f16_1 from Hugging Face...");

  const modelRecord = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";
  const modelUrl = "https://huggingface.co/mlc-ai/Qwen2.5-1.5B-Instruct-q4f16_1-MLC/";

  try {
    engine = await CreateWebWorkerMLCEngine(
      new Worker("worker.js", { type: "module" }),
      modelRecord,
      {
        model_url: modelUrl,
        initProgressCallback: (report) => {
          // Show progress in chat (you can improve this with a progress bar later)
          const percent = Math.round(report.progress * 100);
          addMessage("loading", `${report.text || "Downloading model..."} (${percent}%)`);
        },
        // Optional: smaller chunks = better for slower connections / mobile
        // customConfig: {
        //   context_window_size: 8192,
        //   prefill_chunk_size: 512
        // }
      }
    );

    addMessage("system", "Qwen2.5-1.5B loaded successfully! You can start chatting.");
  } catch (err) {
    addMessage("system", "Failed to load model: " + err.message);
    console.error("Load error:", err);
  }
}

/* =========================
   INTERNET SEARCH (Azure Static Web Apps)
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
   SEND MESSAGE
========================= */

sendBtn.onclick = async () => {
  const text = input.value.trim();
  if (!text) return;

  addMessage("you", text);
  input.value = "";

  addFact(text);

  conversationMemory.push({ role: "user", content: text });
  trimConversation();
  saveMemory();

  const relevantFacts = getRelevantFacts(text);
  const memoryPrompt = relevantFacts.length
    ? "Relevant memory:\n" + relevantFacts.join("\n")
    : "";

  let searchContext = "";

  // trigger search if user starts with "search "
  if (text.toLowerCase().startsWith("search ")) {
    const q = text.slice(7).trim() || text;
    addMessage("system", `Searching: ${q}`);
    searchContext = await webSearch(q);
  }

  const systemParts = [];
  if (memoryPrompt) systemParts.push(memoryPrompt);
  if (searchContext) systemParts.push("Web search results:\n" + searchContext);

  const systemContent =
    systemParts.join("\n\n") || "You are a helpful assistant.";

  const messages = [
    { role: "system", content: systemContent },
    ...conversationMemory
  ];

  const reply = await engine.chat.completions.create({
    messages,
    stream: false
  });

  const aiText = reply.choices[0].message.content;

  addMessage("ai", aiText);

  conversationMemory.push({ role: "assistant", content: aiText });
  trimConversation();
  saveMemory();
};

/* =========================
   START
========================= */

loadChat();
initLLM();
