import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          {
            "bg-gradient-to-r from-primary to-teal-400 text-primary-foreground shadow-[0_0_15px_rgba(0,201,177,0.2)] hover:shadow-[0_0_25px_rgba(0,201,177,0.4)] hover:-translate-y-0.5 border border-primary/50": variant === "default",
            "bg-card text-foreground border border-border hover:bg-muted hover:border-primary/30": variant === "secondary",
            "border-2 border-border bg-transparent hover:bg-muted text-foreground": variant === "outline",
            "hover:bg-muted text-foreground": variant === "ghost",
            "bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive hover:text-destructive-foreground": variant === "destructive",
            "h-10 px-4 py-2": size === "default",
            "h-8 rounded-lg px-3": size === "sm",
            "h-12 rounded-xl px-8 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
