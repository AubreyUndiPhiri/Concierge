import { Permissions, webMethod } from "wix-web-module";
import { fetch } from "wix-fetch";
import { getSecret } from "wix-secrets-backend";

export const askAI = webMethod(
  Permissions.Anyone,
  async (userMessage, roomNumber) => {
    // SECURE: Fetches the token from the Wix dashboard's Secrets Manager.
    // Ensure you have added a secret named "HF_TOKEN" there.
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
      // IMPLEMENTATION: Using the new OpenAI-compatible Hugging Face Router endpoint.
      const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.2-3B-Instruct",
          messages: [
            {
              "role": "system",
              "content": `You are a professional concierge for Nkhosi Livingstone Lodge & SPA. Use the following lodge info to help the guest:\n${lodgeInfo}`
            },
            {
              "role": "user",
              "content": userMessage
            }
          ],
          max_tokens: 150,
          temperature: 0.5
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Hugging Face API Error:", errorText);
        return "The concierge service is temporarily unavailable. Please try again shortly.";
      }

      const result = await response.json();

      // PARSING: Extracting content from the standard OpenAI-style response structure.
      if (result.choices && result.choices.length > 0 && result.choices[0].message) {
        return result.choices[0].message.content.trim();
      } else {
        console.error("Unexpected API structure:", JSON.stringify(result));
        return "I'm not sure, please contact reception at +260978178820.";
      }

    } catch (err) {
      console.error("Internal Backend Error:", err.message);
      return "Connection error. Please call reception at +260978178820.";
    }
  }
);
