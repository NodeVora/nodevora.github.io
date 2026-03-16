let factMemory = [];

try {
  const stored = localStorage.getItem("fact_memory");
  if (stored) factMemory = JSON.parse(stored);
} catch {
  factMemory = [];
}

function saveFacts() {
  localStorage.setItem("fact_memory", JSON.stringify(factMemory));
}

export function addFact(text) {
  if (!factMemory.includes(text)) {
    factMemory.push(text);
    saveFacts();
  }
}

export function getRelevantFacts(query, topK = 5) {
  const keywords = query.toLowerCase().split(/\s+/);

  const scored = factMemory.map(fact => {
    const score = keywords.reduce(
      (a, k) => a + (fact.toLowerCase().includes(k) ? 1 : 0),
      0
    );
    return { fact, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored
    .filter(s => s.score > 0)
    .slice(0, topK)
    .map(s => s.fact);
}
