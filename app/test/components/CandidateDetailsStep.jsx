"use client";

export default function CandidateDetailsStep({
  exam,
  name,
  setName,
  phone,
  setPhone,
  errorMsg,
  onContinue,
}) {
  const sectionsCount = exam?.sections?.length || 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f6f7fb', fontFamily: 'Arial, Helvetica, sans-serif', color: '#333' }}>
      <div style={{ background: '#FFD700', padding: '12px 0', borderBottom: '3px solid #e6c200' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', margin: 0 }}>
            {exam.title}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '24px 18px' }}>
        <div style={{ marginBottom: '16px', border: '1px solid #e5e7eb', background: '#fff', padding: '14px 16px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
            Candidate Authentication
          </div>
          <div style={{ marginTop: '6px', fontSize: '13px', color: '#6b7280', lineHeight: 1.55 }}>
            Enter your details as per registration record. These details are used for attempt verification and result mapping.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          <div style={{ border: '1px solid #d1d5db', background: '#fff' }}>
            <div style={{ background: '#f3f4f6', padding: '10px 16px', borderBottom: '1px solid #d1d5db', fontWeight: 'bold', fontSize: '14px' }}>
              Candidate Information
            </div>
            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  style={{ width: '100%', height: '42px', padding: '0 12px', border: '1px solid #c7cdd4', fontSize: '14px', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10 digit phone number"
                  style={{ width: '100%', height: '42px', padding: '0 12px', border: '1px solid #c7cdd4', fontSize: '14px', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          <div style={{ border: '1px solid #d1d5db', background: '#fff', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: '#f3f4f6', padding: '10px 14px', borderBottom: '1px solid #d1d5db', fontWeight: 'bold', fontSize: '13px' }}>
              Exam Snapshot
            </div>
            <div style={{ padding: '12px 14px', display: 'grid', rowGap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ color: '#6b7280' }}>Duration</span>
                <span style={{ fontWeight: 700 }}>{exam.durationMinutes} min</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ color: '#6b7280' }}>Questions</span>
                <span style={{ fontWeight: 700 }}>{exam.totalQuestionsOverride ?? '--'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ color: '#6b7280' }}>Sections</span>
                <span style={{ fontWeight: 700 }}>{sectionsCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ color: '#6b7280' }}>Negative Marking</span>
                <span style={{ fontWeight: 700 }}>{exam.negativeMarks ?? 0}</span>
              </div>
            </div>

            <div style={{ marginTop: 'auto', padding: '12px 14px', borderTop: '1px solid #e5e7eb', fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>
              Keep your ID and registered phone nearby for verification in case of support checks.
            </div>
          </div>
        </div>

        {errorMsg && (
          <div style={{ marginTop: '14px', background: '#f8d7da', border: '1px solid #f5c6cb', color: '#721c24', padding: '10px 16px', fontSize: '13px', fontWeight: 'bold' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ marginTop: '14px', background: '#fff', border: '1px solid #d1d5db', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#374151', fontSize: '13px' }}>
            <span style={{ background: '#d4edda', border: '1px solid #28a745', color: '#155724', fontWeight: 700, padding: '4px 8px' }}>
              Step 1 of 4
            </span>
            <span>Validate details and continue to exam instructions</span>
          </div>
          <button
            onClick={onContinue}
            style={{ padding: '11px 28px', fontSize: '14px', fontWeight: 'bold', background: '#222', color: '#fff', border: '1px solid #111', cursor: 'pointer', borderRadius: '2px', letterSpacing: '0.2px' }}
          >
            Continue to Instructions
          </button>
        </div>
      </div>
    </div>
  );
}
