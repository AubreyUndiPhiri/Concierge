import { askAI } from 'backend/aibridge.web';
import wixLocation from 'wix-location';

// Array to store the conversation history
let chatHistory = [];

$w.onReady(() => {
    const roomNumber = wixLocation.query.room || "General";
    const chatWidget = $w("#html1");

    if (!chatWidget) {
        console.error("CRITICAL: Element #html1 (Chat Widget) not found on page.");
        return;
    }

    // Initialize the widget with the specific room context
    chatWidget.postMessage({ type: "init", room: roomNumber });

    chatWidget.onMessage(async (event) => {
        // Only process specific chat-type events from the widget
        if (!event.data || event.data.type !== "chat") return;

        const guestMsg = event.data.payload;
        if (!guestMsg) return;

        // Signal the widget to show the animated typing dots
        chatWidget.postMessage({ type: "status", value: "typing" });

        try {
            // 1. Send the message AND the current history to the backend
            const aiResponse = await askAI(guestMsg, roomNumber, chatHistory);

            // 2. Update the history array so Nkhosi remembers this for next time
            chatHistory.push({ "role": "user", "content": guestMsg });
            chatHistory.push({ "role": "assistant", "content": aiResponse });

            // 3. Keep history manageable (optional: keep last 10 exchanges)
            if (chatHistory.length > 20) {
                chatHistory = chatHistory.slice(-20);
            }

            // 4. Send the final response back to the widget
            chatWidget.postMessage({ type: "response", payload: aiResponse });

        } catch (err) {
            console.error("Frontend call error:", err);
            chatWidget.postMessage({ 
                type: "response", 
                payload: "I'm having trouble right now. Please call +260978178820." 
            });
        }
    });
});
