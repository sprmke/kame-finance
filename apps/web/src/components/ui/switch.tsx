import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';

import { cn } from '@/lib/utils/cn';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'peer inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-45 data-[state=checked]:bg-primary data-[state=unchecked]:border-input data-[state=unchecked]:bg-muted',
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none block h-[18px] w-[18px] rounded-full bg-card ring-1 ring-black/10 transition-transform duration-120 ease-out data-[state=checked]:translate-x-[19px] data-[state=unchecked]:translate-x-[2px] dark:bg-foreground'
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
