import * as React from 'react';
import { cn } from '@/lib/utils';

// Minimal shadcn/ui-style Sheet implementation using a dialog for the drawer effect
export interface SheetProps extends React.ComponentPropsWithoutRef<'div'> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex',
        open ? 'pointer-events-auto' : 'pointer-events-none hidden'
      )}
      aria-modal="true"
      role="dialog"
      style={{ display: open ? 'flex' : 'none' }}
    >
      <div className="fixed inset-0 bg-black/40 transition-opacity" onClick={() => onOpenChange(false)} />
      {children}
    </div>
  );
}

export interface SheetContentProps extends React.ComponentPropsWithoutRef<'div'> {
  side?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
  children: React.ReactNode;
}

export function SheetContent({ side = 'right', className, children, ...props }: SheetContentProps) {
  // Side-based positioning
  const sideClasses = {
    right: 'fixed top-0 right-0 h-full w-[420px] max-w-full bg-background shadow-lg border-l',
    left: 'fixed top-0 left-0 h-full w-[420px] max-w-full bg-background shadow-lg border-r',
    top: 'fixed top-0 left-0 w-full h-[420px] max-h-full bg-background shadow-lg border-b',
    bottom: 'fixed bottom-0 left-0 w-full h-[420px] max-h-full bg-background shadow-lg border-t',
  };
  return (
    <div
      className={cn(
        'z-50 transition-transform duration-300',
        sideClasses[side],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SheetHeader({ children }: { children: React.ReactNode }) {
  return <div className="px-6 pt-6 pb-2 border-b">{children}</div>;
}

export function SheetTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold leading-none tracking-tight">{children}</h2>;
}

export function SheetDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground mt-1">{children}</p>;
}
