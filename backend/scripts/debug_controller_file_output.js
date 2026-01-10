
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const dashboardController = require('../controllers/dashboardController');

// Output file
const logFile = path.join(__dirname, 'controller_test_result.txt');

function log(msg) {
    fs.appendFileSync(logFile, msg + '\n');
    console.log(msg);
}

// Mock Request/Response
const mockReq = {
    user: { id: 1, tenant_id: 1 }
};

const mockRes = {
    json: (data) => log("✅ JSON Response: " + JSON.stringify(data)),
    status: (code) => {
        log(`❌ Status Code: ${code}`);
        return { json: (data) => log("❌ Error Response: " + JSON.stringify(data)) };
    }
};

async function test() {
    fs.writeFileSync(logFile, 'STARTING TEST\n');
    try {
        log("Testing Dashboard Controller...");

        // Find user to get real tenant_id
        const [users] = await db.execute("SELECT * FROM employees WHERE id = 1");
        if (users.length > 0) {
            mockReq.user.tenant_id = users[0].tenant_id;
            log(`Using tenant_id: ${mockReq.user.tenant_id}`);
        }

        await dashboardController.getDashboardStats(mockReq, mockRes);
        log("FINISHED");
    } catch (e) {
        log("ERROR: " + e.message);
    } finally {
        process.exit();
    }
}

test();
