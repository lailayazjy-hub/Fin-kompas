import React from 'react';

interface WoodpeckerLogoProps {
  className?: string;
  style?: React.CSSProperties;
}

const WoodpeckerLogo: React.FC<WoodpeckerLogoProps> = ({ className, style }) => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      className={className} 
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="circleClip">
          <circle cx="100" cy="100" r="98" />
        </clipPath>
      </defs>

      {/* Main Background Circle */}
      <circle cx="100" cy="100" r="98" fill="#f4f1ea" />
      
      <g clipPath="url(#circleClip)">
        {/* Tree Trunk (Left side) */}
        <path 
          d="M20,0 L85,0 L95,200 L10,200 Z" 
          fill="#a0785a" 
        />
        {/* Trunk Texture Details */}
        <path d="M50,20 Q60,30 50,40" stroke="#6d4c41" strokeWidth="2" fill="none" opacity="0.6" />
        <path d="M60,80 Q50,100 65,120" stroke="#6d4c41" strokeWidth="2" fill="none" opacity="0.6" />
        <path d="M40,150 Q50,170 40,190" stroke="#6d4c41" strokeWidth="2" fill="none" opacity="0.6" />

        {/* Woodpecker Group */}
        <g transform="translate(10, 0)">
            {/* Tail */}
            <path d="M90,160 L75,210 L105,210 Z" fill="#1a1a1a" />

            {/* Red Vent/Underbelly */}
            <path d="M90,150 Q90,180 100,190 Q120,180 115,150 Z" fill="#d32f2f" />

            {/* White Belly/Chest */}
            <path d="M90,80 Q75,120 90,150 Q115,150 120,100 Q115,80 105,70 Z" fill="#fdfbf7" />

            {/* Wing (Black with white spots) */}
            <path d="M105,70 Q135,80 130,140 Q125,170 110,160 Q120,100 105,70" fill="#1a1a1a" />
            {/* Wing Spots */}
            <circle cx="118" cy="90" r="3" fill="white" />
            <circle cx="125" cy="110" r="3" fill="white" />
            <circle cx="122" cy="130" r="2.5" fill="white" />
            <circle cx="115" cy="105" r="2" fill="white" />

            {/* Back/Shoulder */}
            <path d="M100,60 L110,100 L105,70 Z" fill="#1a1a1a" />

            {/* Head & Neck */}
            <g transform="translate(0, -5)">
                {/* Black Cap & Nape */}
                <path d="M95,45 Q115,35 125,55 Q130,75 115,85 L105,70 Z" fill="#1a1a1a" />
                
                {/* Red Nape Patch */}
                <path d="M122,58 Q126,62 122,68" stroke="#d32f2f" strokeWidth="5" strokeLinecap="round" />

                {/* White Face */}
                <path d="M95,45 Q80,55 95,75 L105,70 Z" fill="#fdfbf7" />

                {/* Black Eye Stripe/Moustachial Stripe */}
                <path d="M92,55 L110,65" stroke="#1a1a1a" strokeWidth="2" fill="none" />

                {/* Eye */}
                <circle cx="102" cy="55" r="2.5" fill="#000" />
                <circle cx="103" cy="54" r="0.8" fill="#fff" />

                {/* Beak */}
                <path d="M95,58 L65,55 L95,52 Z" fill="#333" />
            </g>

            {/* Feet / Claws gripping tree */}
            <path d="M85,130 L70,135" stroke="#333" strokeWidth="2.5" fill="none" />
            <path d="M85,140 L70,150" stroke="#333" strokeWidth="2.5" fill="none" />
        </g>
      </g>
      
      {/* Optional: Subtle Overlay for "Watercolor" feel */}
      <circle cx="100" cy="100" r="98" fill="url(#watercolor-gradient)" opacity="0.1" style={{ mixBlendMode: 'multiply' }} />
      <defs>
        <radialGradient id="watercolor-gradient">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor="#ddd" />
        </radialGradient>
      </defs>
    </svg>
  );
};

export default WoodpeckerLogo;