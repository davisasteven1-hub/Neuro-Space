import React from 'react';

interface GlitchTextProps {
    text: string;
    active?: boolean;
}

export const GlitchText: React.FC<GlitchTextProps> = ({ text, active = false }) => (
    <span className={`relative inline-block ${active ? 'animate-glitch' : ''}`}>
        {text}
        {active && (
            <>
                <span className="absolute top-0 left-0 -ml-[2px] text-panic opacity-70 animate-pulse">{text}</span>
                <span className="absolute top-0 left-0 ml-[2px] text-caution opacity-70 animate-pulse">{text}</span>
            </>
        )}
    </span>
);
