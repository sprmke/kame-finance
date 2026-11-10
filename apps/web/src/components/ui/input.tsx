import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/cn';

const inputVariants = cva(
  'flex w-full rounded-md border bg-card text-foreground transition-colors duration-120 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45 [&::-webkit-inner-spin-button]:opacity-60',
  {
    variants: {
      variant: {
        default:
          'border-input hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        filled:
          'border-transparent bg-muted hover:bg-muted/80 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        ghost:
          'border-transparent hover:bg-muted focus-visible:bg-muted focus-visible:ring-0',
        error:
          'border-destructive bg-card focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      },
      inputSize: {
        default: 'h-10 px-3 text-base sm:text-sm',
        sm: 'h-9 px-2.5 text-sm',
        lg: 'h-11 px-3.5 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.ComponentProps<'input'>, 'size'>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, variant, inputSize, leftIcon, rightIcon, error, ...props },
    ref
  ) => {
    const computedVariant = error ? 'error' : variant;

    if (leftIcon || rightIcon) {
      return (
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ variant: computedVariant, inputSize }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          inputVariants({ variant: computedVariant, inputSize }),
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

// Search Input with built-in search icon
const SearchInput = React.forwardRef<
  HTMLInputElement,
  Omit<InputProps, 'leftIcon'>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      type="search"
      leftIcon={
        <svg
          className="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      className={cn('', className)}
      {...props}
    />
  );
});
SearchInput.displayName = 'SearchInput';

export { Input, SearchInput, inputVariants };
