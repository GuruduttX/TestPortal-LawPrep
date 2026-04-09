import { useState, useEffect } from 'react';

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', color: '#333' }}>
      <div style={{ background: '#FFD700', padding: isMobile ? '8px 0' : '12px 0', borderBottom: '3px solid #e6c200' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 'bold', color: '#000', margin: 0 }}>
            {exam.title}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: isMobile ? '16px 12px' : '24px' }}>
        {adminPreview && (
          <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#e7f1ff', border: '1px solid #1a5276', fontSize: '13px', fontWeight: 'bold', color: '#0f3460' }}>
            Admin preview mode enabled.
          </div>
        )}

        <div style={{ overflowX: 'auto', marginBottom: '24px', border: '1px solid #000' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ border: '1px solid #000', padding: '10px', fontSize: '13px', fontWeight: 'bold' }}>Questions</th>
                <th style={{ border: '1px solid #000', padding: '10px', fontSize: '13px', fontWeight: 'bold' }}>Time (Min)</th>
                <th style={{ border: '1px solid #000', padding: '10px', fontSize: '13px', fontWeight: 'bold' }}>Marks</th>
                {showSectionHeader && <th style={{ border: '1px solid #000', padding: '10px', fontSize: '13px', fontWeight: 'bold' }}>Sections</th>}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '10px', fontSize: '13px', textAlign: 'center' }}>{totalQuestions}</td>
                <td style={{ border: '1px solid #000', padding: '10px', fontSize: '13px', textAlign: 'center' }}>{exam.durationMinutes}</td>
                <td style={{ border: '1px solid #000', padding: '10px', fontSize: '13px', textAlign: 'center' }}>{totalMarks}</td>
                {showSectionHeader && <td style={{ border: '1px solid #000', padding: '10px', fontSize: '13px', textAlign: 'center' }}>{totalSections}</td>}
              </tr>
            </tbody>
          </table>
        </div>

        {hasSections && (
          <div style={{ overflowX: 'auto', marginBottom: '24px', border: '1px solid #000' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ border: '1px solid #000', padding: '10px', fontSize: '13px', fontWeight: 'bold' }}>Section</th>
                  <th style={{ border: '1px solid #000', padding: '10px', fontSize: '13px', fontWeight: 'bold' }}>Questions</th>
                  <th style={{ border: '1px solid #000', padding: '10px', fontSize: '13px', fontWeight: 'bold' }}>Marking</th>
                  <th style={{ border: '1px solid #000', padding: '10px', fontSize: '13px', fontWeight: 'bold' }}>Negative</th>
                </tr>
              </thead>
              <tbody>
                {exam.sections.map((s) => {
                  const count = getSectionQuestionCount(s.name, s.totalQuestions);
                  return (
                    <tr key={s.name}>
                      <td style={{ border: '1px solid #000', padding: '10px', fontSize: '13px', textAlign: 'center' }}>{s.name}</td>
                      <td style={{ border: '1px solid #000', padding: '10px', fontSize: '13px', textAlign: 'center' }}>{count}</td>
                      <td style={{ border: '1px solid #000', padding: '10px', fontSize: '13px', textAlign: 'center' }}>{s.marksPerQuestion}</td>
                      <td style={{ border: '1px solid #000', padding: '10px', fontSize: '13px', textAlign: 'center' }}>{s.negativeMarks}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginBottom: '24px', fontSize: isMobile ? '14px' : '13px', lineHeight: '1.8' }}>
          {exam.instructions ? (
            <div className="ql-editor" dangerouslySetInnerHTML={{ __html: exam.instructions }} />
          ) : (
            <p>Please follow the instructions provided by the invigilator.</p>
          )}
        </div>

        {errorMsg && (
          <div style={{ background: '#f8d7da', border: '1px solid #f5c6cb', color: '#721c24', padding: '10px 16px', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ 
          background: '#d4edda', 
          border: '1px solid #28a745', 
          padding: '16px', 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          alignItems: isMobile ? 'stretch' : 'center', 
          justifyContent: 'space-between', 
          gap: '16px' 
        }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#155724' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ width: '20px', height: '20px', accentColor: '#28a745', marginTop: '2px', flexShrink: 0 }}
            />
            <span>I have read and agreed to the instructions and rules of the exam.</span>
          </label>
          <button
            onClick={onProceed}
            disabled={!agreed}
            style={{
              padding: '12px 32px',
              fontSize: '14px',
              fontWeight: 'bold',
              background: agreed ? '#333' : '#999',
              color: '#fff',
              border: 'none',
              cursor: agreed ? 'pointer' : 'not-allowed',
              borderRadius: '4px',
            }}
          >
            Start Test
          </button>
        </div>
      </div>
    </div>
  );
}
