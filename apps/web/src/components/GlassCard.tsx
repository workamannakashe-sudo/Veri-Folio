import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  isTextPanel?: boolean;
}

export function GlassCard({ children, className = '', isTextPanel = false }: GlassCardProps) {
  const baseClass = isTextPanel ? 'glass-panel p-6 rounded-2xl' : 'glass p-6 rounded-2xl';
  return (
    <div className={`${baseClass} transition-transform duration-200 hover:-translate-y-1 ${className}`}>
      {children}
    </div>
  );
}
