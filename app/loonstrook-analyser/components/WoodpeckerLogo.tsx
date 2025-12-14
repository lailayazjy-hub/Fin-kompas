import React from 'react';

interface Props {
  className?: string;
  size?: number;
}

export const WoodpeckerLogo: React.FC<Props> = ({ className = "", size = 40 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Light Grey Circle Background */}
      <circle cx="50" cy="50" r="48" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1" />
      
      {/* Tree Trunk - Watercolor style abstract */}
      <path 
        d="M60 90C60 90 65 70 62 50C59 30 65 10 65 10H80V90H60Z" 
        fill="#D1D5DB" 
        opacity="0.8"
      />
      <path 
        d="M62 90C62 90 58 75 60 60" 
        stroke="#9CA3AF" 
        strokeWidth="2" 
        strokeLinecap="round" 
        opacity="0.5"
      />

      {/* Woodpecker */}
      <g transform="translate(35, 25) scale(0.6)">
         {/* Tail/Wings - Dark */}
         <path d="M40 70C40 70 30 80 25 90L45 80L40 70Z" fill="#374151" />
         <path d="M40 30C30 30 25 45 25 60C25 75 40 80 40 80L50 50L40 30Z" fill="#1F2937" />
         
         {/* Breast - White */}
         <path d="M40 30C50 30 60 40 60 55C60 70 45 80 40 80L50 50L40 30Z" fill="#FFFFFF" />
         
         {/* Head - Black & White */}
         <path d="M40 30C35 25 35 15 45 10C55 5 65 15 65 25" fill="#1F2937" />
         <circle cx="58" cy="18" r="2" fill="white" /> {/* Eye surround */}
         <circle cx="58" cy="18" r="1" fill="black" /> {/* Eye pupil */}
         
         {/* Red Spot behind eye */}
         <path d="M45 10C42 10 40 12 40 15C40 15 42 12 45 10Z" fill="#DC2626" /> 
         <ellipse cx="42" cy="14" rx="3" ry="4" fill="#DC2626" transform="rotate(-20)" />

         {/* Beak */}
         <path d="M65 20L80 22L65 25" fill="#4B5563" />
         
         {/* Feet */}
         <path d="M40 75L50 80" stroke="#374151" strokeWidth="2" />
         <path d="M40 78L50 83" stroke="#374151" strokeWidth="2" />
      </g>
    </svg>
  );
};
