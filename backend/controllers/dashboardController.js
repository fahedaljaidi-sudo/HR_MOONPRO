const db = require('../config/db');

exports.getDashboardStats = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const today = new Date().toISOString().split('T')[0];

        // 1. Total Employees
        const [empRows] = await db.execute(
            'SELECT COUNT(*) as count FROM employees WHERE tenant_id = ? AND is_active = TRUE',
            [tenantId]
        );
        const totalEmployees = empRows[0].count;

        // 2. On Leave Today (Employees with attendance status 'leave' today OR specific leave request logic if we had it. 
        // For now, looking at attendance table for 'leave' status today)
        const [leaveRows] = await db.execute(
            'SELECT COUNT(*) as count FROM attendance WHERE tenant_id = ? AND attendance_date = ? AND status = ?',
            [tenantId, today, 'leave']
        );
        const onLeave = leaveRows[0].count;

        // 3. New Hires (This Month)
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const [hireRows] = await db.execute(
            'SELECT COUNT(*) as count FROM employees WHERE tenant_id = ? AND hire_date >= ?',
            [tenantId, startOfMonth]
        );
        const newHires = hireRows[0].count;

        // 4. Attendance Today
        const [attendanceRows] = await db.execute(
            'SELECT COUNT(*) as count FROM attendance WHERE tenant_id = ? AND attendance_date = ? AND status IN ("present", "late")',
            [tenantId, today]
        );
        const presentCount = attendanceRows[0].count;
        // Avoid division by zero
        const attendanceRate = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;

        // 5. Department Distribution (Chart Data)
        const [deptRows] = await db.execute(`
            SELECT d.name, COUNT(e.id) as count 
            FROM departments d 
            LEFT JOIN job_positions jp ON d.id = jp.department_id 
            LEFT JOIN employees e ON jp.id = e.job_position_id AND e.is_active = TRUE 
            WHERE d.tenant_id = ? 
            GROUP BY d.id, d.name`,
            [tenantId]
        );

        // 6. Nationality Distribution (Chart Data)
        const [natRows] = await db.execute(`
            SELECT nationality as name, COUNT(*) as count 
            FROM employees 
            WHERE tenant_id = ? AND is_active = TRUE AND nationality IS NOT NULL
            GROUP BY nationality`,
            [tenantId]
        );

        // 6. Latest Activities (Mock/Aggregated from tables)
        // Ideally we'd have an 'audit_logs' or 'activities' table. For now, let's pull recent new hires.
        const [recentHires] = await db.execute(
            'SELECT first_name, last_name, hire_date FROM employees WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 5',
            [tenantId]
        );

        const activities = recentHires.map(h => ({
            text: `New employee joined: ${h.first_name} ${h.last_name}`,
            time: h.hire_date
        }));

        res.json({
            stats: {
                totalEmployees,
                onLeave,
                newHires,
                attendance: presentCount,
                attendanceRate
            },
            charts: {
                departmentDistribution: deptRows,
                nationalityDistribution: natRows
            },
            activities
        });

    } catch (error) {
        console.error('getDashboardStats Error:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
};
