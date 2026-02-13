import { Permissions, webMethod } from "wix-web-module";
import { fetch } from "wix-fetch"; //
import { getSecret } from "wix-secrets-backend"; //

export const askAI = webMethod(
  Permissions.Anyone,
  async (userMessage, roomNumber) => {
    const hfToken = await getSecret("HF_TOKEN"); //
    
    // Lodge Knowledge Base
    const roomNames = {
      "1": "Tonga", "2": "Tumbuka", "3": "Soli", "4": "Lenje",
      "5": "Lamba", "6": "Bemba", "7": "Lozi", "8": "Tokaleya", "9": "Luvale"
    };
    const currentRoomName = roomNames[roomNumber] || "Valued Guest";

    const lodgeInfo = `
    You are the professional concierge for Nkhosi Livingstone Lodge & SPA.
    Guest Room: ${currentRoomName} (Room #${roomNumber})
    WI-FI: Nkhosi12 / Password: 12nkhosi@
    MENU: T-Bone K285, Zambezi Bream K285, Rump Steak K260.
    TOURS: Devil's Pool ($160), Microlight ($200), Sunset Cruise ($85).
    `.trim();

    try {
      const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST", //
        headers: {
          "Authorization": `Bearer ${hfToken}`, //
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "mistralai/Mistral-7B-Instruct-v0.1", //
          messages: [
            { "role": "system", "content": lodgeInfo }, //
            { "role": "user", "content": userMessage } //
          ],
          max_tokens: 150, //
          temperature: 0.5 //
        })
      });

      const result = await response.json();

      // The router returns data in the OpenAI 'choices' format
      if (result.choices && result.choices.length > 0) {
        return result.choices[0].message.content.trim(); //
      } else {
        return "I'm not sure, please contact reception at +260978178820."; //
      }

    } catch (err) {
      return "Connection error. Please call reception at +260978178820."; //
    }
  }
);
