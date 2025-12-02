import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md border border-transparent",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md border border-transparent",
        outline: "border border-input/50 bg-background hover:bg-accent hover:text-accent-foreground hover:border-input",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm border border-transparent",
        ghost: "hover:bg-accent hover:text-accent-foreground border border-transparent",
        link: "text-primary underline-offset-4 hover:underline border border-transparent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = React.useState(false);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    React.useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePosition({ x, y });
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      // Reset to center when mouse leaves
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMousePosition({ x: rect.width / 2, y: rect.height / 2 });
      }
    };

    const Comp = asChild ? Slot : "button";
    
    // Only apply cursor effect to outline, ghost, and default variants when not using asChild
    const shouldApplyEffect = (variant === "outline" || variant === "ghost" || variant === "default") && !asChild;

    if (asChild || !shouldApplyEffect) {
      // For asChild or variants without effect, use standard rendering
      return (
        <Comp
          ref={buttonRef}
          className={cn(buttonVariants({ variant, size, className }))}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <button
        ref={buttonRef}
        className={cn(buttonVariants({ variant, size, className }))}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {/* Animated background gradient that follows cursor */}
        <span
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: isHovered ? (variant === "outline" ? 0.08 : 0.12) : 0,
            background: variant === "outline" 
              ? `radial-gradient(circle 150px at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 0, 0, 0.1), transparent 70%)`
              : `radial-gradient(circle 120px at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.2), transparent 70%)`,
          }}
        />
        {/* Border glow effect for outline variant */}
        {variant === "outline" && (
          <span
            className="absolute -inset-[1px] rounded-lg pointer-events-none transition-opacity duration-300"
            style={{
              opacity: isHovered ? 0.6 : 0,
              background: `radial-gradient(circle 100px at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 0, 0, 0.15), transparent 70%)`,
              filter: 'blur(4px)',
            }}
          />
        )}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
