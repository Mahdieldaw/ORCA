// src/components/layout/GlobalLayout.tsx
import React from 'react';
import Link from 'next/link';
// import Navbar from './Navbar'; // Your Nav component

interface GlobalLayoutProps {
  children: React.ReactNode;
}

const GlobalLayout: React.FC<GlobalLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Example Header/Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="container h-14 flex items-center justify-between">
           <Link href="/explorer" className="font-bold">HybridThinking</Link>
           <div className="flex items-center space-x-4">
             <Link href="/explorer" className="text-sm hover:underline">Explorer</Link>
             <Link href="/library" className="text-sm hover:underline text-muted-foreground">[Library]</Link>
             <Link href="/settings" className="text-sm hover:underline text-muted-foreground">[Settings]</Link>
             {/* Ghost Overlay Trigger could live here */}
           </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {children}
      </main>

      {/* Optional Footer */}
      <footer className="py-4 border-t">
        <div className="container text-center text-xs text-muted-foreground">
          Hybrid Thinking MVP - Phase 1 UI Shell
        </div>
      </footer>
    </div>
  );
};

export default GlobalLayout;