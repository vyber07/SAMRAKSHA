import React, { useState } from 'react';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

interface SidebarProps {
  navItems: NavItem[];
  onNavClick?: (href: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ navItems, onNavClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <span className="text-2xl">✕</span>
        ) : (
          <span className="text-2xl">☰</span>
        )}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen w-64 bg-neutral-900 dark:bg-neutral-950 text-neutral-100
          flex flex-col border-r border-neutral-800 z-40
          transition-transform duration-200 md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-800">
          <h1 className="text-xl font-bold">SAMRAKSHA</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavClick?.(item.href);
                    setIsOpen(false);
                  }}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-md transition-colors duration-200
                    ${
                      item.active
                        ? 'bg-primary-500 text-white'
                        : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800">
          <p className="text-xs text-neutral-500">© 2026 SAMRAKSHA</p>
        </div>
      </aside>
    </>
  );
};

Sidebar.displayName = 'Sidebar';
