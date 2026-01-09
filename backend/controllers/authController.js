const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Register a new Company (Tenant) and its first Admin User
 */
exports.registerTenant = async (req, res) => {
    const { companyName, subDomain, firstName, lastName, email, password, phone } = req.body;

    if (!companyName || !email || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        console.log('✅ DB Connection Acquired');

        await connection.beginTransaction();
        console.log('✅ Transaction Started');

        // 1. Create Tenant
        const [tenantResult] = await connection.execute(
            'INSERT INTO tenants (name, domain) VALUES (?, ?)',
            [companyName, subDomain || null]
        );
        console.log('✅ Tenant Created:', tenantResult.insertId);
        const tenantId = tenantResult.insertId;

        // 2. Create "Admin" Role for this Tenant
        const [roleResult] = await connection.execute(
            'INSERT INTO roles (tenant_id, name, description, permissions) VALUES (?, ?, ?, ?)',
            [tenantId, 'Admin', 'Super Administrator with full access', JSON.stringify(['*'])]
        );
        const adminRoleId = roleResult.insertId;

        // 3. Create Employee (The Owner)
        // Note: We need a unique employee_id_code. For the first user, let's use 'ADMIN-01'
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [empResult] = await connection.execute(
            `INSERT INTO employees 
       (tenant_id, employee_id_code, first_name, last_name, email, password_hash, phone, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [tenantId, 'ADMIN-01', firstName, lastName, email, hashedPassword, phone, true]
        );
        const employeeId = empResult.insertId;

        // 4. Assign Admin Role to Employee
        await connection.execute(
            'INSERT INTO employee_roles (employee_id, role_id) VALUES (?, ?)',
            [employeeId, adminRoleId]
        );

        await connection.commit();

        res.status(201).json({
            message: 'Company registered successfully',
            tenantId: tenantId,
            email: email
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Registration failed', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Login User
 */
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
    }

    try {
        // 1. Find User by Email
        // Note: Email should be unique per tenant, but globally we might have duplicates if different tenants use same email?
        // The Schema says: UNIQUE KEY unique_email_per_tenant (tenant_id, email)
        // So we must check which tenant they are trying to login to OR simply assume email is unique globally for SaaS simplicity?
        // Let's assume for now we search across all tenants, but if duplicates exist, we might need a domain/tenant selector.
        // For this MVP, let's query the employee and join tenant to verify. 

        // Simplification: Let's assume Email is unique globally for the login system for now, OR return list of tenants if multiple.
        // Better approach for SaaS: Use email to find user.

        const [users] = await db.execute('SELECT * FROM employees WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // In a complex SaaS, if efficient email exists in multiple tenants, we'd ask user to "Select Workspace".
        // Here we take the first match or simplistic approach.
        const user = users[0];

        // 2. Check Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 2.5 Fetch User Role
        const [roles] = await db.execute(`
            SELECT r.name 
            FROM roles r 
            JOIN employee_roles er ON r.id = er.role_id 
            WHERE er.employee_id = ? 
            LIMIT 1
        `, [user.id]);

        const userRole = roles.length > 0 ? roles[0].name : 'Employee';

        // 3. Generate JWT
        const payload = {
            id: user.id,
            tenant_id: user.tenant_id,
            role: userRole
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                tenant_id: user.tenant_id,
                role: userRole
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
    }
};
