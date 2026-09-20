import React from "react";

export function LungsIcon({ 
  size = 16, 
  className, 
  strokeWidth = 2 
}: { 
  size?: number; 
  className?: string; 
  strokeWidth?: number; 
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Trachea */}
      <path d="M12 2v6" />
      {/* Bronchi bifurcation */}
      <path d="M12 7.5c-1.8 1-3.2 2.2-4.2 3.5" />
      <path d="M12 7.5c1.8 1 3.2 2.2 4.2 3.5" />
      {/* Left Lung */}
      <path d="M7.8 11C5.5 11.5 4 13.5 4 16c0 3 1.8 5 4.8 5 1.8 0 2.8-.8 3.2-2.5V11c-.5.2-1.3.4-2.2.5z" />
      {/* Right Lung */}
      <path d="M16.2 11c2.3.5 3.8 2.5 3.8 5 0 3-1.8 5-4.8 5-1.8 0-2.8-.8-3.2-2.5V11c.5.2 1.3.4 2.2.5z" />
    </svg>
  );
}
