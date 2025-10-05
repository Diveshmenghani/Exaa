import { Send, Twitter, Instagram, Linkedin } from 'lucide-react';
import logoUrl from '@assets/zeritheum-logo.png';

const ecosystemLinks = [
  'Education Platform',
  'Real Estate Investment',
  'Shopping Marketplace',
  'AI Astrology',
  'AI Trading Advisor',
  'Gaming Platform',
];

const resourceLinks = [
  { label: 'About Us', url: '#' },
  { label: 'Blog', url: '#' },
  { label: 'Support', url: '#' },
];

const socialLinks = [
  { icon: Twitter, url: 'https://twitter.com/zeritheum', label: 'Twitter' },
  { icon: Instagram, url: 'https://instagram.com/zeritheum', label: 'Instagram' },
  { icon: Send, url: 'https://t.me/zeritheum', label: 'Telegram' },
  { icon: Linkedin, url: 'https://linkedin.com/company/zeritheum', label: 'LinkedIn' },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src={logoUrl} alt="Zeritheum Logo" className="h-10 w-10" data-testid="img-footer-logo" />
              <span className="text-xl font-bold gradient-text">Zeritheum</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-footer-tagline">
              The future of decentralized staking with innovative rewards.
            </p>
            <p className="text-xs text-muted-foreground" data-testid="text-copyright">
              © 2024 Zeritheum Protocol. All rights reserved.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4" data-testid="text-footer-ecosystem-title">
              Ecosystem
            </h3>
            <ul className="space-y-2">
              {ecosystemLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`link-ecosystem-${index}`}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4" data-testid="text-footer-resources-title">
              Resources
            </h3>
            <ul className="space-y-2">
              {resourceLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.url}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`link-resource-${index}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4" data-testid="text-footer-connect-title">
              Connect With Us
            </h3>
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-card hover-elevate active-elevate-2 transition-all"
                  aria-label={social.label}
                  data-testid={`link-social-${social.label.toLowerCase()}`}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
