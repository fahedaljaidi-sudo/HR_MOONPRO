import { cn } from "../../lib/utils";

const Badge = ({ className, variant = "default", ...props }) => {
    const variants = {
        default: "border-transparent bg-primary-500 text-white hover:bg-primary-500/80",
        secondary: "border-transparent bg-secondary-100 text-secondary-900 hover:bg-secondary-100/80",
        destructive: "border-transparent bg-red-500 text-white hover:bg-red-500/80",
        outline: "text-secondary-900",
    };

    return (
        <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", variants[variant], className)} {...props} />
    );
}

export { Badge };
