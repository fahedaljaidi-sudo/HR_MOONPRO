
const db = require('../config/db');
const dashboardController = require('../controllers/dashboardController');

// Mock Request and Response
const mockReq = {
    user: {
        id: 1, // Assumed ID for Fahad
        tenant_id: 1 // Assumed Tenant ID
    }
};

const mockRes = {
    json: (data) => console.log("✅ JSON Response received:", JSON.stringify(data, null, 2).substring(0, 200) + "..."),
    status: (code) => {
        console.log(`❌ Status Code: ${code}`);
        return {
            json: (data) => console.log("❌ Error Response:", data)
        };
    }
};

async function testController() {
    try {
        console.log("🔍 Testing Dashboard Controller with User:", mockReq.user);

        // Check if user actually exists and get real tenant_id
        const [users] = await db.execute("SELECT * FROM employees WHERE id = ?", [mockReq.user.id]);
        if (users.length > 0) {
            mockReq.user.tenant_id = users[0].tenant_id;
            console.log(`👤 Found Real User. Updated Tenant ID to: ${mockReq.user.tenant_id}`);
        } else {
            console.log("⚠️ User ID 1 not found. Using default tenant_id: 1");
        }

        await dashboardController.getDashboardStats(mockReq, mockRes);
        console.log("🏁 Controller Execution Finished");

    } catch (error) {
        console.error("💥 CRITICAL ERROR during test:", error);
    } finally {
        process.exit();
    }
}

testController();
