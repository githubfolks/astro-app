import React from 'react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

export const TextArea = React.forwardRef(({ className, label, error, helperText, fullWidth, ...props }, ref) => {
    return (
        <div className={clsx("flex flex-col gap-1.5", fullWidth && "w-full")}>
            {label && (
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                </label>
            )}
            <textarea
                className={twMerge(clsx(
                    "flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-red-500 focus:ring-red-500",
                    className
                ))}
                ref={ref}
                {...props}
            />
            {helperText && (
                <p className={clsx("text-xs", error ? "text-red-500" : "text-gray-500")}>
                    {helperText}
                </p>
            )}
        </div>
    );
});

TextArea.displayName = "TextArea";
