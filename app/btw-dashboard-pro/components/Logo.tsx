import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Light grey circle background */}
      <circle cx="50" cy="50" r="48" fill="#F7F7F7" />
      
      {/* Tree trunk - Watercolor style abstract */}
      <path 
        d="M60,100 L65,100 L65,0 L55,0 C50,20 60,40 55,60 C50,80 60,90 60,100" 
        fill="#E5E5E5" 
        stroke="none"
      />
      
      {/* Woodpecker */}
      <g transform="translate(48, 35) scale(0.35)">
         {/* Tail/Wings - Dark */}
         <path d="M40,80 C30,90 40,110 40,110 L50,90 Z" fill="#2C3E50" />
         <path d="M35,40 C20,50 30,90 45,85 C55,80 60,50 35,40" fill="#2C3E50" />
         
         {/* Body - White Chest */}
         <path d="M45,85 C35,85 30,55 35,45 C40,35 60,35 60,50 C60,70 55,85 45,85" fill="#FFFFFF" />
         
         {/* Head - Black and White */}
         <circle cx="45" cy="25" r="12" fill="#2C3E50" />
         <path d="M45,25 L65,30 L45,35 Z" fill="#2C3E50" /> {/* Beakish base */}
         <path d="M60,28 L75,28 L60,32 Z" fill="#555" /> {/* Beak */}
         
         {/* Red spot behind eye */}
         <circle cx="40" cy="22" r="4" fill="#D32F2F" />
         
         {/* Eye/Face Detail */}
         <circle cx="50" cy="25" r="2" fill="#FFFFFF" />
      </g>
    </svg>
  );
};

export default Logo;