import { askAI } from 'backend/aibridge.web';
import wixLocation from 'wix-location';

// Array to store the conversation history locally on the page
let chatHistory = [];

$w.onReady(() => {
    // Determine room context from URL query (e.g., ?room=1)
    const roomNumber = wixLocation.query.room || "General";
    const chatWidget = $w("#html1");

    if (!chatWidget) {
        console.error("CRITICAL: Element #html1 (Chat Widget) not found on page.");
        return;
    }

    // 1. Initialize the widget with the specific room context
    chatWidget.postMessage({ type: "init", room: roomNumber });

    // 2. Listen for messages coming from the HTML Chat Widget
    chatWidget.onMessage(async (event) => {
        if (!event.data || event.data.type !== "chat") return;

        const guestMsg = event.data.payload;
        if (!guestMsg) return;

        chatWidget.postMessage({ type: "status", value: "typing" });

        try {
            // 3. Send message AND current history to the backend for context
            const aiResponse = await askAI(guestMsg, roomNumber, chatHistory);

            // 4. Update the history array
            chatHistory.push({ "role": "user", "content": guestMsg });
            chatHistory.push({ "role": "assistant", "content": aiResponse });

            if (chatHistory.length > 20) {
                chatHistory = chatHistory.slice(-20);
            }

            chatWidget.postMessage({ type: "response", payload: aiResponse });

        } catch (err) {
            console.error("Frontend call error:", err);
            chatWidget.postMessage({ 
                type: "response", 
                payload: "I'm having trouble connecting. Please call +260978178820 for assistance." 
            });
        }
    });
});
