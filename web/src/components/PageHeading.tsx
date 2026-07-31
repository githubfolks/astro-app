import React from 'react';

interface PageHeadingProps {
    /** Small uppercase label above the title, e.g. "Daily Almanac", "Service Details" */
    eyebrow: string;
    /** Main heading. Pass a <span className="text-amber-500"> around any word to highlight it. */
    title: React.ReactNode;
    /** Supporting line under the title */
    subtitle?: React.ReactNode;
    className?: string;
    /** Extra classes appended to the <h1> */
    titleClassName?: string;
    /** Extra classes appended to the subtitle <p> */
    subtitleClassName?: string;
}

const PageHeading: React.FC<PageHeadingProps> = ({
    eyebrow,
    title,
    subtitle,
    className = '',
    titleClassName = '',
    subtitleClassName = '',
}) => (
    <div className={`text-center ${className}`}>
        <span className="text-amber-500 font-semibold uppercase tracking-widest text-sm mb-3 block">{eyebrow}</span>
        <h1 className={`text-3xl md:text-4xl font-normal text-white mb-4 ${titleClassName}`}>{title}</h1>
        {subtitle && (
            <p className={`text-gray-400 max-w-xl mx-auto ${subtitleClassName}`}>{subtitle}</p>
        )}
    </div>
);

export default PageHeading;
