"use client";

import { useState } from 'react';

export default function ResultClient({
  attempt,
  exam,
  questions,
  maxPossibleMarks,
  isAdminView = false,
}) {
  const [copied, setCopied] = useState(false);

  const totalQuestions = questions.length;
  // maxPossibleMarks is computed server-side and passed as a prop
  const pctDenominator = maxPossibleMarks > 0 ? maxPossibleMarks : (totalQuestions || 1);
  const percentage = Math.max(0, Math.round((attempt.score / pctDenominator) * 100));

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Create a map of student answers for O(1) lookup
  const studentAnswers = {};
  attempt.answers.forEach(a => {
    studentAnswers[a.questionNumber] = a.selectedOption;
  });

  // Calculate stats
  let correctCount = 0, incorrectCount = 0, skippedCount = 0;
  questions.forEach((q) => {
    const sel = studentAnswers[q.questionNumber];
    if (!sel) skippedCount++;
    else if (sel === q.correctAnswer) correctCount++;
    else incorrectCount++;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header Panel — only shown for student view (admin has its own header) */}
      {!isAdminView && (
        <div className="bg-white border border-gray-300 rounded-sm shadow-sm overflow-hidden mt-4">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Assessment Result Report</h1>
              <p className="text-sm text-gray-500 mt-1">
                {exam?.title || attempt.examTitle} report.
              </p>
            </div>
            <button 
              onClick={handleCopyLink}
              className="mt-4 sm:mt-0 inline-flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium py-1.5 px-4 rounded-sm hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              <span>{copied ? 'Copied to Clipboard' : 'Copy Report URL'}</span>
            </button>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Candidate Name</div>
                  <div className="font-medium text-gray-900">{attempt.studentName}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Contact Number</div>
                  <div className="font-medium text-gray-900">{attempt.studentPhone}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Exam</div>
                  <div className="font-medium text-gray-900">{exam?.title || attempt.examTitle}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Submission Time</div>
                  <div className="font-medium text-gray-900">
                    {new Date(attempt.submittedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-span-1 border-l border-gray-200 md:pl-6 flex flex-col items-start justify-center">
              <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Final Score</div>
              <div className="flex items-end space-x-3">
                <span className={`text-4xl font-bold ${percentage >= 60 ? 'text-green-600' : attempt.score < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                  {percentage}%
                </span>
                <span className="text-gray-600 font-medium mb-1">
                  ({attempt.score}/{pctDenominator})
                </span>
              </div>
              {/* Correct/Incorrect/Skipped mini breakdown */}
              <div className="mt-3 text-xs text-gray-500 space-y-0.5">
                <div><span className="text-green-600 font-bold">{correctCount}</span> correct · <span className="text-red-500 font-bold">{incorrectCount}</span> wrong · <span className="text-gray-400 font-bold">{skippedCount}</span> skipped</div>
                {(exam?.negativeMarks > 0 || exam?.sections?.some(s => s.negativeMarks > 0)) && (
                  <div className="text-amber-600 font-medium">Negative marking applied</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 py-2" style={{ borderBottom: '1px solid #dfe6e9' }}>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded-sm" style={{ background: '#d4edda', border: '2px solid #27ae60' }} />
          <span className="text-[12px] font-bold" style={{ color: '#155724' }}>Correct ({correctCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded-sm" style={{ background: '#f8d7da', border: '2px solid #e94560' }} />
          <span className="text-[12px] font-bold" style={{ color: '#721c24' }}>Incorrect ({incorrectCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded-sm" style={{ background: '#e2e3e5', border: '2px solid #adb5bd' }} />
          <span className="text-[12px] font-bold" style={{ color: '#383d41' }}>Skipped ({skippedCount})</span>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q) => {
          const selected = studentAnswers[q.questionNumber];
          const isCorrect = selected === q.correctAnswer;
          const isSkipped = !selected;
          
          // Card styling
          let cardBorder, headerBg, headerBorder, badgeText, badgeBg, badgeColor, badgeBorder;
          
          if (isSkipped) {
            cardBorder = '#adb5bd';
            headerBg = '#f8f9fa';
            headerBorder = '#dfe6e9';
            badgeText = 'Not Attempted';
            badgeBg = '#e2e3e5';
            badgeColor = '#383d41';
            badgeBorder = '#adb5bd';
          } else if (isCorrect) {
            cardBorder = '#27ae60';
            headerBg = '#f0fff4';
            headerBorder = '#a3d9b1';
            badgeText = 'Correct';
            badgeBg = '#d4edda';
            badgeColor = '#155724';
            badgeBorder = '#a3d9b1';
          } else {
            cardBorder = '#e94560';
            headerBg = '#fff5f5';
            headerBorder = '#f5c6cb';
            badgeText = 'Incorrect';
            badgeBg = '#f8d7da';
            badgeColor = '#721c24';
            badgeBorder = '#f5c6cb';
          }

          return (
            <div key={q.questionNumber} className="overflow-hidden"
              style={{ border: `2px solid ${cardBorder}`, background: '#ffffff' }}>
              {/* Question header */}
              <div className="px-5 py-3 flex justify-between items-start"
                style={{ background: headerBg, borderBottom: `1px solid ${headerBorder}` }}>
                <div className="flex items-start gap-2">
                  <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-sm text-[11px] font-black text-white"
                    style={{ background: isSkipped ? '#adb5bd' : isCorrect ? '#27ae60' : '#e94560' }}>
                    {q.questionNumber}
                  </span>
                  <h3 className="text-[14px] font-semibold pt-0.5" style={{ color: '#1a1a2e' }}>
                    {q.questionText}
                  </h3>
                </div>
                <span className="ml-4 shrink-0 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-sm"
                  style={{ background: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}` }}>
                  {badgeText}
                </span>
              </div>
              
              {/* Options */}
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {['A', 'B', 'C', 'D'].map((optKey) => {
                    const isThisSelected = selected === optKey;
                    const isThisCorrect = q.correctAnswer === optKey;
                    
                    let optBg, optBorder, optColor, labelBg, labelColor;
                    let icon = null;
                    let annotation = null;
                    
                    if (isThisCorrect && isThisSelected) {
                      // Student picked correctly
                      optBg = '#d4edda';
                      optBorder = '#27ae60';
                      optColor = '#155724';
                      labelBg = '#27ae60';
                      labelColor = '#ffffff';
                      icon = (
                        <svg className="w-4 h-4 shrink-0" style={{ color: '#27ae60' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      );
                      annotation = 'Your Answer ✓';
                    } else if (isThisCorrect && !isThisSelected) {
                      // This is correct but student didn't pick it
                      optBg = '#d4edda';
                      optBorder = '#27ae60';
                      optColor = '#155724';
                      labelBg = '#27ae60';
                      labelColor = '#ffffff';
                      icon = (
                        <svg className="w-4 h-4 shrink-0" style={{ color: '#27ae60' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      );
                      annotation = 'Correct Answer';
                    } else if (isThisSelected && !isThisCorrect) {
                      // Student picked wrong answer
                      optBg = '#f8d7da';
                      optBorder = '#e94560';
                      optColor = '#721c24';
                      labelBg = '#e94560';
                      labelColor = '#ffffff';
                      icon = (
                        <svg className="w-4 h-4 shrink-0" style={{ color: '#e94560' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                        </svg>
                      );
                      annotation = 'Student Selected ✗';
                    } else {
                      // Not selected, not correct
                      optBg = '#ffffff';
                      optBorder = '#dfe6e9';
                      optColor = '#636e72';
                      labelBg = '#f0f3f8';
                      labelColor = '#636e72';
                    }

                    return (
                      <div 
                        key={optKey} 
                        className="flex items-start p-3 rounded-sm"
                        style={{ background: optBg, border: `2px solid ${optBorder}`, color: optColor }}
                      >
                        {/* Letter badge */}
                        <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-sm mr-3 text-[12px] font-black"
                          style={{ background: labelBg, color: labelColor }}>
                          {optKey}
                        </span>

                        {/* Option text */}
                        <div className="flex-1 min-w-0">
                          <span className="text-[13px] font-medium">{q.options[optKey]}</span>
                          {annotation && (
                            <p className="text-[10px] font-bold mt-0.5 uppercase tracking-wider"
                              style={{ color: isThisCorrect ? '#27ae60' : '#e94560' }}>
                              {annotation}
                            </p>
                          )}
                        </div>

                        {/* Icon */}
                        {icon && <div className="shrink-0 ml-2 mt-0.5">{icon}</div>}
                      </div>
                    );
                  })}
                </div>

                {/* Summary line for wrong/skipped questions */}
                {!isCorrect && (
                  <div className="mt-3 px-3 py-2 rounded-sm text-[12px] font-bold flex items-center gap-3"
                    style={{ background: '#f0f3f8', border: '1px solid #dfe6e9' }}>
                    {isSkipped ? (
                      <>
                        <span style={{ color: '#636e72' }}>Student did not attempt this question.</span>
                        <span style={{ color: '#27ae60' }}>Correct answer: <strong>Option {q.correctAnswer}</strong></span>
                      </>
                    ) : (
                      <>
                        <span style={{ color: '#e94560' }}>
                          Student selected: <strong>Option {selected}</strong>
                        </span>
                        <span style={{ color: '#636e72' }}>→</span>
                        <span style={{ color: '#27ae60' }}>
                          Correct answer: <strong>Option {q.correctAnswer}</strong>
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
