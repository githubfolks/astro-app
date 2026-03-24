import React from 'react';
import { User } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

export const Avatar = ({ src, alt, className, iconSize = 20 }) => {
    const API_URL = import.meta.env.VITE_API_URL || '';
    
    let imageUrl = src;
    if (src && !src.startsWith('http')) {
        const base = API_URL.replace(/\/$/, '');
        const path = src.startsWith('/') ? src : `/${src}`;
        imageUrl = `${base}${path}`;
    }

    if (src) {
        return (
            <img 
                src={imageUrl} 
                alt={alt || ""} 
                className={twMerge(clsx("rounded-full object-cover bg-gray-100", className))} 
            />
        );
    }

    return (
        <div className={twMerge(clsx(
            "rounded-full bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100 shrink-0", 
            className
        ))}>
            <User size={iconSize} />
        </div>
    );
};
