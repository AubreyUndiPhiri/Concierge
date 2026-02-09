import { askAI } from 'backend/aibridge.web';
import wixLocation from 'wix-location';

$w.onReady(() => {

    // Get room number from URL (e.g. ?room=6)
    const roomNumber = wixLocation.query.room || "General";

    // Listen for messages FROM the HTML component
    $w("#html1").onMessage(async (event) => {

        //  Safety check: only accept expected messages
        if (!event.data || event.data.type !== "chat") {
            return;
        }

        const guestMsg = event.data.payload;

        if (!guestMsg || typeof guestMsg !== "string") {
            return;
        }

        try {
            //  Call backend AI
            const aiResponse = await askAI(guestMsg, roomNumber);

            //  Send response back to HTML UI
            $w("#html1").postMessage(aiResponse);

        } catch (err) {
            console.error("Frontend Error:", err);
            $w("#html1").postMessage(
                "Sorry, I’m having trouble right now. Please try again in a moment."
            );
        }
    });
});
