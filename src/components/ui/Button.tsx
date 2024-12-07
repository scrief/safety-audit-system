"use client";

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        // Primary action buttons (Create New, Submit, etc.)
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        
        // Secondary actions (Edit, View, etc.)
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        
        // Positive actions (Start, Complete, etc.)
        success: 'bg-green-600 text-white hover:bg-green-700',
        
        // Destructive actions (Delete, Remove, etc.)
        destructive: 'bg-red-50 text-red-600 hover:bg-red-100',
        
        // Outline style for less prominent actions
        outline: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
        
        // Ghost style for subtle actions
        ghost: 'bg-transparent hover:bg-gray-100',
        
        // Cancel actions
        cancel: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 text-sm',
        lg: 'h-11 px-8 text-lg',
        icon: 'h-10 w-10', // Square button for icons
        iconSm: 'h-9 w-9', // Smaller square for icons
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2">
            <svg
              className="animate-spin h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };