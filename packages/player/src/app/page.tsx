export default function Home() {
  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'Geist, sans-serif',
    }}>
      <h1 style={{
        fontFamily: 'Instrument Serif, Playfair Display, serif',
        fontSize: 48,
        fontWeight: 400,
        marginBottom: 16,
      }}>
        MathVision
      </h1>
      <p style={{color: '#8A8AA0', fontSize: 18}}>
        Cinematic animated math explainers
      </p>
      <a
        href="/solve"
        style={{
          marginTop: 32,
          display: 'inline-block',
          padding: '12px 28px',
          fontSize: 16,
          fontWeight: 600,
          color: '#fff',
          background: '#FF6B4A',
          border: 'none',
          borderRadius: 12,
          textDecoration: 'none',
          cursor: 'pointer',
        }}
      >
        Problem Solver
      </a>
    </main>
  );
}
