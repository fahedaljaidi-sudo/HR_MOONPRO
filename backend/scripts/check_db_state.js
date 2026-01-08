const db = require('../config/db');

async function checkState() {
    try {
        const [roles] = await db.execute('SELECT * FROM roles');
        const [employees] = await db.execute('SELECT id, first_name, last_name, email FROM employees');
        const [empRoles] = await db.execute('SELECT er.*, e.email, r.name as role_name FROM employee_roles er JOIN employees e ON er.employee_id = e.id JOIN roles r ON er.role_id = r.id');

        console.log(JSON.stringify({ roles, employees, empRoles }, null, 2));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkState();
