const db = require('../config/db');

exports.previewPayroll = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const tenantId = req.user.tenant_id;
        const { month, year } = req.body;

        if (!month || !year) return res.status(400).json({ message: 'Month and Year are required' });

        // Check existing
        const [existing] = await connection.execute(
            'SELECT id FROM payroll_history WHERE tenant_id = ? AND pay_period_month = ? AND pay_period_year = ? LIMIT 1',
            [tenantId, month, year]
        );
        if (existing.length > 0) return res.status(400).json({ message: `Payroll for ${month}/${year} already processed.` });

        // Fetch Employees
        const [employees] = await connection.execute(`
            SELECT e.id, e.first_name, e.last_name, s.base_salary, s.housing_allowance, s.transport_allowance, s.other_allowances, s.deductions
            FROM employees e
            LEFT JOIN salaries s ON e.id = s.employee_id
            WHERE e.tenant_id = ? AND e.is_active = 1
        `, [tenantId]);

        // Helper for Working Days
        const getWorkingDaysCount = (m, y) => {
            let count = 0;
            const daysInMonth = new Date(y, m, 0).getDate();
            for (let d = 1; d <= daysInMonth; d++) {
                const dayOfWeek = new Date(y, m - 1, d).getDay();
                if (dayOfWeek !== 5 && dayOfWeek !== 6) count++;
            }
            return count;
        };
        const defaultWorkingDays = getWorkingDaysCount(month, year);

        const previewData = [];

        for (const emp of employees) {
            // Fetch Attendance
            const [attRows] = await connection.execute(
                `SELECT COUNT(DISTINCT attendance_date) as days_present 
                 FROM attendance 
                 WHERE tenant_id = ? AND employee_id = ? 
                 AND MONTH(attendance_date) = ? AND YEAR(attendance_date) = ? 
                 AND status IN ('present', 'late', 'half_day')`,
                [tenantId, emp.id, month, year]
            );
            const attendedDays = attRows[0].days_present || 0;

            // Calculations
            const base = Number(emp.base_salary || 0);
            const dailyRate = base / 30;
            // Default deduction logic
            const absentDays = Math.max(0, defaultWorkingDays - attendedDays);
            const absenceDeduction = Math.round(absentDays * dailyRate);

            const totalAllowances = Number(emp.housing_allowance || 0) + Number(emp.transport_allowance || 0) + Number(emp.other_allowances || 0);
            const fixedDeductions = Number(emp.deductions || 0);
            const totalDeductions = fixedDeductions + absenceDeduction;
            const netSalary = (base + totalAllowances) - totalDeductions;

            previewData.push({
                ...emp,
                attendedDays,
                workingDays: defaultWorkingDays, // Suggested default
                dailyRate,
                absenceDeduction,
                totalAllowances,
                fixedDeductions,
                netSalary
            });
        }

        res.json({
            month,
            year,
            defaultWorkingDays,
            preview: previewData
        });

    } catch (error) {
        console.error('previewPayroll Error:', error);
        res.status(500).json({ message: 'Failed to preview payroll' });
    } finally {
        if (connection) connection.release();
    }
};

exports.confirmPayroll = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const tenantId = req.user.tenant_id;
        const { month, year, employees } = req.body; // employees array with finalized calculations/inputs

        if (!month || !year || !employees) return res.status(400).json({ message: 'Invalid payload' });

        // Re-check existing (safety)
        const [existing] = await connection.execute(
            'SELECT id FROM payroll_history WHERE tenant_id = ? AND pay_period_month = ? AND pay_period_year = ? LIMIT 1',
            [tenantId, month, year]
        );
        if (existing.length > 0) return res.status(400).json({ message: 'Payroll already processed.' });

        await connection.beginTransaction();
        let totalProcessed = 0;
        let totalAmount = 0;

        for (const record of employees) {
            const net = Number(record.netSalary);
            if (net > 0) {
                await connection.execute(`
                    INSERT INTO payroll_history 
                    (tenant_id, employee_id, pay_period_month, pay_period_year, basic_pay, total_allowances, total_deductions, net_salary, payment_date, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'paid')
                `, [tenantId, record.id, month, year, record.base_salary, record.totalAllowances, record.totalDeductions, net]);

                totalProcessed++;
                totalAmount += net;
            }
        }

        await connection.commit();
        res.json({ message: 'Payroll Confirmed', stats: { employees: totalProcessed, totalAmount } });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('confirmPayroll Error:', error);
        res.status(500).json({ message: 'Failed to confirm payroll' });
    } finally {
        if (connection) connection.release();
    }
};

exports.processPayroll = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const tenantId = req.user.tenant_id;
        const { month, year, workingDays: manualWorkingDays } = req.body; // Expects 1-12 for month, YYYY for year

        if (!month || !year) {
            return res.status(400).json({ message: 'Month and Year are required' });
        }

        // 1. Check if payroll already exists for this period
        const [existing] = await connection.execute(
            'SELECT id FROM payroll_history WHERE tenant_id = ? AND pay_period_month = ? AND pay_period_year = ? LIMIT 1',
            [tenantId, month, year]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: `Payroll for ${month}/${year} has already been processed.` });
        }

        // 2. Fetch all active employees with salary info
        const [employees] = await connection.execute(`
            SELECT e.id, s.base_salary, s.housing_allowance, s.transport_allowance, s.other_allowances, s.deductions
            FROM employees e
            LEFT JOIN salaries s ON e.id = s.employee_id
            WHERE e.tenant_id = ? AND e.is_active = 1
        `, [tenantId]);

        if (employees.length === 0) {
            return res.status(400).json({ message: 'No active employees found to process.' });
        }

        await connection.beginTransaction();

        let totalProcessed = 0;
        let totalAmount = 0;

        // Helper to count working days (Sun-Thu) in a month
        const getWorkingDaysCount = (m, y) => {
            let count = 0;
            const daysInMonth = new Date(y, m, 0).getDate();
            for (let d = 1; d <= daysInMonth; d++) {
                const dayOfWeek = new Date(y, m - 1, d).getDay();
                // 0 = Sun, 1 = Mon, ..., 4 = Thu, 5 = Fri, 6 = Sat
                // Working days: Sun (0) to Thu (4)
                if (dayOfWeek !== 5 && dayOfWeek !== 6) {
                    count++;
                }
            }
            return count;
        };

        const workingDays = manualWorkingDays ? Number(manualWorkingDays) : getWorkingDaysCount(month, year);

        // 3. Insert payroll record for each employee
        for (const emp of employees) {
            const base = Number(emp.base_salary || 0);
            const housing = Number(emp.housing_allowance || 0);
            const transport = Number(emp.transport_allowance || 0);
            const other = Number(emp.other_allowances || 0);
            const fixedDeductions = Number(emp.deductions || 0);

            // --- Smart Calculation ---
            const dailyRate = base / 30; // Standard 30-day fixed rate for daily calculation

            // Fetch actual attendance count for this month
            // Note: In a real app, this should be a single bulk query outside the loop for performance.
            // For MVP, row-by-row is acceptable but not optimal.
            const [attRows] = await connection.execute(
                `SELECT COUNT(DISTINCT attendance_date) as days_present 
                 FROM attendance 
                 WHERE tenant_id = ? AND employee_id = ? 
                 AND MONTH(attendance_date) = ? AND YEAR(attendance_date) = ? 
                 AND status IN ('present', 'late', 'half_day')`,
                [tenantId, emp.id, month, year]
            );

            const attendedDays = attRows[0].days_present || 0;

            // Calculate Absence
            // If checking in the middle of the month, we might need hire_date logic, 
            // but for now assume full month responsibility.
            const absentDays = Math.max(0, workingDays - attendedDays);
            const absenceDeduction = Math.round(absentDays * dailyRate);

            const totalDeductions = fixedDeductions + absenceDeduction;
            const totalAllowances = housing + transport + other;
            const netSalary = (base + totalAllowances) - totalDeductions;

            if (netSalary > 0) { // Only process if there's a salary to pay
                await connection.execute(`
                    INSERT INTO payroll_history 
                    (tenant_id, employee_id, pay_period_month, pay_period_year, basic_pay, total_allowances, total_deductions, net_salary, payment_date, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'paid')
                `, [tenantId, emp.id, month, year, base, totalAllowances, totalDeductions, netSalary]);

                totalProcessed++;
                totalAmount += netSalary;
            }
        }

        await connection.commit();

        res.json({
            message: 'Payroll processed successfully',
            stats: {
                employees: totalProcessed,
                totalAmount: totalAmount,
                period: `${month}/${year}`
            }
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('processPayroll Error:', error);
        res.status(500).json({ message: 'Failed to process payroll', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.getHistory = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;

        // Group by month/year to show summary in history list
        // OR list individual records. Let's list summary by month first.
        const [rows] = await db.execute(`
            SELECT pay_period_month, pay_period_year, COUNT(id) as employee_count, SUM(net_salary) as total_paid, MAX(payment_date) as last_payment_date
            FROM payroll_history
            WHERE tenant_id = ?
            GROUP BY pay_period_year, pay_period_month
            ORDER BY pay_period_year DESC, pay_period_month DESC
        `, [tenantId]);

        res.json(rows);
    } catch (error) {
        console.error('getHistory Error:', error);
        res.status(500).json({ message: 'Failed to fetch history' });
    }
};
