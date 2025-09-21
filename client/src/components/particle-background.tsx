export default function ParticleBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 9 }, (_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${(i + 1) * 10}%`,
            animationDuration: `${15 + (i % 3) * 3}s`,
            animationDelay: `${i * 2}s`,
          }}
        />
      ))}
    </div>
  );
}
