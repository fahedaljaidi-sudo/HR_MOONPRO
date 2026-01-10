
require('dotenv').config({ path: '../.env' });

if (process.env.JWT_SECRET) {
    console.log("JWT_SECRET is set (Length: " + process.env.JWT_SECRET.length + ")");
} else {
    console.log("❌ JWT_SECRET is NOT set!");
}
