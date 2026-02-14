import { Permissions, webMethod } from "wix-web-module";
import { fetch } from "wix-fetch";
import { getSecret } from "wix-secrets-backend";

export const askAI = webMethod(
  Permissions.Anyone,
  async (userMessage, roomNumber, history = []) => { // Added history parameter
    const hfToken = await getSecret("HF_TOKEN");
    
    if (!hfToken) {
        console.error("HF_TOKEN secret not found.");
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
    
    IMAGE URLS:
    - DINNER MENU: https://static.wixstatic.com/media/893963_f29c4266205847429188e7b925b68636~mv2.jpg
    - LUNCH MENU: https://static.wixstatic.com/media/893963_558066f11186498e8587399882206777~mv2.jpg
    - ACTIVITIES LIST: https://static.wixstatic.com/media/893963_a9263152431749839446973307613585~mv2.jpg

    PRICING: T-Bone K285, Bream K285, Rump K260, Chicken K200, Pepper Steak K350.
    TOURS: Devil's Pool $160, Microlight $200+, Sunset Cruise $85.
    `.trim();

    // Determine if this is the start of the chat
    const isFirstMessage = history.length === 0;

    const systemPrompt = `Your name is Nkhosi, a professional concierge for Nkhosi Livingstone Lodge & SPA. 
    ${isFirstMessage ? "Greet the guest warmly, introduce yourself as Nkhosi, and mention their room name: " + currentRoomName + "." : "Be helpful and concise. Do not repeat your introduction."}
    
    INSTRUCTIONS: If asked for menus or activities, provide the text summary AND the IMAGE URL on a new line.
    
    Lodge Info:
    ${lodgeInfo}`;

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
            { "role": "system", "content": systemPrompt },
            ...history, // Include previous chat turns
            { "role": "user", "content": userMessage }
          ],
          max_tokens: 250,
          temperature: 0.55
        })
      });

      if (!response.ok) return "The concierge is briefly away. Please try again.";

      const result = await response.json();
      return result.choices[0].message.content.trim();

    } catch (err) {
      return "Connection error. Please call reception at +260978178820.";
    }
  }
);
