import { Permissions, webMethod } from "wix-web-module";
import { fetch } from "wix-fetch";
import { getSecret } from "wix-secrets-backend";

export const askAI = webMethod(
  Permissions.Anyone,
  async (userMessage, roomNumber) => {

    const hfToken = await getSecret("HF_TOKEN");
    if (!hfToken) return "AI configuration error. Please contact reception.";

    const roomNames = {
      "1": "Tonga", "2": "Tumbuka", "3": "Soli", "4": "Lenje",
      "5": "Lamba", "6": "Bemba", "7": "Lozi", "8": "Tokaleya", "9": "Luvale"
    };

    // Strengthened room number logic: force to string and handle "General" or null safely
    const sanitizedRoom = roomNumber ? String(roomNumber) : "General";
    const currentRoomName = roomNames[sanitizedRoom] || "Valued Guest";

    const lodgeInfo = `
NKHOSI LIVINGSTONE LODGE & SPA
Guest Room: ${currentRoomName} (Room #${sanitizedRoom})
WI-FI: Nkhosi12 / 12nkhosi@
MENU: T-Bone K285, Bream K285, Rump Steak K260, Glazed Chicken K200, Pepper Steak K350.
TOURS: Devil's Pool $160, Microlight $200+, Sunset Cruise $85.
`.trim();

    const fullPrompt = `Concierge Instructions: Use the info below to answer the guest.
${lodgeInfo}
Guest Question: ${userMessage}
Answer:`;

    try {
      // ✅ Corrected Hugging Face API URL
      const response = await fetch("https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json",
          "x-wait-for-model": "true" // Tells HF to wait for the model to load
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: 150,
            temperature: 0.5, // Lower temperature = more factual for lodge info
            return_full_text: false // ✅ This helps prevent the prompt-echo
          }
        }),
        timeout: 15000 // Added a 15-second timeout for better robustness
      });

      // Handle HTTP errors and "Cold Starts"
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error && errorData.error.includes("loading")) {
          return "The AI is still waking up. Please send your message again in a few seconds.";
        }
        return "The concierge service is temporarily overloaded. Please try again shortly.";
      }

      const result = await response.json();

      let answer = "";
      if (Array.isArray(result) && result.length > 0) {
        answer = result[0].generated_text || "";
      } else {
        answer = result.generated_text || "";
      }

      // Final Cleanup
      return answer.replace(fullPrompt, "").trim() || "I'm not sure, please contact reception.";

    } catch (err) {
      console.error("HF API Error:", err);
      return "Connection error. Please call reception at +260978178820.";
    }
  }
);
