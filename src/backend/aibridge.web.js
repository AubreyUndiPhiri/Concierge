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

    const lodgeInfo = `
    NKHOSI LIVINGSTONE LODGE & SPA - KEY DETAILS:
    - CONCEPT: Sustainable, solar-powered eco-resort in Mukuni Village.
    - LOCATION: 7km from Victoria Falls, near Elephant's Corridor.
    - GUEST ROOM: ${currentRoomName} (Room #${sanitizedRoom}).
    - WI-FI: Nkhosi12 / 12nkhosi@
    - AMENITIES: Year-round pool, Mukuni Spa, bird watching, cultural tours.
    - DINING: Breakfast 07:00–10:00. MENU: T-Bone K285, Bream K285, Rump Steak K260, Glazed Chicken K200, Pepper Steak K350.
    - TOURS: Devil's Pool ($160), Microlight ($200+), Sunset Cruise ($85).
    - CHECK-IN: 13:30 | CHECK-OUT: 10:30.
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
              "content": `
              Your name is Nkhosi. You are the professional Royal Concierge for Nkhosi Livingstone Lodge & SPA.
              
              RULES:
              1. Respond fluently in the SAME language the guest uses (English, Russian, German, etc.).
              2. Be concise. Do not provide more than 4 recommendations at a time.
              3. Organize your response into clear, elegant paragraphs. No bullet points.
              4. Use **bold text** for emphasis on tours and food.
              5. Ensure every sentence is finished.

              LODGE INFO:
              ${lodgeInfo}
              `
            },
            {
              "role": "user",
              "content": userMessage
            }
          ],
          max_tokens: 500,
          temperature: 0.6,
          stop: ["User:", "Nkhosi:"]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("HF Error:", errorText);
        return "The concierge service is temporarily resting. Please try again shortly.";
      }

      const result = await response.json();

      if (result.choices && result.choices.length > 0 && result.choices[0].message) {
        return result.choices[0].message.content.trim();
      } else {
        return "I'm not sure, please contact reception at +260978178820.";
      }

    } catch (err) {
      console.error("Backend Error:", err.message);
      return "Connection error. Please call reception at +260978178820.";
    }
  }
);
