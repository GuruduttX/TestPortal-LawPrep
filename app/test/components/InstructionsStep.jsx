"use client";

export default function InstructionsStep({
  exam,
  adminPreview,
  hasSections,
  showSectionHeader,
  totalQuestions,
  totalMarks,
  totalSections,
  getSectionQuestionCount,
  errorMsg,
  agreed,
  setAgreed,
  onProceed,
}) {
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', color: '#333' }}>
      <div style={{ background: '#FFD700', padding: '12px 0', borderBottom: '3px solid #e6c200' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', margin: 0 }}>
            {exam.title}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px' }}>
        {adminPreview && (
          <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#e7f1ff', border: '1px solid #1a5276', fontSize: '13px', fontWeight: 'bold', color: '#0f3460' }}>
            Admin preview — candidate details and real submission are disabled. Timer is paused. Close with "End preview" in the test view.
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', border: '1px solid #000' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Total Questions</th>
              <th style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Total Time (Minutes)</th>
              <th style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Total Marks</th>
              {showSectionHeader && <th style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Total Number Of Sections</th>}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', textAlign: 'center' }}>{totalQuestions}</td>
              <td style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', textAlign: 'center' }}>{exam.durationMinutes} Min&apos;s</td>
              <td style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', textAlign: 'center' }}>{totalMarks}</td>
              {showSectionHeader && <td style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', textAlign: 'center' }}>{totalSections}</td>}
            </tr>
          </tbody>
        </table>

        {hasSections && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', border: '1px solid #000' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Section Name</th>
                <th style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Total Questions</th>
                <th style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Marks per question</th>
                <th style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Negative marks per question</th>
              </tr>
            </thead>
            <tbody>
              {exam.sections.map((s) => {
                const count = getSectionQuestionCount(s.name, s.totalQuestions);
                return (
                  <tr key={s.name}>
                    <td style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', textAlign: 'center' }}>{s.name}</td>
                    <td style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', textAlign: 'center' }}>{count}</td>
                    <td style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', textAlign: 'center' }}>{s.marksPerQuestion}</td>
                    <td style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', textAlign: 'center' }}>{s.negativeMarks}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {exam.instructions ? (
          <div className="ql-editor" style={{ marginBottom: '24px', fontSize: '13px', lineHeight: '1.8' }} dangerouslySetInnerHTML={{ __html: exam.instructions }} />
        ) : null}

        {errorMsg && (
          <div style={{ background: '#f8d7da', border: '1px solid #f5c6cb', color: '#721c24', padding: '10px 16px', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ background: '#d4edda', border: '1px solid #28a745', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#155724' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#28a745' }}
            />
            I have read, understood and agreed the instructions and disqualification rules of the exam.
          </label>
          <button
            onClick={onProceed}
            disabled={!agreed}
            style={{
              padding: '10px 32px',
              fontSize: '14px',
              fontWeight: 'bold',
              background: agreed ? '#333' : '#999',
              color: '#fff',
              border: '1px solid #000',
              cursor: agreed ? 'pointer' : 'not-allowed',
              borderRadius: '4px',
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
