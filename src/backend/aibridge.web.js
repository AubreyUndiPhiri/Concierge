import { Permissions, webMethod } from "wix-web-module";
import { fetch } from "wix-fetch";
import { getSecret } from "wix-secrets-backend";

export const askAI = webMethod(
  Permissions.Anyone,
  async (userMessage, roomNumber) => {
    const hfToken = await getSecret("HF_TOKEN");

    if (!hfToken) {
      console.error("HF_TOKEN secret not found in Secrets Manager.");
      return "The AI concierge is currently offline. Please contact reception.";
    }

    const roomNames = {
      "1": "Tonga", "2": "Tumbuka", "3": "Soli", "4": "Lenje",
      "5": "Lamba", "6": "Bemba", "7": "Lozi", "8": "Tokaleya", "9": "Luvale"
    };

    const sanitizedRoom = roomNumber ? String(roomNumber) : "General";
    const currentRoomName = roomNames[sanitizedRoom] || "Valued Guest";

    // Comprehensive Knowledge Base
    const lodgeInfo = `
    PROPERTY: NKHOSI LIVINGSTONE LODGE & SPA.
    IDENTITY: Sustainable, solar-powered eco-resort in Mukuni Village, 7km from Victoria Falls.
    GUEST CONTEXT: Assisting Guest in Room #${sanitizedRoom} (${currentRoomName}).
    LOGISTICS: Check-in 13:30 | Check-out 10:30. WI-FI: Nkhosi12 (Password: 12nkhosi@).
    
    DINING:
    - Breakfast: 07:00–10:00.
    - Menu Highlights: T-Bone (K285), Bream (K285), Rump Steak (K260), Glazed Chicken (K200), Pepper Steak (K350).

    NKHOSI SPA & BEAUTY:
    - Massages: Full Body/Deep Tissue (K1300/60min), Hot Stone/Ukuchina Traditional/Soul of Livingstone (K1400/90min), Back, Neck & Shoulder (K950/30min), Foot Massage (K750/20min).
    - Beauty: Gel Manicure/Pedicure (K850), Normal Polish Mani/Pedi (K750), Gel Overlay (K700), Deep Cleansing Facial (K1550).

    ACTIVITIES & TOURS:
    - Victoria Falls: Devil’s Pool ($160), Guided Falls Tours, Swimming Under the Falls (Seasonal Sept-Jan).
    - Aerial: Helicopter Flights (15/20/30-min), Microlight Flights ($200+).
    - River: Sunset Cruises ($85), White Water Rafting (Grade 5), Tiger Fishing, Canoeing.
    - Wildlife: The Elephant Café (interact with rescued elephants), Rhino Game Drives (Mosi-oa-Tunya), Chobe Day Trip.
    - Adventure: Bungee Jumping (111m), Gorge Swing, Zipline, Victoria Falls Steam Train Dinner.
    - Culture: Mukuni Village Traditional Tour, Livingstone Town Tour, Horse Trails.
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
              1. Respond fluently in the SAME language the guest uses.
              2. Keep responses elegant.
              3. Organize your response into clear short paragraphs. Strictly NO bullet points.
              4. Use **bold text** for prices, tour names, and food items.
              5. Limit recommendations to a maximum of 4 at a time to remain concise.
              6. Always ensure every sentence is complete.
              7. If a specific price isn't in the info, offer to contact the front desk.
              8. Do not start every new paragraph with a greeting, let the converstaion flow as it would in the real words 

              LODGE KNOWLEDGE:
              ${lodgeInfo}
              `
            },
            {
              "role": "user",
              "content": userMessage
            }
          ],
          max_tokens: 500,
          temperature: 0.6, // Slightly increased for more natural "Royal" flow
          stop: ["User:", "Nkhosi:"]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("HF Error:", errorText);
        return "I am currently attending to another guest. Please try again in a moment.";
      }

      const result = await response.json();

      if (result.choices && result.choices.length > 0 && result.choices[0].message) {
        return result.choices[0].message.content.trim();
      } else {
        return "It would be my pleasure to assist you further. Please contact our reception directly at +260978178820.";
      }

    } catch (err) {
      console.error("Backend Error:", err.message);
      return "I'm having trouble connecting to the network. Please call reception at +260978178820.";
    }
  }
);
