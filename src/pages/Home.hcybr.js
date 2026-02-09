import { askAI } from 'backend/aibridge.web';
import wixLocation from 'wix-location';

$w.onReady(() => {
    const roomNumber = wixLocation.query.room || "General";
    const chatWidget = $w("#html1");

    if (!chatWidget) {
        console.error("CRITICAL: Element #html1 not found on page. Check your element ID in the Wix Editor.");
        return;
    }

    chatWidget.onMessage(async (event) => {
        console.log("Message received from HTML component:", event.data);

        // Protocol Verification: Ensure the HTML component sends { type: "chat", payload: "..." }
        if (!event.data || event.data.type !== "chat") {
            console.warn("Ignored message with invalid protocol. Expected type 'chat'.", event.data);
            return;
        }

        const guestMsg = event.data.payload;
        if (!guestMsg || typeof guestMsg !== "string") return;

        try {
            const aiResponse = await askAI(guestMsg, roomNumber);
            chatWidget.postMessage(aiResponse);
        } catch (err) {
            console.error("Frontend Error during askAI call:", err);
            chatWidget.postMessage("Sorry, I’m having trouble right now. Please try again.");
        }
    });
});
