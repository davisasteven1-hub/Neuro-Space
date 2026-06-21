import React from 'react';

interface TimerBlockProps {
    value: number;
    label: string;
    colorClass: string;
}

const extractTextColor = (colorClass: string): string => {
    const match = colorClass.match(/text-[a-z]+/);
    return match ? match[0] : 'text-white';
};

export const TimerBlock: React.FC<TimerBlockProps> = ({ value, label, colorClass }) => (
    <div className="flex flex-col items-center flex-1">
        <div className={`w-full aspect-square flex items-center justify-center border-2 ${colorClass} bg-black relative overflow-hidden group`}>
            <div className={`absolute inset-0 bg-current opacity-10 ${colorClass}`}></div>
            {/* Scanline effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-1/2 w-full translate-y-[-100%] animate-[scan_4s_linear_infinite]"></div>
            <span className={`text-3xl sm:text-4xl md:text-6xl font-mono font-bold relative z-10 ${extractTextColor(colorClass)} tabular-nums tracking-tighter`}>
                {value.toString().padStart(2, '0')}
            </span>
        </div>
        <span className="text-[10px] md:text-xs uppercase text-gray-500 font-mono mt-2 tracking-[0.2em]">{label}</span>
    </div>
);
