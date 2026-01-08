import { useState, createContext, useContext, useEffect, useRef } from 'react';
import { cn } from "../../lib/utils";
import { ChevronDown } from "lucide-react";

const SelectContext = createContext();

const Select = ({ children, value, onValueChange }) => {
    const [open, setOpen] = useState(false);
    // Keep track of the label for the selected value
    const [selectedLabel, setSelectedLabel] = useState("");

    return (
        <SelectContext.Provider value={{ value, onValueChange, open, setOpen, selectedLabel, setSelectedLabel }}>
            <div className="relative inline-block w-full text-left">
                {children}
            </div>
        </SelectContext.Provider>
    );
};

const SelectTrigger = ({ children, className }) => {
    const { open, setOpen } = useContext(SelectContext);
    return (
        <button
            type="button"
            onClick={() => setOpen(!open)}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    );
};

const SelectValue = ({ placeholder }) => {
    const { value, selectedLabel } = useContext(SelectContext);
    return (
        <span className="block truncate">
            {selectedLabel || value || placeholder}
        </span>
    );
};

const SelectContent = ({ children, className }) => {
    const { open } = useContext(SelectContext);
    if (!open) return null;
    return (
        <div className={cn(
            "absolute right-0 z-50 mt-2 w-full origin-top-right rounded-md bg-popover text-popover-foreground shadow-md ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in duration-200",
            className
        )}>
            <div className="p-1 max-h-60 overflow-y-auto bg-white border border-secondary-200 rounded-md">
                {children}
            </div>
        </div>
    );
};

const SelectItem = ({ children, value, className }) => {
    const { onValueChange, setOpen, value: selectedValue, setSelectedLabel } = useContext(SelectContext);

    // Update label when this item matches the selected value (crude effect but works for now)
    if (value === selectedValue && children !== selectedValue) {
        // Warning: Side-effect in render is not ideal usually, but for this simple shim we might need `useEffect` inside SelectItem or lifting state up.
        // Let's rely on onClick for setting. For initial load, we might miss the label if we don't handle it.
        // Better approach: User passes clean strings usually.
    }

    // Effect to update label if selected
    useEffect(() => {
        if (value === selectedValue) {
            setSelectedLabel(children);
        }
    }, [selectedValue, value, children, setSelectedLabel]);

    return (
        <div
            onClick={() => {
                onValueChange(value);
                setOpen(false);
            }}
            className={cn(
                "relative flex w-full select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-secondary-100 cursor-pointer",
                selectedValue === value ? "bg-secondary-50 font-medium" : "",
                className
            )}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {selectedValue === value && <span className="h-2 w-2 rounded-full bg-primary-600"></span>}
            </span>
            <span className="block truncate">{children}</span>
        </div>
    );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
