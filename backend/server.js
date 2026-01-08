const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(express.json());

// Serve Uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic Route for Health Check
app.get('/', (req, res) => {
  res.json({ message: 'HR MOON PRO API is running...', status: 'OK' });
});

// Routes
const authRoutes = require('./routes/authRoutes');
const orgRoutes = require('./routes/orgRoutes'); // Added orgRoutes
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const rolesRoutes = require('./routes/rolesRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const messageRoutes = require('./routes/messageRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const newsRoutes = require('./routes/newsRoutes');
const documentRoutes = require('./routes/documentRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const requestRoutes = require('./routes/requestRoutes');

// Mount Auth Routes (Public)
app.use('/api/auth', authRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/requests', requestRoutes);


// TODO: Mount Protected Routes (Protected by tenantMiddleware)
// app.use('/api/v1', tenantMiddleware, apiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`
  ==========================================
    HR MOON PRO Server
    Mode: ${process.env.NODE_ENV || 'development'}
    Port: ${PORT}
    Database: MySQL
  ==========================================
  `);
});
