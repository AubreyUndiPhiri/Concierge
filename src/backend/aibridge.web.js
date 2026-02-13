import { Permissions, webMethod } from "wix-web-module";
import { fetch } from "wix-fetch";
import { getSecret } from "wix-secrets-backend";

export const askAI = webMethod(
  Permissions.Anyone,
  async (userMessage, roomNumber) => {
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

    // KNOWLEDGE BASE WITH IMAGE URLS
    const lodgeInfo = `
    NKHOSI LIVINGSTONE LODGE & SPA
    Guest Room: ${currentRoomName} (Room #${sanitizedRoom})
    WI-FI: Nkhosi12 / 12nkhosi@
    
    IMAGE URLS:
    - DINNER MENU: https://static.wixstatic.com/media/893963_f29c4266205847429188e7b925b68636~mv2.jpg
    - LUNCH MENU: https://static.wixstatic.com/media/893963_558066f11186498e8587399882206777~mv2.jpg
    - ACTIVITIES LIST: https://static.wixstatic.com/media/893963_a9263152431749839446973307613585~mv2.jpg

    PRICING SUMMARY:
    - Meals: T-Bone K285, Bream K285, Rump Steak K260, Glazed Chicken K200, Pepper Steak K350.
    - Tours: Devil's Pool $160, Microlight $200+, Sunset Cruise $85.
    `.trim();

    try {
      const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.1-8B-Instruct", 
          messages: [
            {
              "role": "system",
              "content": `You are a professional concierge for Nkhosi Livingstone Lodge & SPA. 
              IMPORTANT INSTRUCTION: If the guest asks for the menu, food, or activity prices, you MUST provide the relevant text summary AND the corresponding IMAGE URL from the lodge info on a separate line. The chat interface will automatically render the image for the guest.\n\nLodge Info:\n${lodgeInfo}`
            },
            {
              "role": "user",
              "content": userMessage
            }
          ],
          max_tokens: 250,
          temperature: 0.5
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Hugging Face Router Error:", errorText);
        return "The concierge service is temporarily unavailable. Please try again shortly.";
      }

      const result = await response.json();

      if (result.choices && result.choices.length > 0 && result.choices[0].message) {
        return result.choices[0].message.content.trim();
      } else {
        return "I'm not sure, please contact reception at +260978178820.";
      }

    } catch (err) {
      console.error("Internal Backend Error:", err.message);
      return "Connection error. Please call reception at +260978178820.";
    }
  }
);
