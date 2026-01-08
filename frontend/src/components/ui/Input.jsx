import { cn } from "../../lib/utils";

const Input = ({ className, type, ...props }) => {
    return (
        <input
            type={type}
            className={cn(
                "flex h-10 w-full rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-secondary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        />
    );
};

export { Input };
