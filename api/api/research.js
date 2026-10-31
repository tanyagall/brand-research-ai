
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST method required" });
  }

  const apiKey = process.env.FTAI_API_KEY;
  const model = process.env.FTAI_MODEL;

  if (!apiKey || !model) {
    return res.status(500).json({
      error: "Server setup incomplete. Check FTAI_API_KEY and FTAI_MODEL."
    });
  }

  const brand = String(req.body?.brand || "").trim();

  if (!brand || brand.length > 150) {
    return res.status(400).json({
      error: "Please enter a valid brand name."
    });
  }

  const prompt = `
Research the brand: "${brand}"

Prepare a detailed, evidence-based brand research report.

Investigate:
1. Brand identity and official website.
2. Brand owner and legal company.
3. Parent company and subsidiaries.
4. Founder, directors and executives.
5. Trademark owner, registration number and status.
6. Manufacturer (do not confuse manufacturer with brand owner).
7. Amazon marketplace presence, products and sellers.
8. Company news, press releases and reviews.

Rules:
- Use web search to find current information.
- Include source URLs for important claims.
- Clearly separate verified facts from unverified information.
- Never invent names, ownership details or registration numbers.
- If information is unavailable, say "Not found".
- Explain when two companies may have similar names.
- Organize the report with clear headings.
`;

  try {
    const response = await fetch(
      "https://api.freetheai.org/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "You are an expert brand and company research analyst. Be accurate and cite sources."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          web_search_options: {},
          max_tokens: 4000
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "FreeTheAI request failed."
      });
    }

    return res.status(200).json({
      brand,
      report: data.choices?.[0]?.message?.content || "",
      sources: data.choices?.[0]?.message?.annotations || []
    });

  } catch (error) {
    return res.status(500).json({
      error: "Could not connect to the AI service."
    });
  }
}
