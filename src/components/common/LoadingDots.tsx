import React from 'react';

interface LoadingDotsProps {
    color?: string; // Accepts Tailwind class, CSS color name, or hex
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const LoadingDots: React.FC<LoadingDotsProps> = ({ 
    color = '', // Use currentColor by default
    size = 'md',
    className = '' 
}) => {
    const dotSizes = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4'
    };
    // If color is a valid CSS color (not a Tailwind class), use it as backgroundColor
    const isCssColor = color && (!color.startsWith('bg-') && !color.startsWith('text-'));
    const dotStyle = (delay: string) => ({
        animation: 'loading-bounce 1.4s infinite both',
        animationDelay: delay,
        backgroundColor: isCssColor ? color : undefined
    });
    // Use text-[color] for parent if color is a CSS color
    const parentColorClass = !isCssColor && color ? color.replace('bg-', 'text-') : '';
    return (
        <div className={`flex items-center justify-center gap-1 ${parentColorClass} ${className}`}>
            <style>{`
                @keyframes loading-bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }
            `}</style>
            <div 
                className={`${dotSizes[size]} ${!isCssColor && color ? color : ''} rounded-full`}
                style={dotStyle('0ms')}
            ></div>
            <div 
                className={`${dotSizes[size]} ${!isCssColor && color ? color : ''} rounded-full`}
                style={dotStyle('200ms')}
            ></div>
            <div 
                className={`${dotSizes[size]} ${!isCssColor && color ? color : ''} rounded-full`}
                style={dotStyle('400ms')}
            ></div>
        </div>
    );
};

export default LoadingDots; 