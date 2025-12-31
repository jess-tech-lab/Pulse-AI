import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Target,
  Heart,
  AlertTriangle,
  Rocket
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'focus-areas', label: 'Focus Areas', icon: Target },
  { id: 'love', label: 'Love', icon: Heart },
  { id: 'gaps', label: 'Gaps', icon: AlertTriangle },
  { id: 'next-moves', label: 'Next Moves', icon: Rocket },
];

export function MiniNav() {
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map(item => ({
        id: item.id,
        element: document.getElementById(item.id),
      })).filter(s => s.element);

      if (sections.length === 0) return;

      // Check if user has scrolled to the bottom of the page
      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;

      if (scrolledToBottom) {
        // If at the bottom, activate the last section
        setActiveSection(sections[sections.length - 1].id);
        return;
      }

      // Find the section currently in view
      const viewportTop = 150; // Offset from top of viewport

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          if (rect.top <= viewportTop) {
            setActiveSection(section.id);
            return;
          }
        }
      }

      // Default to first section if none found
      setActiveSection(sections[0].id);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Call once on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <nav className="fixed left-6 top-1/2 -translate-y-1/2 z-30 hidden xl:block">
      <div className="glass rounded-2xl p-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => scrollToSection(item.id)}
                  className={`
                    relative flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left
                    transition-all duration-200 group
                    ${isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-primary/10 rounded-xl"
                      transition={{ type: 'spring', duration: 0.3 }}
                    />
                  )}
                  <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-primary' : ''}`} />
                  <span className="text-sm font-medium relative z-10 whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
