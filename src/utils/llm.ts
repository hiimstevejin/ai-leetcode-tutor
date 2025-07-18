// http request to send request to llm (gemini)
export async function sendAiRequest(apiKey: string, userPrompt: string) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: userPrompt }],
              role: "user",
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const responseText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    return parseHintsAndSolution(responseText);
  } catch (error) {
    console.error("LLM request failed:", error);
  }
}

export function parseHintsAndSolution(text: string): {
  hints: string[];
  solution: string;
} {
  const [hintsRaw, solutionRaw] = text.split("---Optimal Solution---");
  const hints = hintsRaw
    .split("---HINT---")
    .map((hint) => hint.trim())
    .filter(Boolean);
  const solution = solutionRaw?.trim() || "No solution provided.";
  return { hints, solution };
}
