"use client";

import { getPassageAndStem } from '@/app/test/utils/question-text';

const UI_BORDER = '#E0E0E0';
const UI_YELLOW = '#FFD700';
const UI_GREEN = '#28A745';
const UI_ORANGE = '#F5A623';

export default function TestInterfaceStep(props) {
  const {
    exam,
    questions,
    adminPreview,
    name,
    formattedTime,
    activeSection,
    setActiveSection,
    hasSections,
    sectionNames,
    currentQuestionNumber,
    answers,
    errorMsg,
    stats,
    statuses,
    isFirstQuestion,
    isLastQuestion,
    isSubmitting,
    onSelectOption,
    onMarkForReview,
    onPrevious,
    onClearResponse,
    onNext,
    onJumpToQuestion,
    onSubmit,
    onEndPreview,
  } = props;

  const currentQ = questions.find((question) => question.questionNumber === currentQuestionNumber);
  const { passage: passageText, stem: stemText } = getPassageAndStem(currentQ);

  const renderPaletteButton = (questionNumber) => {
    const state = statuses[questionNumber] || 'not_visited';
    let bg;
    let color;
    let border;
    let borderRadius;
    let clipPath;
    let extra = null;

    if (state === 'not_visited') {
      bg = '#E8E8E8';
      color = '#333';
      border = `1px solid ${UI_BORDER}`;
      borderRadius = '2px';
    } else if (state === 'not_answered') {
      bg = UI_ORANGE;
      color = '#fff';
      border = '1px solid #e09900';
      borderRadius = '2px';
      clipPath = 'polygon(20% 0%, 80% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
    } else if (state === 'answered') {
      bg = UI_GREEN;
      color = '#fff';
      border = '1px solid #1e7e34';
      borderRadius = '2px';
      clipPath = 'polygon(20% 0%, 80% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
    } else if (state === 'marked') {
      bg = '#17a2d8';
      color = '#fff';
      border = '1px solid #138496';
      borderRadius = '50%';
    } else if (state === 'answered_marked') {
      bg = '#17a2d8';
      color = '#fff';
      border = '1px solid #138496';
      borderRadius = '50%';
      extra = (
        <span style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '11px', height: '11px', borderRadius: '50%', background: UI_GREEN, border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', lineHeight: 1, color: '#fff', fontWeight: 900 }}>
          ✓
        </span>
      );
    }

    return (
      <button
        key={questionNumber}
        type="button"
        onClick={() => onJumpToQuestion(questionNumber)}
        style={{ position: 'relative', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', background: bg, color, border, borderRadius, clipPath: clipPath || 'none', cursor: 'pointer', outline: currentQuestionNumber === questionNumber ? '2px solid #212529' : 'none', outlineOffset: '1px' }}
      >
        {questionNumber}
        {extra}
      </button>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '14px', userSelect: 'none' }} onContextMenu={(event) => event.preventDefault()} onCopy={(event) => event.preventDefault()}>
      <header style={{ flexShrink: 0, minHeight: '56px', background: '#ffffff', borderBottom: `2px solid ${UI_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 18px', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <div title="Law Prep Tutorial" style={{ width: '54px', height: '38px', borderRadius: '50%', background: 'linear-gradient(165deg, #ffe066 0%, #ffd43b 42%, #e03131 95%)', border: '2px solid #c92a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 900, color: '#1a1a1a', textAlign: 'center', lineHeight: 1.05, padding: '2px' }}>
            LAW
            <br />
            PREP
          </div>
          {adminPreview && <span style={{ fontSize: '10px', fontWeight: 800, color: '#0f3460', background: '#e7f1ff', padding: '4px 8px', border: '1px solid #1a5276', borderRadius: '4px' }}>PREVIEW</span>}
        </div>
        <div style={{ flex: 1, textAlign: 'center', minWidth: 0, padding: '0 8px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#111', lineHeight: 1.35 }}>{exam.title}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0, textAlign: 'right' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e9ecef', border: `1px solid ${UI_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#495057', fontSize: '15px' }}>
            {adminPreview ? '…' : name ? name.charAt(0).toUpperCase() : '?'}
          </div>
          <div style={{ fontSize: '12px', lineHeight: 1.45, color: '#212529' }}>
            <div><span style={{ fontWeight: 700, color: '#333' }}>Candidate name:</span> <span>{adminPreview ? '' : name || ''}</span></div>
            <div style={{ fontWeight: 700 }}>{adminPreview ? 'Remaining Time: — (preview)' : `Remaining Time: ${formattedTime()}`}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '3px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: UI_GREEN, boxShadow: '0 0 0 1px rgba(40,167,69,0.25)' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: UI_GREEN }}>Online</span>
            </div>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', background: '#fff' }}>
        <div style={{ flex: '1 1 38%', minWidth: 0, maxWidth: '46%', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${UI_BORDER}`, background: '#fff' }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${UI_BORDER}`, flexShrink: 0 }}>
            <select value={activeSection} onChange={(e) => setActiveSection(e.target.value)} style={{ width: '100%', padding: '10px 12px', fontSize: '13px', fontWeight: 700, border: `1px solid ${UI_BORDER}`, borderRadius: '6px', background: '#fff', cursor: 'pointer', color: '#212529' }}>
              {hasSections ? (
                <>
                  <option value="all">All Sections</option>
                  {sectionNames.map((sectionName) => {
                    const sec = exam.sections.find((s) => s.name === sectionName);
                    const neg = sec?.negativeMarks ?? exam.negativeMarks ?? 0;
                    return <option key={sectionName} value={sectionName}>{sectionName} - {sectionName} (+{sec?.marksPerQuestion ?? 1}, -{neg})</option>;
                  })}
                </>
              ) : (
                <option value="all">{exam.title} - {exam.title} (+{exam.marksPerQuestion ?? 1}, -{exam.negativeMarks ?? 0})</option>
              )}
            </select>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 20px 24px' }}>
            {passageText ? (
              <div style={{ fontSize: '14px', lineHeight: 1.75, color: '#212529', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{passageText}</div>
            ) : (
              <p style={{ margin: 0, fontSize: '13px', color: '#adb5bd', fontStyle: 'italic', lineHeight: 1.65 }}>No reading passage for this item. Add one in the question builder (Reading passage), or put passage then a line with only <strong>---</strong> then the stem in Question text.</p>
            )}
          </div>
        </div>

        <div style={{ flex: '1 1 36%', minWidth: 0, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${UI_BORDER}`, background: '#fff' }}>
          <div style={{ height: '44px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: `1px solid ${UI_BORDER}` }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#333' }}>Question No {currentQ?.questionNumber ?? '—'}/{questions.length}</span>
            <button type="button" onClick={() => { const detail = window.prompt('Report an issue with this question (optional):', ''); if (detail !== null && String(detail).trim()) alert('Thank you. In production this would be sent to administrators.'); }} style={{ fontSize: '12px', fontWeight: 700, color: '#856404', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><span aria-hidden>⚠</span> Report</button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 22px 12px' }}>
            {errorMsg && <div style={{ background: '#f8d7da', border: '1px solid #f5c6cb', color: '#721c24', padding: '8px 12px', fontSize: '13px', marginBottom: '16px' }}>{errorMsg}</div>}
            <div style={{ fontSize: '15px', fontWeight: 400, lineHeight: 1.7, color: '#222', marginBottom: '22px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{stemText || '—'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['A', 'B', 'C', 'D'].map((optKey) => {
                const isSelected = answers[currentQuestionNumber] === optKey;
                return (
                  <label key={optKey} onClick={() => onSelectOption(optKey)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', border: isSelected ? `2px solid ${UI_GREEN}` : `1px solid ${UI_BORDER}`, background: isSelected ? '#e8f5e9' : '#fff', cursor: 'pointer', borderRadius: '8px', transition: 'border-color 0.15s, background 0.15s' }}>
                    <span style={{ width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0, background: isSelected ? UI_GREEN : '#f1f3f5', color: isSelected ? '#fff' : '#495057', border: isSelected ? '2px solid #1e7e34' : `1px solid ${UI_BORDER}` }}>{optKey}</span>
                    <span style={{ fontSize: '14px', color: '#212529', lineHeight: 1.45 }}>{currentQ?.options[optKey]}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', padding: '12px 14px', background: '#fafafa', borderTop: `1px solid ${UI_BORDER}` }}>
            <button type="button" onClick={onMarkForReview} style={{ padding: '9px 18px', fontSize: '12px', fontWeight: 700, background: UI_YELLOW, color: '#212529', border: '1px solid #e6cc00', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>★ Mark for review</button>
            <button type="button" onClick={onPrevious} disabled={isFirstQuestion} style={{ padding: '9px 18px', fontSize: '12px', fontWeight: 700, background: isFirstQuestion ? '#dee2e6' : '#e9ecef', color: isFirstQuestion ? '#868e96' : '#495057', border: `1px solid ${UI_BORDER}`, borderRadius: '4px', cursor: isFirstQuestion ? 'not-allowed' : 'pointer' }}>Previous</button>
            <button type="button" onClick={onClearResponse} style={{ padding: '9px 18px', fontSize: '12px', fontWeight: 700, background: '#dc3545', color: '#fff', border: '1px solid #c82333', borderRadius: '4px', cursor: 'pointer' }}>Clear</button>
            <button type="button" onClick={onNext} disabled={isLastQuestion} style={{ padding: '9px 18px', fontSize: '12px', fontWeight: 700, background: isLastQuestion ? '#dee2e6' : UI_YELLOW, color: isLastQuestion ? '#868e96' : '#212529', border: `1px solid ${isLastQuestion ? UI_BORDER : '#e6cc00'}`, borderRadius: '4px', cursor: isLastQuestion ? 'not-allowed' : 'pointer' }}>Next &gt;</button>
          </div>
        </div>

        <div style={{ width: '272px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#fff', minHeight: 0 }}>
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${UI_BORDER}`, background: '#f8f9fa' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#333', marginBottom: '10px', borderBottom: `1px solid ${UI_BORDER}`, paddingBottom: '6px' }}>LEGENDS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#333' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '16px', height: '16px', background: '#E8E8E8', border: `1px solid ${UI_BORDER}`, borderRadius: '2px', flexShrink: 0 }} /><span>{stats.not_visited} Not visited</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '16px', height: '16px', background: '#17a2d8', border: '1px solid #138496', borderRadius: '50%', flexShrink: 0 }} /><span>{stats.marked} Mark for review</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '16px', height: '16px', background: UI_GREEN, border: '1px solid #1e7e34', borderRadius: '2px', flexShrink: 0, clipPath: 'polygon(20% 0%, 80% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} /><span>{stats.answered} Answered</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '16px', height: '16px', background: UI_ORANGE, border: '1px solid #e09900', borderRadius: '2px', flexShrink: 0, clipPath: 'polygon(20% 0%, 80% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} /><span>{stats.not_answered} Unanswered</span></div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '10px', color: '#555', lineHeight: 1.35 }}>
                <span style={{ position: 'relative', width: '16px', height: '16px', background: '#17a2d8', border: '1px solid #138496', borderRadius: '50%', flexShrink: 0, marginTop: '1px' }}>
                  <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '8px', height: '8px', borderRadius: '50%', background: UI_GREEN, border: '1px solid #fff' }} />
                </span>
                <span>{stats.answered_marked} Answered and mark for review (will be considered for evaluation)</span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', justifyItems: 'center' }}>
              {questions.filter((q) => activeSection === 'all' || q.section === activeSection).map((q) => renderPaletteButton(q.questionNumber))}
            </div>
          </div>

          <div style={{ padding: '12px 14px', borderTop: `1px solid ${UI_BORDER}`, background: '#f8f9fa' }}>
            {adminPreview ? (
              <button type="button" onClick={() => { if (window.confirm('Leave preview and return to the exam list?')) onEndPreview(); }} style={{ width: '100%', padding: '12px 0', fontSize: '14px', fontWeight: 700, background: '#1a5276', color: '#fff', border: '1px solid #0f3460', borderRadius: '4px', cursor: 'pointer' }}>
                End preview
              </button>
            ) : (
              <button type="button" onClick={() => { if (window.confirm('Are you certain you want to SUBMIT? You will not be able to return.')) onSubmit(); }} disabled={isSubmitting} style={{ width: '100%', padding: '12px 0', fontSize: '14px', fontWeight: 700, background: isSubmitting ? '#adb5bd' : UI_GREEN, color: '#fff', border: `1px solid ${isSubmitting ? '#868e96' : '#1e7e34'}`, borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
