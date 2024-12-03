import React from 'react';
import { cn } from '@/lib/utils';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function Heading({ 
  children, 
  as: Component = 'h1', 
  className,
  ...props 
}: HeadingProps) {
  const baseStyles = {
    h1: 'text-3xl font-bold',
    h2: 'text-2xl font-semibold',
    h3: 'text-xl font-semibold',
    h4: 'text-lg font-semibold',
    h5: 'text-base font-semibold',
    h6: 'text-sm font-semibold',
  };

  return (
    <Component
      className={cn(baseStyles[Component], className)}
      {...props}
    >
      {children}
    </Component>
  );
}
