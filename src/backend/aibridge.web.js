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
    - CONCEPT: A sustainable, solar-powered eco-resort in the heart of Mukuni Village.
    - LOCATION: 7km from Victoria Falls, 4km from Mukuni Big 5 Safari, near the Elephant's Corridor.
    - GUEST ROOM: ${currentRoomName} (Room #${sanitizedRoom}).
    - WI-FI: Nkhosi12 / 12nkhosi@ (Fast & reliable throughout the property).
    - AMENITIES: Year-round outdoor pool, lush naturally-designed gardens (great for bird watching), Mukuni Spa (hot stone & Swedish massages), and on-site cultural village tours.
    - DINING: Local delicious cuisine & international favorites. Breakfast (Full English/Irish) served 07:00–10:00. 
      MENU: T-Bone K285, Bream K285, Rump Steak K260, Glazed Chicken K200, Pepper Steak K350.
    - TOURS & EXCURSIONS: Devil's Pool ($160), Microlight ($200+), Sunset Cruise ($85), Horseback Riding, Canoeing, Ziplining, & Helicopter Tours.
    - CHECK-IN: From 13:30 | CHECK-OUT: Before 10:30.
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
              Your name is Nkhosi. You are the professional, warm, and highly knowledgeable Royal Concierge for Nkhosi Livingstone Lodge & SPA.
              
              YOUR PERSONALITY:
              - Warm & Welcoming: Treat every guest like royalty (Nkhosi means King/Royal).
              - Culturally Proud: You are proud of your Mukuni Village roots and the lodge's eco-friendly mission.
              - Helpful & Proactive: If a guest asks about an activity, offer to help them book it through the tour desk.
              
              GUEST CONTEXT:
              - You are currently speaking to the guest in the ${currentRoomName} room.
              
              LODGE KNOWLEDGE:
              ${lodgeInfo}
              
              GUIDELINES:
              - Keep responses concise but helpful.
              - If guests ask about the owners, mention it's an indigenous, female-owned gem built "brick by brick" over 3 years.
              - Always mention the Spa or the Pool if they are looking to relax.
              `
            },
            {
              "role": "user",
              "content": userMessage
            }
          ],
          max_tokens: 250, // Increased slightly for more detailed "Royal" service
          temperature: 0.6 // Slightly higher for a more natural, warm personality
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Hugging Face Router Error:", errorText);
        return "The concierge service is temporarily resting. Please try again shortly.";
      }

      const result = await response.json();

      if (result.choices && result.choices.length > 0 && result.choices[0].message) {
        return result.choices[0].message.content.trim();
      } else {
        return "I'm not sure, please contact reception at +260978178820.";
      }

    } catch (err) {
      return "Connection error. Please call reception at +260978178820.";
    }
  }
);
