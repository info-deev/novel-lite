import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

export { default as Button } from './Button.vue';

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/85',
        primary: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/85',
        destructive: 'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/85',
        outline: 'border border-border bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground border border-border shadow-xs hover:bg-secondary/70',
        ghost: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-7 rounded-md px-2.5 text-xs',
        md: 'h-8 px-3 text-sm',
        lg: 'h-10 rounded-md px-6',
        icon: 'h-8 w-8 p-0 text-base',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
