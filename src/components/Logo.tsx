import React from 'react';

export function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 200 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
      >
        {/* Lab text */}
        <text x="5" y="45" fontFamily="Space Grotesk" fontWeight="bold" fontSize="40" fill="white">L</text>
        
        {/* Flask replacing 'a' or part of the design */}
        <path d="M45 15L60 45H35L45 15Z" fill="#FF8800" fillOpacity="0.2" />
        <path d="M42 15H52V20H42V15Z" fill="#666" />
        <path d="M38 40C38 43 41 45 47 45C53 45 56 43 56 40L52 20H42L38 40Z" stroke="white" strokeWidth="2" />
        <path d="M40 38C40 41 43 43 47 43C51 43 54 41 54 38L52 30H42L40 38Z" fill="#FF8800" />
        <circle cx="45" cy="25" r="2" fill="white" fillOpacity="0.5" />
        <circle cx="50" cy="18" r="1.5" fill="white" fillOpacity="0.3" />

        <text x="65" y="45" fontFamily="Space Grotesk" fontWeight="bold" fontSize="40" fill="white">b</text>
        
        {/* Separator rod */}
        <rect x="95" y="5" width="2" height="50" rx="1" fill="#444" />
        <circle cx="96" cy="7" r="3" fill="#444" />

        {/* Cab text in Blue */}
        <text x="105" y="45" fontFamily="Space Grotesk" fontWeight="bold" fontSize="40" fill="#1AA3FF">C</text>
        
        {/* Test tube replacing 'a' */}
        <path d="M140 15H152V45C152 48 150 50 146 50C142 50 140 48 140 45V15Z" stroke="white" strokeWidth="2" />
        <path d="M141 30H151V45C151 47 150 48 146 48C142 48 141 47 141 45V30Z" fill="#1AA3FF" />
        <rect x="138" y="12" width="16" height="3" rx="1.5" fill="#666" />
        <circle cx="148" cy="35" r="1.5" fill="white" fillOpacity="0.5" />
        <circle cx="144" cy="25" r="1" fill="white" fillOpacity="0.3" />

        <text x="160" y="45" fontFamily="Space Grotesk" fontWeight="bold" fontSize="40" fill="#1AA3FF">b</text>
      </svg>
    </div>
  );
}
