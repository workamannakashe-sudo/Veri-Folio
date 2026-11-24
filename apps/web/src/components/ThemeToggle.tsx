'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('verifolio-theme') as 'dark' | 'light';
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('verifolio-theme', next);
    if (next === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-xl glass hover:border-[var(--cyan)] transition-colors text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]"
      aria-label="Toggle dark/light theme"
    >
      {theme === 'dark' ? <Sun className="w-5 h-5 text-[var(--cyan)]" /> : <Moon className="w-5 h-5 text-[var(--violet)]" />}
    </button>
  );
}
