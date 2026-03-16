import { CreateWebWorkerMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

let engine = null;

export async function initLLM() {

  const modelNameEl = document.getElementById("modelName");
  const llmStatusEl = document.getElementById("llmStatus");

  const model = "Qwen2.5-1.5B q4f16_1";
  const record = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

  modelNameEl.textContent = model;
  llmStatusEl.textContent = "Loading…";

  try {

    engine = await CreateWebWorkerMLCEngine(
      new Worker("worker.js", { type: "module" }),
      record
    );

    llmStatusEl.textContent = "Ready";

  } catch (err) {

    llmStatusEl.textContent = "Error";
    console.error(err);

  }
}

export function getEngine() {
  return engine;
}
