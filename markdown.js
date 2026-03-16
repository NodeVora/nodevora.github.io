export function renderMarkdown(text) {
  if (!text) return "";

  let t = text;

  t = t.replace(/```([\s\S]*?)```/gim, "<pre><code>$1</code></pre>");
  t = t.replace(/^### (.*)$/gim, "<h3>$1</h3>");
  t = t.replace(/^## (.*)$/gim, "<h2>$1</h2>");
  t = t.replace(/^# (.*)$/gim, "<h1>$1</h1>");
  t = t.replace(/\*\*(.*?)\*\*/gim, "<b>$1</b>");
  t = t.replace(/\*(.*?)\*/gim, "<i>$1</i>");
  t = t.replace(/`([^`]+)`/gim, "<code>$1</code>");
  t = t.replace(/\n/g, "<br>");

  return t.trim();
}
