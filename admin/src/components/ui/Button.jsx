import React from 'react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

export const Button = React.forwardRef(({
    className,
    variant = 'primary',
    size = 'default',
    startIcon,
    endIcon,
    children,
    ...props
}, ref) => {

    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        outlined: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-indigo-500',
        ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        link: 'text-indigo-600 hover:text-indigo-900 underline-offset-4 hover:underline p-0 h-auto'
    };

    const sizes = {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4 py-2',
        lg: 'h-12 px-8 text-lg',
        icon: 'h-10 w-10 p-2'
    };

    return (
        <button
            ref={ref}
            className={twMerge(clsx(
                'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
                variants[variant],
                sizes[size],
                className
            ))}
            {...props}
        >
            {startIcon && <span className="mr-2">{startIcon}</span>}
            {children}
            {endIcon && <span className="ml-2">{endIcon}</span>}
        </button>
    );
});

Button.displayName = "Button";
