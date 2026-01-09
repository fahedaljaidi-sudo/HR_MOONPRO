
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testApi() {
    try {
        const secret = process.env.JWT_SECRET || 'your_jwt_secret';
        const token = jwt.sign({ id: 1, role: 'admin', tenant_id: 1 }, secret, { expiresIn: '1h' });

        console.log('Testing API with token...');
        const response = await fetch('http://localhost:5000/api/dashboard/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            console.error('API Error Status:', response.status);
            const text = await response.text();
            console.error('Body:', text);
            return;
        }

        const data = await response.json();
        console.log('API Response Keys:', Object.keys(data));
        if (data.charts) {
            console.log('Charts Keys:', Object.keys(data.charts));
            console.log('Nationality Data:', JSON.stringify(data.charts.nationalityDistribution, null, 2));
        } else {
            console.log('Charts object is MISSING!');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testApi();
