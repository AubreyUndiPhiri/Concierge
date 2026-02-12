import { askAI } from 'backend/aibridge.web';
import wixLocation from 'wix-location';

$w.onReady(() => {
    const roomNumber = wixLocation.query.room || "General";
    const chatWidget = $w("#html1");

    if (!chatWidget) {
        console.error("CRITICAL: Element #html1 not found on page.");
        return;
    }

    // Initialize: Send room context to the widget for a personalized greeting
    chatWidget.postMessage({ type: "init", room: roomNumber });

    chatWidget.onMessage(async (event) => {
        if (!event.data || event.data.type !== "chat") return;

        const guestMsg = event.data.payload;
        if (!guestMsg) return;

        // Signal widget to show typing indicator
        chatWidget.postMessage({ type: "status", value: "typing" });

        try {
            const aiResponse = await askAI(guestMsg, roomNumber);
            // Send response wrapped in the expected payload structure
            chatWidget.postMessage({ type: "response", payload: aiResponse });
        } catch (err) {
            console.error("Frontend Error:", err);
            chatWidget.postMessage({ type: "response", payload: "I’m having trouble right now. Please call +260978178820." });
        }
    });
});
