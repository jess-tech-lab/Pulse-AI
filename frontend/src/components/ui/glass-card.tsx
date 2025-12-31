import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  animate?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hover = true, animate = true, children, ...props }, ref) => {
    if (animate) {
      return (
        <motion.div
          ref={ref}
          className={cn(
            'glass rounded-xl p-5 transition-all duration-200',
            hover && 'cursor-pointer',
            className
          )}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'glass rounded-xl p-5 transition-all duration-200',
          hover && 'cursor-pointer hover:scale-[1.02] hover:-translate-y-0.5',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = 'GlassCard';

const GlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-start justify-between mb-3', className)}
    {...props}
  />
));
GlassCardHeader.displayName = 'GlassCardHeader';

const GlassCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-title', className)}
    {...props}
  />
));
GlassCardTitle.displayName = 'GlassCardTitle';

const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('space-y-3', className)} {...props} />
));
GlassCardContent.displayName = 'GlassCardContent';

export { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent };
