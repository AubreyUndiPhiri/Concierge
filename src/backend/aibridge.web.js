import { Permissions, webMethod } from "wix-web-module";
import { fetch } from "wix-fetch";
// import { getSecret } from "wix-secrets-backend"; // Temporarily commented out

export const askAI = webMethod(
  Permissions.Anyone,
  async (userMessage, roomNumber) => {

    // Temporarily hardcoding for testing purposes
    const hfToken = "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"; 
    
    /* const hfToken = await getSecret("HF_TOKEN");
    if (!hfToken) {
        console.error("HF_TOKEN secret not found in Secrets Manager.");
        return "AI configuration error. Please contact reception.";
    }
    */

    const roomNames = {
      "1": "Tonga", "2": "Tumbuka", "3": "Soli", "4": "Lenje",
      "5": "Lamba", "6": "Bemba", "7": "Lozi", "8": "Tokaleya", "9": "Luvale"
    }; //

    const sanitizedRoom = roomNumber ? String(roomNumber) : "General";
    const currentRoomName = roomNames[sanitizedRoom] || "Valued Guest";

    const lodgeInfo = `
NKHOSI LIVINGSTONE LODGE & SPA
Guest Room: ${currentRoomName} (Room #${sanitizedRoom})
WI-FI: Nkhosi12 / 12nkhosi@
MENU: T-Bone K285, Bream K285, Rump Steak K260, Glazed Chicken K200, Pepper Steak K350.
TOURS: Devil's Pool $160, Microlight $200+, Sunset Cruise $85.
`.trim(); //

    const fullPrompt = `Concierge Instructions: Use the info below to answer the guest.
${lodgeInfo}
Guest Question: ${userMessage}
Answer:`; //

    try {
      // UPDATED: Using the standard direct API inference endpoint to avoid router text responses
      const response = await fetch("https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json",
          "x-wait-for-model": "true" 
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: 150,
            temperature: 0.5, 
            return_full_text: false 
          }
        }),
        timeout: 30000 
      });

      // Handle non-OK responses and capture raw text to debug the "Unexpected token" issues
      const responseText = await response.text(); 

      if (!response.ok) {
        console.error("Hugging Face API Error Text:", responseText);
        
        if (responseText.includes("loading")) {
          return "The AI is still waking up. Please send your message again in a few seconds.";
        }
        return "The concierge service is temporarily overloaded. Please try again shortly.";
      }

      const result = JSON.parse(responseText);

      let answer = "";
      if (Array.isArray(result) && result.length > 0) {
        answer = result[0].generated_text || "";
      } else {
        answer = result.generated_text || "";
      }

      const finalResult = answer.trim();

      if (!finalResult) {
          return "I'm not sure, please contact reception at +260978178820.";
      }

      return finalResult;

// Update your catch block to provide more detail
    } catch (err) {
      console.error("Parsing Error. Raw response was:", responseText); // Line to add
      console.error("Connection or Internal Error:", err.message);
      return "Connection error. Please call reception at +260978178820.";
    }
  }
);
