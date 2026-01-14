import React from 'react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

export const Card = React.forwardRef(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={twMerge(clsx("rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm", className))}
        {...props}
    >
        {children}
    </div>
));
Card.displayName = "Card";

export const CardHeader = React.forwardRef(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={twMerge(clsx("flex flex-col space-y-1.5 p-6", className))}
        {...props}
    >
        {children}
    </div>
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef(({ className, children, ...props }, ref) => (
    <h3
        ref={ref}
        className={twMerge(clsx("text-lg font-semibold leading-none tracking-tight", className))}
        {...props}
    >
        {children}
    </h3>
));
CardTitle.displayName = "CardTitle";

export const CardContent = React.forwardRef(({ className, children, ...props }, ref) => (
    <div ref={ref} className={twMerge(clsx("p-6 pt-0", className))} {...props}>
        {children}
    </div>
));
CardContent.displayName = "CardContent";
