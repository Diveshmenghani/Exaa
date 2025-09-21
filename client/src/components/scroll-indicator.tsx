import { useEffect, useState } from 'react';

export default function ScrollIndicator() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPercentage = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      setScrollProgress(Math.min(scrollPercentage * 2, 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-1/2 right-5 transform -translate-y-1/2 z-50">
      <div className="flex flex-col space-y-2">
        <div className="w-1 h-32 bg-muted/20 rounded-full overflow-hidden">
          <div 
            className="w-full bg-gradient-to-b from-primary to-secondary transition-all duration-300 ease-out"
            style={{ height: `${scrollProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
