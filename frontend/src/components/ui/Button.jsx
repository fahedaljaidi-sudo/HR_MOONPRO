import { cn } from "../../lib/utils";

const Button = ({ className, variant = "default", size = "md", ...props }) => {
    const variants = {
        default: "bg-primary-600 text-white hover:bg-primary-700 shadow-sm dark:bg-primary-600 dark:hover:bg-primary-700",
        outline: "border border-secondary-200 bg-transparent hover:bg-secondary-50 text-secondary-900 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-800",
        ghost: "bg-transparent hover:bg-secondary-100 text-secondary-600 dark:text-secondary-400 dark:hover:bg-secondary-800 dark:hover:text-secondary-100",
    };

    const sizes = {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-lg",
    };

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 disabled:pointer-events-none disabled:opacity-50",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        />
    );
};

export { Button };
