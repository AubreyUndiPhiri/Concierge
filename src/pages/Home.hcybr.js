import { askAI } from 'backend/aibridge.web';
import wixLocation from 'wix-location';

$w.onReady(() => {
    // 1. Context Acquisition: Identify the room or default to General
    const roomNumber = wixLocation.query.room || "General";
    const chatWidget = $w("#html1"); // Ensure this ID matches your HTML Component

    if (!chatWidget) {
        console.error("CRITICAL: Element #html1 not found on page. Check your element ID in the Wix Editor.");
        return;
    }

    // 2. Initialization: Send the room context to the HTML widget immediately on load
    // This allows the UI to personalize the greeting based on the roomNumber
    chatWidget.postMessage({ type: "init", room: roomNumber });

    chatWidget.onMessage(async (event) => {
        console.log("Message received from HTML component:", event.data);

        // 3. Protocol Verification: Ensure the HTML component sends the correct structure
        if (!event.data || event.data.type !== "chat") {
            console.warn("Ignored message with invalid protocol. Expected type 'chat'.", event.data);
            return;
        }

        const guestMsg = event.data.payload;
        if (!guestMsg || typeof guestMsg !== "string") return;

        // 4. UI Feedback: Signal to the widget to display a typing indicator/loading state
        chatWidget.postMessage({ type: "status", value: "typing" });

        try {
            // 5. AI Interaction: Call the backend webMethod
            const aiResponse = await askAI(guestMsg, roomNumber);
            
            // 6. Response Handling: Pass the AI's answer back to the widget
            chatWidget.postMessage(aiResponse);
        } catch (err) {
            console.error("Frontend Error during askAI call:", err);
            
            // 7. Error Handling: Provide a friendly fallback if the service is down
            chatWidget.postMessage("I’m having trouble connecting to the concierge service right now. Please reach us at +260978178820 for immediate assistance.");
        }
    });
});
