'use client';

export default function Logo({ 
  className = '', 
  size = 'md',
  textColor = 'text-gray-900'
}: { 
  className?: string; 
  size?: 'sm' | 'md' | 'lg';
  textColor?: string;
}) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizes[size]} bg-gradient-to-br from-[#0066FF] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={`${size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-7 h-7' : 'w-10 h-10'} text-white`}
        >
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="currentColor"
          />
          <path
            d="M2 17L12 22L22 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
      <span className={`font-bold tracking-tight ${textColor} ${size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-3xl'}`}>
        Cad<span className="font-extrabold">Arena</span>
      </span>
    </div>
  );
}

