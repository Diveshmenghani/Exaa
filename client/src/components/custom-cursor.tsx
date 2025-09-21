import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // Create cursor trails
    const trails: HTMLDivElement[] = [];
    for (let i = 0; i < 5; i++) {
      const trail = document.createElement('div');
      trail.className = 'custom-cursor-trail';
      document.body.appendChild(trail);
      trails.push(trail);
    }
    trailRefs.current = trails;

    let mouseX = 0, mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${mouseX - 10}px, ${mouseY - 10}px)`;
      }

      // Animate trails
      trails.forEach((trail, index) => {
        setTimeout(() => {
          trail.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
        }, index * 50);
      });
    };

    const handleMouseEnterButton = () => {
      if (cursorRef.current) {
        cursorRef.current.style.transform += ' scale(1.5)';
      }
    };

    const handleMouseLeaveButton = () => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = cursorRef.current.style.transform.replace(' scale(1.5)', '');
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    // Add hover effects to interactive elements
    const interactiveElements = document.querySelectorAll('button, a, [data-testid*="button-"], [data-testid*="link-"]');
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', handleMouseEnterButton);
      element.addEventListener('mouseleave', handleMouseLeaveButton);
    });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      trails.forEach(trail => document.body.removeChild(trail));
      interactiveElements.forEach(element => {
        element.removeEventListener('mouseenter', handleMouseEnterButton);
        element.removeEventListener('mouseleave', handleMouseLeaveButton);
      });
    };
  }, []);

  return <div ref={cursorRef} className="custom-cursor" />;
}
