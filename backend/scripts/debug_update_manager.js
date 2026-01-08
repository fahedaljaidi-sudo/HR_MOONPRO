const db = require('../config/db');

(async () => {
    try {
        console.log("Starting Debug Update...");

        // 1. Get an employee (Target)
        const [emps] = await db.execute('SELECT * FROM employees LIMIT 2');
        if (emps.length < 2) {
            console.log("Not enough employees to test manager update.");
            process.exit(0);
        }

        const targetEmp = emps[0];
        const newManager = emps[1];

        console.log(`Target: ${targetEmp.first_name} (ID: ${targetEmp.id})`);
        console.log(`New Manager: ${newManager.first_name} (ID: ${newManager.id})`);

        // 2. Mock attributes
        const updates = { manager_id: newManager.id };
        const tenantId = targetEmp.tenant_id;
        const employeeId = targetEmp.id;

        // 3. Replicate updateEmployee Logic (Dynamic Builder)
        const fieldMap = {
            firstName: 'first_name',
            lastName: 'last_name',
            email: 'email',
            phone: 'phone',
            jobPositionId: 'job_position_id',
            dob: 'dob',
            gender: 'gender',
            nationality: 'nationality',
            address: 'address',
            nationalId: 'national_id',
            is_active: 'is_active',
            manager_id: 'manager_id'
        };

        const setClauses = [];
        const values = [];

        Object.keys(updates).forEach(key => {
            if (fieldMap[key]) {
                const dbCol = fieldMap[key];
                let val = updates[key];
                if (val === '' || val === 'null') val = null;
                setClauses.push(`${dbCol} = ?`);
                values.push(val);
            }
        });

        console.log("Set Clauses:", setClauses);

        if (setClauses.length === 0) {
            throw new Error('No valid fields');
        }

        const query = `UPDATE employees SET ${setClauses.join(', ')} WHERE id = ? AND tenant_id = ?`;
        values.push(employeeId, tenantId);

        console.log("Executing Query:", query);
        console.log("Values:", values);

        await db.execute(query, values);
        console.log("Update SUCCESS!");

        process.exit(0);

    } catch (error) {
        console.error("Update FAILED:", error);
        process.exit(1);
    }
})();
