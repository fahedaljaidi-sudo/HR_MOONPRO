import React, { useState, useEffect } from 'react';

const ThemeDebugger = () => {
    const [status, setStatus] = useState({});

    const updateStatus = () => {
        setStatus({
            htmlClasses: document.documentElement.className,
            bodyClasses: document.body.className,
            localStorage: localStorage.getItem('theme'),
            colorScheme: document.documentElement.style.colorScheme,
            systemPref: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light'
        });
    };

    useEffect(() => {
        updateStatus();
        const interval = setInterval(updateStatus, 1000);
        return () => clearInterval(interval);
    }, []);

    const forceLight = () => {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
        localStorage.setItem('theme', 'light');
        updateStatus();
        window.location.reload();
    };

    const forceDark = () => {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
        localStorage.setItem('theme', 'dark');
        updateStatus();
        window.location.reload();
    };

    const clearStorage = () => {
        localStorage.removeItem('theme');
        updateStatus();
        window.location.reload();
    };

    return (
        <div className="fixed bottom-4 right-4 p-4 bg-black/90 text-green-400 font-mono text-xs rounded-lg shadow-2xl z-[9999] border border-green-500/30 max-w-sm">
            <h3 className="font-bold border-b border-green-500/30 mb-2 pb-1">Theme Debugger 🛠️</h3>

            <div className="space-y-1 mb-4">
                <p><span className="text-white/60">HTML Class :</span> '{status.htmlClasses}'</p>
                <p><span className="text-white/60">Storage    :</span> {status.localStorage || 'null'}</p>
                <p><span className="text-white/60">System     :</span> {status.systemPref}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button onClick={forceLight} className="px-3 py-1 bg-gray-200 text-black rounded hover:bg-white font-bold transition-colors">
                    FORCE LIGHT
                </button>
                <button onClick={forceDark} className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700 font-bold transition-colors">
                    FORCE DARK
                </button>
                <button onClick={clearStorage} className="col-span-2 px-3 py-1 bg-red-900/50 text-red-200 border border-red-500/30 rounded hover:bg-red-900/80 transition-colors">
                    Reset & Reload
                </button>
            </div>
        </div>
    );
};

export default ThemeDebugger;
