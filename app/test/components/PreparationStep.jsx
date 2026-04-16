"use client";

export default function PreparationStep({ adminPreview, onStartTest }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Georgia, serif',
      }}
    >
      {adminPreview && (
        <p style={{ color: '#9cf', fontSize: '14px', marginBottom: '24px', maxWidth: '520px', textAlign: 'center', padding: '0 16px' }}>
          Preview mode — fullscreen and proctoring are off so you can review the paper comfortably.
        </p>
      )}
      <img src="/logo.png" alt="Logo" style={{ height: '80px', width: 'auto', objectFit: 'contain', background: '#fff', padding: '10px', borderRadius: '8px', marginBottom: '32px' }} />
      <h1
        style={{
          fontSize: '48px',
          color: '#ffffff',
          fontWeight: 'normal',
          fontStyle: 'italic',
          marginBottom: '40px',
          textAlign: 'center',
          lineHeight: '1.4',
        }}
      >
        Test preparation completed successfully.
      </h1>
      <button
        onClick={onStartTest}
        style={{
          padding: '12px 36px',
          fontSize: '16px',
          fontWeight: 'bold',
          background: '#FFD700',
          color: '#000',
          border: '2px solid #e6c200',
          cursor: 'pointer',
          borderRadius: '4px',
        }}
      >
        Start Test
      </button>
    </div>
  );
}
