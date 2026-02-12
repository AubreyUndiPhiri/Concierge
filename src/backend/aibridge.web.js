import { Permissions, webMethod } from "wix-web-module";
import { fetch } from "wix-fetch";
import { getSecret } from "wix-secrets-backend";

export const askAI = webMethod(
  Permissions.Anyone,
  async (userMessage, roomNumber) => {
    // Retrieve the secret securely from Wix Secrets Manager
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
      // Use the new Hugging Face Router endpoint with OpenAI-compatible path
      const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          // Using the specific model string provided in your example
          model: "meta-llama/Llama-3.2-3B-Instruct",
          messages: [
            {
              "role": "system",
              "content": `You are a professional concierge for Nkhosi Livingstone Lodge & SPA. Use the following info to assist the guest:\n${lodgeInfo}`
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
        const errorBody = await response.text();
        console.error("Hugging Face Router Error:", errorBody);
        return "The concierge service is temporarily unavailable. Please try again shortly.";
      }

      const result = await response.json();

      // Navigate the OpenAI-style response structure: result.choices[0].message.content
      if (result.choices && result.choices.length > 0 && result.choices[0].message) {
        return result.choices[0].message.content.trim();
      } else {
        console.error("Unexpected API response structure:", JSON.stringify(result));
        return "I'm not sure, please contact reception at +260978178820.";
      }

    } catch (err) {
      console.error("Internal Connection Error:", err.message);
      return "Connection error. Please call reception at +260978178820.";
    }
  }
);
