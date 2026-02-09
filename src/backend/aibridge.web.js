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

    const currentRoomName = roomNames[String(roomNumber)] || "Valued Guest";

    const lodgeInfo = `
NKHOSI LIVINGSTONE LODGE & SPA
Guest Room: ${currentRoomName} (Room #${roomNumber})
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
      const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json",
          "x-wait-for-model": "true"
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: 150,
            temperature: 0.5, // Lower temperature = more factual for lodge info
            return_full_text: false // ✅ This helps prevent the prompt-echo
          }
        })
      });

      const result = await response.json();

      if (result.error) {
        if (result.error.includes("loading")) return "The AI is warming up. Please try again in 20 seconds.";
        return "Service temporarily unavailable.";
      }

      let answer = "";
      if (Array.isArray(result) && result.length > 0) {
        answer = result[0].generated_text || "";
      } else {
        answer = result.generated_text || "";
      }

      // Final Cleanup
      return answer.replace(fullPrompt, "").trim() || "I'm not sure, please contact reception.";

    } catch (err) {
      return "Connection error. Please call reception at +260978178820.";
    }
  }
);