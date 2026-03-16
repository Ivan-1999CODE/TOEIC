import React from 'react';

const OwlIcon = ({ size = 24, className = "" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {/* Sleek Minimalist Body */}
        <rect x="5" y="7" width="14" height="15" rx="7" />
        {/* Large Expressive Eyes */}
        <circle cx="9" cy="11" r="3" />
        <circle cx="15" cy="11" r="3" />
        {/* Simple Beak */}
        <path d="M12 14v2" />
        {/* Stylized Ear Tufts (Modern) */}
        <path d="M5 10V6l4 2" />
        <path d="M19 10V6l-4 2" />
    </svg>
);

export default OwlIcon;
