
const db = require('../config/db');

async function debugDashboard() {
    try {
        console.log('Finding user...');
        const [users] = await db.execute("SELECT * FROM employees LIMIT 1");
        if (users.length === 0) {
            console.log("No users found.");
            process.exit(0);
        }

        const user = users[0];
        const tenantId = user.tenant_id;
        console.log(`Using Tenant ID: ${tenantId} from user ${user.email}`);

        const today = new Date().toISOString().split('T')[0];

        // 1. Total Employees
        console.log("1. fetching total employees...");
        const [empRows] = await db.execute(
            'SELECT COUNT(*) as count FROM employees WHERE tenant_id = ? AND is_active = TRUE',
            [tenantId]
        );
        console.log("Total employees:", empRows[0].count);

        // 2. On Leave
        console.log("2. fetching on leave...");
        const [leaveRows] = await db.execute(
            'SELECT COUNT(*) as count FROM attendance WHERE tenant_id = ? AND attendance_date = ? AND status = ?',
            [tenantId, today, 'leave']
        );
        console.log("On leave:", leaveRows[0].count);

        // 3. New Hires
        console.log("3. fetching new hires...");
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const [hireRows] = await db.execute(
            'SELECT COUNT(*) as count FROM employees WHERE tenant_id = ? AND hire_date >= ?',
            [tenantId, startOfMonth]
        );
        console.log("New hires:", hireRows[0].count);

        // 4. Attendance
        console.log("4. fetching attendance...");
        const [attendanceRows] = await db.execute(
            'SELECT COUNT(*) as count FROM attendance WHERE tenant_id = ? AND attendance_date = ? AND status IN ("present", "late")',
            [tenantId, today]
        );
        console.log("Attendance:", attendanceRows[0].count);

        // 5. Department Dist
        console.log("5. fetching dept dist...");
        const [deptRows] = await db.execute(`
            SELECT d.name, COUNT(e.id) as count 
            FROM departments d 
            LEFT JOIN job_positions jp ON d.id = jp.department_id 
            LEFT JOIN employees e ON jp.id = e.job_position_id AND e.is_active = TRUE 
            WHERE d.tenant_id = ? 
            GROUP BY d.id, d.name`,
            [tenantId]
        );
        console.log("Dept dist rows:", deptRows.length);

        // 6. Nationality Dist
        console.log("6. fetching nationality dist...");
        const [natRows] = await db.execute(`
            SELECT nationality as name, COUNT(*) as count 
            FROM employees 
            WHERE tenant_id = ? AND is_active = TRUE AND nationality IS NOT NULL
            GROUP BY nationality`,
            [tenantId]
        );
        console.log("Nationality dist rows:", natRows.length);

        console.log("SUCCESS");
        process.exit(0);

    } catch (error) {
        console.error('DEBUG ERROR:', error);
        process.exit(1);
    }
}

debugDashboard();
