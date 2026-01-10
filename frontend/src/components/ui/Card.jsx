import { cn } from "../../lib/utils";

const Card = ({ className, children, ...props }) => {
    return (
        <div
            className={cn(
                "glass-card rounded-xl border border-secondary-200 text-secondary-950 shadow-sm",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

const CardHeader = ({ className, ...props }) => (
    <div
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
)

const CardTitle = ({ className, ...props }) => (
    <h3
        className={cn(
            "text-2xl font-semibold leading-none tracking-tight",
            className
        )}
        {...props}
    />
)

const CardContent = ({ className, ...props }) => (
    <div className={cn("p-6 pt-0", className)} {...props} />
)

export { Card, CardHeader, CardTitle, CardContent };
