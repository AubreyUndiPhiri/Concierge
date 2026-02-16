import { Permissions, webMethod } from "wix-web-module";
import { fetch } from "wix-fetch";
import { getSecret } from "wix-secrets-backend";

export const askAI = webMethod(
  Permissions.Anyone,
  async (userMessage, roomNumber, chatHistory = []) => { // Added history param
    const hfToken = await getSecret("HF_TOKEN");
    
    if (!hfToken) {
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

    // Prepare the messages array with history
    const messages = [
      { "role": "system", "content": `You are the concierge for Nkhosi Lodge. Use this info:\n${lodgeInfo}` },
      ...chatHistory,
      { "role": "user", "content": userMessage }
    ];

    try {
      const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.1-8B-Instruct", 
          messages: messages,
          max_tokens: 150,
          temperature: 0.5
        })
      });

      const result = await response.json();

      if (result.choices && result.choices.length > 0) {
        return result.choices[0].message.content.trim();
      } else {
        return "I'm not sure, please contact reception at +260978178820.";
      }
    } catch (err) {
      return "Connection error. Please call reception at +260978178820.";
    }
  }
);
