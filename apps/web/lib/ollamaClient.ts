// apps/web/lib/ollamaClient.ts

export async function chatWithOllama(
  prompt: string,
  onToken?: (token: string) => void
): Promise<string> {
  try {
    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2:3b", // ✅ use your installed model
        prompt,
        stream: true,         // important for streaming
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Ollama API error: ${res.status} ${res.statusText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter(Boolean);

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.response) {
            fullResponse += data.response;
            if (onToken) onToken(data.response); // ✅ send token back live
          }
        } catch {
          // ignore malformed chunks
        }
      }
    }

    return fullResponse.trim();
  } catch (error: any) {
    console.error("chatWithOllama error:", error);
    return "⚠️ Failed to connect to Ollama. Make sure it is running.";
  }
}
