import React from 'react';

type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

const Svg: React.FC<React.PropsWithChildren<IconProps>> = ({
  children,
  size = 24,
  className,
  strokeWidth = 2,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
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
    {children}
  </svg>
);

export const ArrowLeft: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </Svg>
);

export const Sparkles: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="m12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
    <path d="M19 3v4" />
    <path d="M21 5h-4" />
  </Svg>
);

export const X: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Svg>
);

export const Send: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M14.536 21.686a.5.5 0 0 0 .935-.127l3.55-17.347a.5.5 0 0 0-.65-.577L2.682 10.7a.5.5 0 0 0-.032.932l6.102 2.3a.5.5 0 0 1 .305.305z" />
    <path d="M21.854 2.147a.5.5 0 0 0-.707-.001L9.68 13.613" />
  </Svg>
);

export const Search: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </Svg>
);

export const Download: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </Svg>
);

export const ChevronDown: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const FileJson: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M10 12h-1a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1H6" />
    <path d="M14 12h1a1 1 0 0 1 1 1v1a1 1 0 0 0 1 1h1" />
  </Svg>
);

export const FileText: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 9H8" />
  </Svg>
);

export const Clock: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </Svg>
);

export const Youtube: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0 2 2 0 0 1 1.4 1.4 24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.56 49.56 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </Svg>
);

export const ArrowRight: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </Svg>
);

export const Command: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M18 3a3 3 0 1 0 0 6h3V6a3 3 0 0 0-3-3" />
    <path d="M3 9h3a3 3 0 1 1 0 6H3z" />
    <path d="M15 21h3a3 3 0 1 0 0-6h-3z" />
    <path d="M9 3H6a3 3 0 0 0 0 6h3z" />
  </Svg>
);

export const UploadCloud: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M12 13v8" />
    <path d="m8 17 4-4 4 4" />
    <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
  </Svg>
);

export const Link: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M10 13a5 5 0 0 0 7.1 0l1.4-1.4a5 5 0 1 0-7.1-7.1L10 5" />
    <path d="M14 11a5 5 0 0 0-7.1 0l-1.4 1.4a5 5 0 1 0 7.1 7.1L14 19" />
  </Svg>
);

export const Key: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3L22 7l-3-3z" />
  </Svg>
);

export const ShieldCheck: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6l8-3 8 3z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);

export const Play: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="m8 5 11 7-11 7z" />
  </Svg>
);

export const CheckCircle2: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);

export const AlertTriangle: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="m10.29 3.86-7.5 13A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.71-3.14l-7.5-13a2 2 0 0 0-3.42 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </Svg>
);

export const RefreshCcw: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M3 2v6h6" />
    <path d="M3 8a9 9 0 1 0 3-6.7L3 4" />
  </Svg>
);

export const File: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </Svg>
);

export const BookOpen: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path d="M12 7v14" />
    <path d="M3 18a2 2 0 0 1 2-2h7" />
    <path d="M21 18a2 2 0 0 0-2-2h-7" />
    <path d="M5 4h7v14H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    <path d="M19 4h-7v14h7a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" />
  </Svg>
);
