import React from 'react';

interface GlitchTextProps {
  text: string;
  active?: boolean;
}

export const GlitchText: React.FC<GlitchTextProps> = ({ text, active }) => (
  <span
    className={active ? 'inline-block animate-pulse' : 'inline-block'}
    style={active ? { textShadow: '2px 0 #FF0000, -2px 0 #00FFFF' } : undefined}
  >
    {text}
  </span>
);