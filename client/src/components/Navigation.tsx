import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoUrl from '../assets/zeritheum-logo.png';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const menuItems = [
    { label: 'Ecosystem', id: 'ecosystem' },
    { label: 'Stake', id: 'stake' },
    { label: 'Roadmap', id: 'roadmap' },
    { label: 'Learn', id: 'learn' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-background/95 backdrop-blur-md border-b border-border' : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-2">
              <img src={logoUrl} alt="Zeritheum Logo" className="h-10 w-10 md:h-12 md:w-12" data-testid="img-logo" />
              <span className="text-xl md:text-2xl font-bold gradient-text" data-testid="text-brand">
                Zeritheum
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
                  data-testid={`link-${item.id}`}
                >
                  {item.label}
                </button>
              ))}
              <Button variant="outline" disabled data-testid="button-coming-soon">
                Coming Soon
              </Button>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-menu-toggle"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/98 backdrop-blur-lg md:hidden pt-20">
          <div className="container mx-auto px-4 py-8 flex flex-col gap-6">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-2xl font-semibold text-foreground/80 hover:text-foreground transition-colors text-left"
                data-testid={`link-mobile-${item.id}`}
              >
                {item.label}
              </button>
            ))}
            <Button variant="outline" disabled className="w-full mt-4" data-testid="button-mobile-coming-soon">
              Coming Soon
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
