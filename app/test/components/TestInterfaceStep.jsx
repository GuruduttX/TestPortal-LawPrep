import { useState, useEffect } from 'react';
import { getPassageAndStem } from '@/app/test/utils/question-text';

const UI_BORDER = '#E0E0E0';
const UI_YELLOW = '#FFD700';
const UI_GREEN = '#28A745';
const UI_ORANGE = '#F5A623';

export default function TestInterfaceStep(props) {
  const {
    exam,
    questions,
    visibleQuestions,
    currentQuestion,
    adminPreview,
    name,
    formattedTime,
    activeSection,
    onSectionChange,
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
    mobileActiveTab,
    setMobileActiveTab,
  } = props;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentQ = currentQuestion;
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
        onClick={() => {
          onJumpToQuestion(questionNumber);
          if (isMobile) setMobileActiveTab('question');
        }}
        style={{ position: 'relative', width: isMobile ? '42px' : '36px', height: isMobile ? '42px' : '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '14px' : '13px', fontWeight: 'bold', background: bg, color, border, borderRadius, clipPath: clipPath || 'none', cursor: 'pointer', outline: currentQuestionNumber === questionNumber ? '2px solid #212529' : 'none', outlineOffset: '1px' }}
      >
        {questionNumber}
        {extra}
      </button>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '14px', userSelect: 'none' }} onContextMenu={(event) => event.preventDefault()} onCopy={(event) => event.preventDefault()}>
      <header style={{ flexShrink: 0, minHeight: isMobile ? '48px' : '56px', background: '#fff', borderBottom: `2px solid ${UI_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '4px 12px' : '8px 18px', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <img src="/logo.png" alt="Law Prep Tutorial" title="Law Prep Tutorial" style={{ width: isMobile ? '80px' : '100px', height: 'auto', objectFit: 'contain' }} />
          {adminPreview && <span style={{ fontSize: '9px', fontWeight: 800, color: '#0f3460', background: '#e7f1ff', padding: '2px 6px', border: '1px solid #1a5276', borderRadius: '4px' }}>PREVIEW</span>}
        </div>
        
        <div style={{ flex: 1, textAlign: isMobile ? 'left' : 'center', minWidth: 0, padding: isMobile ? '0 4px' : '0 8px' }}>
          <div style={{ fontSize: isMobile ? '12px' : '15px', fontWeight: 700, color: '#111', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exam.title}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '14px', flexShrink: 0, textAlign: 'right' }}>
          {adminPreview && (
            <button
              type="button"
              onClick={onEndPreview}
              style={{ fontSize: '10px', fontWeight: 800, color: '#0f3460', background: '#eef4ff', border: '1px solid #1a5276', borderRadius: '4px', padding: '6px 8px', cursor: 'pointer' }}
            >
              End Preview
            </button>
          )}
          {!isMobile && (
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e9ecef', border: `1px solid ${UI_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#495057', fontSize: '15px' }}>
              {adminPreview ? '…' : name ? name.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          <div style={{ fontSize: isMobile ? '10px' : '12px', lineHeight: 1.35, color: '#212529' }}>
            <div style={{ fontWeight: 700, color: '#e03131' }}>{adminPreview ? 'PREVIEW' : formattedTime()}</div>
            {!isMobile && <div><span style={{ fontWeight: 700, color: '#333' }}>Candidate:</span> {name || ''}</div>}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '1px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: UI_GREEN }} />
              <span style={{ fontSize: '9px', fontWeight: 700, color: UI_GREEN }}>{isMobile ? 'ON' : 'Online'}</span>
            </div>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', background: '#fff' }}>
        {/* PASSAGE PANEL */}
        <div style={{ 
          flex: isMobile ? '1 1 auto' : '1 1 38%', 
          minWidth: 0, 
          maxWidth: isMobile ? 'none' : '46%', 
          display: (!isMobile || mobileActiveTab === 'passage') ? 'flex' : 'none', 
          flexDirection: 'column', 
          borderRight: `1px solid ${UI_BORDER}`, 
          background: '#fff' 
        }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${UI_BORDER}`, flexShrink: 0 }}>
            <select value={activeSection} onChange={(e) => onSectionChange(e.target.value)} style={{ width: '100%', padding: '10px 12px', fontSize: '13px', fontWeight: 700, border: `1px solid ${UI_BORDER}`, borderRadius: '6px', background: '#fff', cursor: 'pointer', color: '#212529' }}>
              {hasSections ? (
                <>
                  <option value="all">All Sections</option>
                  {sectionNames.map((sectionName) => {
                    const sec = exam.sections.find((s) => s.name === sectionName);
                    const neg = sec?.negativeMarks ?? exam.negativeMarks ?? 0;
                    return <option key={sectionName} value={sectionName}>{sectionName} (+{sec?.marksPerQuestion ?? 1}, -{neg})</option>;
                  })}
                </>
              ) : (
                <option value="all">{exam.title} (+{exam.marksPerQuestion ?? 1}, -{exam.negativeMarks ?? 0})</option>
              )}
            </select>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: isMobile ? '14px 16px 80px' : '18px 20px 24px' }}>
            {passageText ? (
              <div style={{ fontSize: isMobile ? '15px' : '14px', lineHeight: 1.75, color: '#212529', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{passageText}</div>
            ) : (
              <div style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', marginTop: '20px' }}>No reading passage for this question.</div>
            )}
          </div>
        </div>

        {/* QUESTION PANEL */}
        <div style={{ 
          flex: isMobile ? '1 1 auto' : '1 1 36%', 
          minWidth: 0, 
          display: (!isMobile || mobileActiveTab === 'question') ? 'flex' : 'none', 
          flexDirection: 'column', 
          borderRight: `1px solid ${UI_BORDER}`, 
          background: '#fff' 
        }}>
          <div style={{ height: '44px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: `1px solid ${UI_BORDER}` }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#333' }}>
              Q {currentQ?.questionNumber ?? '—'}/{questions.length}
              {currentQ?.section ? ` · ${currentQ.section}` : ''}
            </span>
            <button type="button" onClick={() => { const detail = window.prompt('Report an issue:', ''); if (detail) alert('Sent to admin.'); }} style={{ fontSize: '11px', fontWeight: 700, color: '#856404', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>⚠ Report</button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: isMobile ? '16px 16px 80px' : '20px 22px 12px' }}>
            {errorMsg && <div style={{ background: '#f8d7da', border: '1px solid #f5c6cb', color: '#721c24', padding: '8px 12px', fontSize: '13px', marginBottom: '16px' }}>{errorMsg}</div>}
            {currentQ ? (
              <>
                <div style={{ fontSize: isMobile ? '16px' : '15px', fontWeight: 400, lineHeight: 1.6, color: '#222', marginBottom: '22px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{stemText || '—'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['A', 'B', 'C', 'D'].map((optKey) => {
                    const isSelected = answers[currentQuestionNumber] === optKey;
                    return (
                      <label key={optKey} onClick={() => onSelectOption(optKey)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 14px', border: isSelected ? `2px solid ${UI_GREEN}` : `1px solid ${UI_BORDER}`, background: isSelected ? '#e8f5e9' : '#fff', cursor: 'pointer', borderRadius: '8px' }}>
                        <span style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0, background: isSelected ? UI_GREEN : '#f1f3f5', color: isSelected ? '#fff' : '#495057', border: isSelected ? '2px solid #1e7e34' : `1px solid ${UI_BORDER}` }}>{optKey}</span>
                        <span style={{ fontSize: '14px', color: '#212529' }}>{currentQ.options[optKey]}</span>
                      </label>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ background: '#fff3cd', border: '1px solid #ffe69c', color: '#664d03', padding: '12px 14px', borderRadius: '8px', lineHeight: 1.6 }}>
                No question is available for the current selection. Choose another section from the dropdown or ask the admin to verify section mapping in the builder.
              </div>
            )}
          </div>
          
          {/* ACTION BUTTONS (FOOTER OF QUESTION PANEL ON MOBILE) */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', padding: '10px', background: '#fafafa', borderTop: `1px solid ${UI_BORDER}`, marginBottom: isMobile ? '60px' : '0' }}>
            <button type="button" onClick={onMarkForReview} style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, background: UI_YELLOW, border: '1px solid #e6cc00', borderRadius: '4px' }}>★ Review</button>
            <button type="button" onClick={onPrevious} disabled={isFirstQuestion} style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, background: '#e9ecef', border: `1px solid ${UI_BORDER}`, borderRadius: '4px', opacity: isFirstQuestion ? 0.5 : 1 }}>Prev</button>
            <button type="button" onClick={onClearResponse} style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, background: '#dc3545', color: '#fff', border: '1px solid #c82333', borderRadius: '4px' }}>Clear</button>
            <button type="button" onClick={onNext} disabled={isLastQuestion} style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, background: UI_YELLOW, border: '1px solid #e6cc00', borderRadius: '4px', opacity: isLastQuestion ? 0.5 : 1 }}>Next &gt;</button>
          </div>
        </div>

        {/* PALETTE PANEL */}
        <div style={{ 
          width: isMobile ? '100%' : '272px', 
          flexShrink: 0, 
          display: (!isMobile || mobileActiveTab === 'palette') ? 'flex' : 'none', 
          flexDirection: 'column', 
          background: '#fff', 
          minHeight: 0 
        }}>
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${UI_BORDER}`, background: '#f8f9fa' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#333', marginBottom: '8px' }}>LEGENDS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '12px', background: '#E8E8E8', border: `1px solid ${UI_BORDER}` }} /><span>{stats.not_visited} Unvisited</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '12px', background: UI_GREEN, clipPath: 'polygon(20% 0%, 80% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} /><span>{stats.answered} Answered</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '12px', background: UI_ORANGE, clipPath: 'polygon(20% 0%, 80% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} /><span>{stats.not_answered} Skipped</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '12px', background: '#17a2d8', borderRadius: '50%' }} /><span>{stats.marked} Review</span></div>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 14px 100px' }}>
            {visibleQuestions.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(42px, 1fr))' : 'repeat(5, 1fr)', gap: '8px', justifyItems: 'center' }}>
                {visibleQuestions.map((q) => renderPaletteButton(q.questionNumber))}
              </div>
            ) : (
              <div style={{ fontSize: '12px', lineHeight: 1.6, color: '#6c757d', background: '#f8f9fa', border: `1px dashed ${UI_BORDER}`, borderRadius: '8px', padding: '12px' }}>
                No questions are assigned to this section yet.
              </div>
            )}
          </div>

          <div style={{ padding: '12px 14px', borderTop: `1px solid ${UI_BORDER}`, background: '#f8f9fa', marginBottom: isMobile ? '60px' : '0' }}>
            <button type="button" onClick={() => { if (window.confirm('SUBMIT test?')) onSubmit(); }} disabled={isSubmitting} style={{ width: '100%', padding: '12px 0', fontSize: '14px', fontWeight: 700, background: isSubmitting ? '#adb5bd' : UI_GREEN, color: '#fff', borderRadius: '4px' }}>
              {isSubmitting ? '...' : 'SUBMIT TEST'}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM TAB BAR */}
      {isMobile && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '60px', background: '#1a1a2e', display: 'flex', borderTop: '2px solid #e94560', zIndex: 100 }}>
          {[
            { id: 'passage', label: 'Passage', icon: '📄' },
            { id: 'question', label: 'Question', icon: '❓' },
            { id: 'palette', label: 'Status', icon: '📊' }
          ].map(tab => {
            const isActive = mobileActiveTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setMobileActiveTab(tab.id)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', color: isActive ? '#e94560' : 'rgba(255,255,255,0.6)', borderBottom: isActive ? '3px solid #e94560' : 'none' }}
              >
                <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>{tab.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  );
}
