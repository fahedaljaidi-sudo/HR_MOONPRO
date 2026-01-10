
import { useState, useEffect } from 'react';

const AttendanceTimer = ({ checkInTime }) => {
    const [elapsed, setElapsed] = useState(0);
    const WORK_HOURS = 9; // Target working hours
    const TOTAL_SECONDS = WORK_HOURS * 3600;

    useEffect(() => {
        if (!checkInTime) return;

        const updateTimer = () => {
            const start = new Date(checkInTime).getTime();
            const now = new Date().getTime();
            const diffInSeconds = Math.floor((now - start) / 1000);
            setElapsed(diffInSeconds);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [checkInTime]);

    // Format HH:MM:SS
    const formatTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    // Circular Progress Calculation
    const radius = 120;
    const stroke = 15;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;

    // Progress is capped at 100% for the main green circle
    // If overtime, we can change color or add visual indicator
    const progressPercent = Math.min((elapsed / TOTAL_SECONDS), 1);
    const strokeDashoffset = circumference - (progressPercent * circumference);

    const isOvertime = elapsed > TOTAL_SECONDS;

    return (
        <div className="relative flex flex-col items-center justify-center p-8">
            <div className="relative flex items-center justify-center">
                {/* SVG Ring */}
                <svg
                    height={radius * 2}
                    width={radius * 2}
                    className="transform -rotate-90"
                >
                    {/* Background Ring */}
                    <circle
                        stroke="#e5e7eb" // gray-200
                        strokeWidth={stroke}
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                    {/* Progress Ring */}
                    <circle
                        stroke={isOvertime ? "#f59e0b" : "#10b981"} // Amber for overtime, Green for normal
                        strokeWidth={stroke}
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                        strokeLinecap="round"
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                </svg>

                {/* Timer Text in Center */}
                <div className="absolute flex flex-col items-center">
                    <span className={`text-5xl font-mono font-bold ${isOvertime ? 'text-amber-600' : 'text-secondary-900'} tabular-nums`}>
                        {formatTime(elapsed)}
                    </span>
                    <span className="text-sm font-medium text-secondary-500 mt-2 uppercase tracking-wider">
                        {isOvertime ? 'Overtime' : 'Working Time'}
                    </span>
                    {isOvertime && (
                        <span className="text-xs text-amber-600 font-bold mt-1">
                            + {formatTime(elapsed - TOTAL_SECONDS)}
                        </span>
                    )}
                </div>
            </div>

            <p className="mt-8 text-secondary-500 text-sm">
                Started at <span className="font-semibold text-secondary-900">{new Date(checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </p>
        </div>
    );
};

export default AttendanceTimer;
