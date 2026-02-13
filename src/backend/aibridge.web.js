import { Permissions, webMethod } from "wix-web-module";
import { fetch } from "wix-fetch";
import { getSecret } from "wix-secrets-backend";

export const askAI = webMethod(
  Permissions.Anyone,
  async (userMessage, roomNumber) => {
    // SECURE: Fetches the token from the Wix dashboard's Secrets Manager.
    const hfToken = await getSecret("HF_TOKEN");
    
    if (!hfToken) {
        console.error("HF_TOKEN secret not found in Secrets Manager.");
        return "AI configuration error. Please contact reception.";
    }

    const roomNames = {
      "1": "Tonga", "2": "Tumbuka", "3": "Soli", "4": "Lenje",
      "5": "Lamba", "6": "Bemba", "7": "Lozi", "8": "Tokaleya", "9": "Luvale"
    };

    const sanitizedRoom = roomNumber ? String(roomNumber) : "General";
    const currentRoomName = roomNames[sanitizedRoom] || "Valued Guest";

    const lodgeInfo = `
NKHOSI LIVINGSTONE LODGE & SPA
Guest Room: ${currentRoomName} (Room #${sanitizedRoom})
WI-FI: Nkhosi12 / 12nkhosi@
MENU: T-Bone K285, Bream K285, Rump Steak K260, Glazed Chicken K200, Pepper Steak K350.
TOURS: Devil's Pool $160, Microlight $200+, Sunset Cruise $85.
`.trim();

    try {
      // FIX: Use the standard Inference API endpoint instead of the Router
      const modelId = "mistralai/Mistral-7B-Instruct-v0.3";
      const hfEndpoint = `https://api-inference.huggingface.co/models/${modelId}`;

      const response = await fetch(hfEndpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          // Mistral v0.3 uses [INST] tags for better instruction following
          inputs: `[INST] You are a professional concierge for Nkhosi Livingstone Lodge & SPA. Use the following lodge info to help the guest:\n${lodgeInfo}\n\nGuest asks: ${userMessage} [/INST]`,
          parameters: {
            max_new_tokens: 150,
            temperature: 0.5,
            return_full_text: false
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Hugging Face API Error:", errorText);
        return "The concierge service is temporarily resting. Please try again shortly.";
      }

      const result = await response.json();

      // PARSING: Standard Inference API returns an array [{generated_text: "..."}]
      if (Array.isArray(result) && result[0].generated_text) {
        return result[0].generated_text.trim();
      } else if (result.generated_text) {
        return result.generated_text.trim();
      } else {
        return "I'm not sure, please contact reception at +260978178820.";
      }

    } catch (err) {
      console.error("Internal Backend Error:", err.message);
      return "Connection error. Please call reception at +260978178820.";
    }
  }
);
