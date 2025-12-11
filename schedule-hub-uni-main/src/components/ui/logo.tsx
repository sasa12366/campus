import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: 'minimal' | 'horizontal' | 'ksu';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: React.CSSProperties;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8', 
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
};

const horizontalSizeClasses = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-12', 
  xl: 'h-16'
};

export function Logo({ variant = 'minimal', className, size = 'md', style }: LogoProps) {
  const baseClasses = variant === 'horizontal' 
    ? horizontalSizeClasses[size]
    : sizeClasses[size];

  if (variant === 'minimal') {
    return (
      <img 
        src="/logos/campusflow-minimal.svg" 
        alt="CampusFlow" 
        className={cn(baseClasses, className)}
        style={style}
      />
    );
  }

  if (variant === 'horizontal') {
    return (
      <img 
        src="/logos/campusflow-horizontal.svg" 
        alt="CampusFlow" 
        className={cn(baseClasses, className)}
        style={style}
      />
    );
  }

  if (variant === 'ksu') {
    return (
      <img 
        src="/logos/ksu-logo.svg" 
        alt="КГУ" 
        className={cn(baseClasses, className)}
        style={style}
      />
    );
  }

  return null;
} 