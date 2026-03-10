export default async function (context, req) {
  const query = req.query.q || "";

  if (!query) {
    context.res = { status: 400, body: "Missing q parameter" };
    return;
  }

  const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  try {
    // Use global fetch if available, otherwise fallback
    const fetchFn = globalThis.fetch || (await import("node-fetch")).default;

    const html = await fetchFn(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
      }
    }).then(r => r.text());

    const results = [];

    // Extract titles + URLs
    const linkRegex = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g;

    let match;
    while ((match = linkRegex.exec(html)) && results.length < 5) {
      const url = match[1];
      const title = match[2].replace(/<[^>]+>/g, "").trim();

      results.push({
        title,
        url,
        snippet: "" // optional, DDG removed snippet class
      });
    }

    context.res = {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(results)
    };
  } catch (err) {
    context.log("Search error:", err);
    context.res = {
      status: 500,
      body: "Internal error: " + err.message
    };
  }
}
