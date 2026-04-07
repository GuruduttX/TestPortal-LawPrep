"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('react-simple-wysiwyg').then(mod => mod.default || mod.Editor || mod), { ssr: false });

async function readApiErrorMessage(res) {
  const text = await res.text();
  if (!text) return res.statusText || 'Request failed';
  try {
    const data = JSON.parse(text);
    return data.error || data.message || text;
  } catch {
    return text.slice(0, 200);
  }
}

function safeNonNegNumber(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}


export default function AdminTestEditorClient({ initialExam, initialQuestions }) {
  const router = useRouter();

  // State
  const [exam, setExam] = useState(initialExam);
  const [questions, setQuestions] = useState(initialQuestions);
  
  // step: 1 = Exam Settings (Instructions View), 2 = Question Builder (Test View)
  const [step, setStep] = useState(1);
  const [activeQ, setActiveQ] = useState(questions.length > 0 ? questions[0].questionNumber : 1);
  const [activeSection, setActiveSection] = useState('all');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const successTimerRef = useRef(null);
  
  // Editor State for Exam Settings
  const [editTitle, setEditTitle] = useState(exam.title || '');
  const [editDuration, setEditDuration] = useState(String(exam.durationMinutes ?? 120));
  const [editTotalQuestions, setEditTotalQuestions] = useState(exam.totalQuestionsOverride !== null ? String(exam.totalQuestionsOverride) : '');
  const [editTotalMarks, setEditTotalMarks] = useState(exam.totalMarksOverride !== null ? String(exam.totalMarksOverride) : '');
  const [editTotalSections, setEditTotalSections] = useState(exam.totalSectionsOverride !== null ? String(exam.totalSectionsOverride) : '');
  const [editMarks, setEditMarks] = useState(String(exam.marksPerQuestion ?? 1));
  const [editNegative, setEditNegative] = useState(String(exam.negativeMarks ?? 0));
  const [editSections, setEditSections] = useState(
    exam.sections?.length > 0
      ? exam.sections.map((s) => ({
          name: s.name,
          totalQuestions: s.totalQuestions !== null && s.totalQuestions !== undefined ? String(s.totalQuestions) : '',
          marksPerQuestion: String(s.marksPerQuestion ?? exam.marksPerQuestion ?? 1),
          negativeMarks: String(s.negativeMarks ?? exam.negativeMarks ?? 0),
        }))
      : []
  );
  const [editInstructions, setEditInstructions] = useState(exam.instructions || '');

  // Editor State for active question
  const currentQ = questions.find((q) => q.questionNumber === activeQ);
  const [qText, setQText] = useState(currentQ?.questionText || '');
  const [qPassage, setQPassage] = useState(currentQ?.passage || '');
  const [qSection, setQSection] = useState(currentQ?.section || '');
  const [qOptions, setQOptions] = useState(currentQ?.options || { A: '', B: '', C: '', D: '' });
  const [qCorrect, setQCorrect] = useState(currentQ?.correctAnswer || 'A');

  const hasSections = editSections && editSections.length > 0;
  const sectionNames = hasSections ? editSections.map((s) => s.name.trim()).filter(Boolean) : [];
  const marksNum = safeNonNegNumber(editMarks, 1);
  const negNum = safeNonNegNumber(editNegative, 0);

  const handleUpdateSection = (index, field, value) => {
    setEditSections((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!successMsg) return undefined;
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessMsg(''), 4500);
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, [successMsg]);

  /** Persist exam settings. Pass `sectionsOverride` when state has not flushed yet (e.g. after removing a row). */
  const persistExamSettings = async (sectionsOverride) => {
    const title = editTitle.trim();
    if (!title) {
      const msg = 'Exam title is required';
      setErrorMsg(msg);
      return { ok: false, error: msg };
    }

    const duration = Math.floor(Number(editDuration));
    if (!Number.isFinite(duration) || duration < 1) {
      const msg = 'Duration must be a whole number of minutes (at least 1)';
      setErrorMsg(msg);
      return { ok: false, error: msg };
    }

    const marks = safeNonNegNumber(editMarks, 1);
    const neg = safeNonNegNumber(editNegative, 0);
    if (!Number.isFinite(marks) || marks < 0) {
      const msg = 'Marks per question must be a valid non-negative number';
      setErrorMsg(msg);
      return { ok: false, error: msg };
    }
    if (!Number.isFinite(neg) || neg < 0) {
      const msg = 'Negative marks must be a valid non-negative number';
      setErrorMsg(msg);
      return { ok: false, error: msg };
    }

    if (editTotalQuestions === '') {
      const msg = 'Enter total questions (shown to candidates on the instruction screen)';
      setErrorMsg(msg);
      return { ok: false, error: msg };
    }
    const totalQ = Math.floor(Number(editTotalQuestions));
    if (!Number.isFinite(totalQ) || totalQ < 0) {
      const msg = 'Total questions must be a whole number ≥ 0';
      setErrorMsg(msg);
      return { ok: false, error: msg };
    }

    if (editTotalMarks === '') {
      const msg = 'Enter total marks (shown to candidates on the instruction screen)';
      setErrorMsg(msg);
      return { ok: false, error: msg };
    }
    const totalM = Number(editTotalMarks);
    if (!Number.isFinite(totalM) || totalM < 0) {
      const msg = 'Total marks must be a number ≥ 0';
      setErrorMsg(msg);
      return { ok: false, error: msg };
    }

    if (editTotalSections === '') {
      const msg = 'Enter total number of sections (use 0 if the exam has no sections)';
      setErrorMsg(msg);
      return { ok: false, error: msg };
    }
    const totalSec = Math.floor(Number(editTotalSections));
    if (!Number.isFinite(totalSec) || totalSec < 0) {
      const msg = 'Total sections must be a whole number ≥ 0';
      setErrorMsg(msg);
      return { ok: false, error: msg };
    }

    const sectionsSource = sectionsOverride ?? editSections;
    const parsedSections = sectionsSource
      .map((s) => ({
        name: String(s.name ?? '').trim(),
        totalQuestions: (() => {
          if (s.totalQuestions === '' || s.totalQuestions === undefined) return null;
          const n = Math.floor(Number(s.totalQuestions));
          if (!Number.isFinite(n) || n < 0) return null;
          return n;
        })(),
        marksPerQuestion: safeNonNegNumber(s.marksPerQuestion, marks),
        negativeMarks: safeNonNegNumber(s.negativeMarks, neg),
      }))
      .filter((s) => s.name.length > 0);

    setIsSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/exam/${exam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          durationMinutes: Math.floor(duration),
          totalQuestionsOverride: totalQ,
          totalMarksOverride: totalM,
          totalSectionsOverride: totalSec,
          marksPerQuestion: marks,
          negativeMarks: neg,
          sections: parsedSections,
          instructions: editInstructions,
        }),
      });

      if (!res.ok) {
        const message = await readApiErrorMessage(res);
        setErrorMsg(message);
        return { ok: false, error: message };
      }
      const updatedExam = await res.json();
      setExam(updatedExam);
      setSuccessMsg('Exam settings saved');
      router.refresh();
      return { ok: true, exam: updatedExam };
    } catch (err) {
      const message = err?.message || 'Could not save settings';
      setErrorMsg(message);
      return { ok: false, error: message };
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoSaveSettings = () => persistExamSettings();

  const handleProceedToBuilder = async () => {
    const result = await persistExamSettings();
    if (result.ok) setStep(2);
  };

  const handleRemoveSection = async (index) => {
    const next = editSections.filter((_, i) => i !== index);
    setEditSections(next);
    await persistExamSettings(next);
  };

  // Handlers for Question Builder
  const jumpToQuestion = (qNum) => {
    const q = questions.find(qu => qu.questionNumber === qNum);
    setActiveQ(qNum);
    if (q) {
      setQText(q.questionText);
      setQPassage(q.passage || '');
      setQOptions(q.options || { A: '', B: '', C: '', D: '' });
      setQCorrect(q.correctAnswer);
      setQSection(q.section || '');
    } else {
      setQText('');
      setQPassage('');
      setQOptions({ A: '', B: '', C: '', D: '' });
      setQCorrect('A');
      setQSection('');
    }
    setErrorMsg('');
  };

  const handleAddNewQuestion = () => {
    const nextNum = questions.length > 0 ? Math.max(...questions.map(q => q.questionNumber)) + 1 : 1;
    setActiveQ(nextNum);
    setQText('');
    setQPassage('');
    setQOptions({ A: '', B: '', C: '', D: '' });
    setQCorrect('A');
    setQSection(sectionNames.length > 0 ? sectionNames[0] : '');
  };

  const applySavedQuestionToForm = (savedQ) => {
    setActiveQ(savedQ.questionNumber);
    setQText(savedQ.questionText);
    setQPassage(savedQ.passage || '');
    setQOptions(savedQ.options || { A: '', B: '', C: '', D: '' });
    setQCorrect(savedQ.correctAnswer);
    setQSection(savedQ.section || '');
  };

  const mergeSavedQuestionIntoList = (savedQ) => {
    setQuestions((prev) => {
      const without = prev.filter(
        (q) => q.id !== savedQ.id && q.questionNumber !== savedQ.questionNumber
      );
      return [...without, savedQ].sort((a, b) => a.questionNumber - b.questionNumber);
    });
    applySavedQuestionToForm(savedQ);
  };

  const handleSaveQuestion = async (andGoToNext = false) => {
    if (!qText.trim() || !qOptions.A.trim() || !qOptions.B.trim() || !qOptions.C.trim() || !qOptions.D.trim()) {
      setErrorMsg('Please enter question text and all four options (A–D)');
      return;
    }

    const qNum = Number(activeQ);
    if (!Number.isInteger(qNum) || qNum < 1) {
      setErrorMsg('Question number must be a whole number ≥ 1');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/exam/${exam.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQ?.id,
          questionNumber: qNum,
          section: qSection,
          questionText: qText.trim(),
          passage: qPassage.trim(),
          options: {
            A: qOptions.A.trim(),
            B: qOptions.B.trim(),
            C: qOptions.C.trim(),
            D: qOptions.D.trim(),
          },
          correctAnswer: qCorrect,
        }),
      });

      if (!res.ok) {
        const message = await readApiErrorMessage(res);
        setErrorMsg(message);
        return;
      }
      const savedQ = await res.json();
      mergeSavedQuestionIntoList(savedQ);
      setSuccessMsg(`Question ${savedQ.questionNumber} saved`);
      router.refresh();
      if (andGoToNext) handleAddNewQuestion();
    } catch (err) {
      setErrorMsg(err?.message || 'Could not save question');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!currentQ?.id) {
      const nextSaved = questions
        .filter((q) => q.questionNumber !== activeQ)
        .sort((a, b) => a.questionNumber - b.questionNumber);
      if (nextSaved.length) jumpToQuestion(nextSaved[0].questionNumber);
      else handleAddNewQuestion();
      setErrorMsg('');
      setSuccessMsg('Draft cleared');
      return;
    }
    if (!window.confirm('Delete this question permanently? This cannot be undone.')) return;

    setIsSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/exam/${exam.id}?questionId=${currentQ.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const message = await readApiErrorMessage(res);
        setErrorMsg(message);
        return;
      }

      const filtered = questions.filter((q) => q.id !== currentQ.id);
      setQuestions(filtered);
      setSuccessMsg('Question deleted');
      router.refresh();
      if (filtered.length) jumpToQuestion(filtered[0].questionNumber);
      else handleAddNewQuestion();
    } catch (err) {
      setErrorMsg(err?.message || 'Could not delete question');
    } finally {
      setIsSaving(false);
    }
  };

  // ===========================
  // STEP 1: Instructions/Settings Editor
  // ===========================
  if (step === 1) {
    return (
      <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', color: '#333' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          .admin-placeholder-input::placeholder { color: #222; opacity: 1; }
        `}} />
        {/* Yellow Header Bar */}
        <div style={{ background: '#FFD700', padding: '12px 0', borderBottom: '3px solid #e6c200' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative' }}>
             <button
              onClick={() => router.push('/admin/exams')}
              style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', background: '#000', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              Exit Editor
            </button>
            <input 
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              placeholder="Exam Title"
              style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', background: 'transparent', border: 'none', borderBottom: '2px dashed #000', outline: 'none', textAlign: 'center', width: '50%' }}
            />
          </div>
        </div>

        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px' }}>
          {/* Summary Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', border: '1px solid #000' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Total Questions</th>
                <th style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Total Time (Minutes)</th>
                <th style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Total Marks</th>
                <th style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Total Number Of Sections</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', textAlign: 'center' }}>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={editTotalQuestions}
                    onChange={(e) => setEditTotalQuestions(e.target.value.replace(/[^\d]/g, ''))}
                    onBlur={handleAutoSaveSettings}
                    placeholder="e.g. 60"
                    title="Total questions shown on the candidate instruction screen"
                    className="admin-placeholder-input"
                    style={{ width: '80px', padding: '6px', textAlign: 'center', border: '1px solid #ccc', margin: '0 auto', display: 'block', borderRadius: '2px' }}
                  />
                </td>
                <td style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      onBlur={handleAutoSaveSettings}
                      style={{ width: '68px', padding: '6px 8px', textAlign: 'center', border: '1px solid #ccc', borderRadius: '2px' }}
                    />
                    <span style={{ fontSize: '13px', color: '#444' }}>minutes</span>
                  </div>
                </td>
                <td style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', textAlign: 'center' }}>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={editTotalMarks}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '' || /^\d*\.?\d*$/.test(v)) setEditTotalMarks(v);
                    }}
                    onBlur={handleAutoSaveSettings}
                    placeholder="e.g. 60"
                    title="Total marks shown on the candidate instruction screen"
                    className="admin-placeholder-input"
                    style={{ width: '80px', padding: '6px', textAlign: 'center', border: '1px solid #ccc', margin: '0 auto', display: 'block', borderRadius: '2px' }}
                  />
                </td>
                <td style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', textAlign: 'center' }}>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={editTotalSections}
                    onChange={(e) => setEditTotalSections(e.target.value.replace(/[^\d]/g, ''))}
                    onBlur={handleAutoSaveSettings}
                    placeholder="e.g. 5"
                    title="Total sections shown to candidates (0 if none)"
                    className="admin-placeholder-input"
                    style={{ width: '80px', padding: '6px', textAlign: 'center', border: '1px solid #ccc', margin: '0 auto', display: 'block', borderRadius: '2px' }}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          {/* Section Breakdown Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', border: '1px solid #000' }}>
             <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Section Name</th>
                  <th style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Total Questions</th>
                  <th style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Marks per question</th>
                  <th style={{ border: '1px solid #000', padding: '10px 16px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Negative marks per question</th>
                  <th style={{ border: '1px solid #000', padding: '10px 16px', width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {editSections.map((s, idx) => (
                    <tr key={idx}>
                      <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                        <input 
                          value={s.name} 
                          onChange={(e) => handleUpdateSection(idx, 'name', e.target.value)}
                          onBlur={handleAutoSaveSettings}
                          style={{ width: '100%', padding: '4px', border: '1px solid #ccc' }} 
                        />
                      </td>
                      <td style={{ border: '1px solid #000', padding: '6px 10px', fontSize: '14px', textAlign: 'center' }}>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={s.totalQuestions !== undefined ? s.totalQuestions : ''}
                          onChange={(e) => handleUpdateSection(idx, 'totalQuestions', e.target.value.replace(/[^\d]/g, ''))}
                          onBlur={handleAutoSaveSettings}
                          placeholder="—"
                          title="Planned questions in this section (for your records)"
                          className="admin-placeholder-input"
                          style={{ width: '64px', padding: '6px', textAlign: 'center', border: '1px solid #ccc', margin: '0 auto', display: 'block', borderRadius: '2px' }}
                        />
                      </td>
                      <td style={{ border: '1px solid #000', padding: '6px 10px', fontSize: '14px', textAlign: 'center' }}>
                        <input
                          type="number"
                          min={0}
                          step={0.25}
                          value={s.marksPerQuestion}
                          onChange={(e) => handleUpdateSection(idx, 'marksPerQuestion', e.target.value)}
                          onBlur={handleAutoSaveSettings}
                          style={{ width: '68px', padding: '6px', textAlign: 'center', border: '1px solid #ccc', margin: '0 auto', display: 'block', borderRadius: '2px' }}
                        />
                      </td>
                      <td style={{ border: '1px solid #000', padding: '6px 10px', fontSize: '14px', textAlign: 'center' }}>
                        <input
                          type="number"
                          min={0}
                          step={0.25}
                          value={s.negativeMarks}
                          onChange={(e) => handleUpdateSection(idx, 'negativeMarks', e.target.value)}
                          onBlur={handleAutoSaveSettings}
                          style={{ width: '68px', padding: '6px', textAlign: 'center', border: '1px solid #ccc', margin: '0 auto', display: 'block', borderRadius: '2px' }}
                        />
                      </td>
                      <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(idx)}
                          disabled={isSaving}
                          title="Remove section and save"
                          style={{
                            color: '#b02a37',
                            fontWeight: 'bold',
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                            background: 'transparent',
                            border: 'none',
                            opacity: isSaving ? 0.5 : 1,
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                ))}
                {editSections.length === 0 && (
                   <tr>
                     <td colSpan={5} style={{ border: '1px solid #000', padding: '16px', textAlign: 'center', color: '#666' }}>
                       No sections defined.
                       <div style={{ marginTop: '8px' }}>
                         <label style={{ fontSize: '12px', fontWeight: 'bold', marginRight: '8px' }}>Global Marks/Q:</label>
                         <input type="number" min={0} step={0.25} value={editMarks} onChange={(e) => setEditMarks(e.target.value)} onBlur={handleAutoSaveSettings} style={{ width: '68px', padding: '6px', textAlign: 'center', border: '1px solid #ccc', marginRight: '16px', borderRadius: '2px' }} />
                         <label style={{ fontSize: '12px', fontWeight: 'bold', marginRight: '8px' }}>Global Neg/Q:</label>
                         <input type="number" min={0} step={0.25} value={editNegative} onChange={(e) => setEditNegative(e.target.value)} onBlur={handleAutoSaveSettings} style={{ width: '68px', padding: '6px', textAlign: 'center', border: '1px solid #ccc', borderRadius: '2px' }} />
                       </div>
                     </td>
                   </tr>
                )}
              </tbody>
          </table>
          <button
            type="button"
            onClick={() =>
              setEditSections([
                ...editSections,
                {
                  name: 'New Section',
                  totalQuestions: '',
                  marksPerQuestion: String(marksNum),
                  negativeMarks: String(negNum),
                },
              ])
            }
            style={{ padding: '8px 16px', background: '#eee', border: '1px solid #ccc', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', marginBottom: '32px', borderRadius: '4px' }}
          >
            + Add Section
          </button>

          {/* Rich Text Instructions Area */}
          <div style={{ marginBottom: '24px' }}>
             <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>General Instructions:</h3>
             <div style={{ background: '#fff' }}>
                <Editor 
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  onBlur={() => handleAutoSaveSettings()}
                  containerProps={{ style: { minHeight: '300px' } }}
                />
             </div>
          </div>

          {successMsg && (
            <div
              style={{
                background: '#d4edda',
                border: '1px solid #c3e6cb',
                color: '#155724',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 'bold',
                marginBottom: '16px',
              }}
            >
              {successMsg}
            </div>
          )}

          {/* Error message */}
          {errorMsg && (
            <div style={{ background: '#f8d7da', border: '1px solid #f5c6cb', color: '#721c24', padding: '10px 16px', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px' }}>
              {errorMsg}
            </div>
          )}

          {/* Agreement + Start Test equivalent */}
          <div style={{ background: '#f8f9fa', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #ddd', marginTop: '24px' }}>
             <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold', color: '#dc3545' }}>
               <input
                 type="checkbox"
                 checked={true}
                 readOnly
                 style={{ width: '16px', height: '16px', accentColor: '#e83e8c' }}
               />
               I have read, understood and agreed the instructions and disqualification rules of the exam.
             </label>
            <button
              onClick={handleProceedToBuilder}
              disabled={isSaving}
              style={{
                padding: '10px 32px',
                fontSize: '14px',
                fontWeight: 'bold',
                background: '#333',
                color: '#fff',
                border: '1px solid #000',
                cursor: 'pointer',
                borderRadius: '4px',
              }}
            >
              {isSaving ? 'Saving...' : 'Save & Build Questions ->'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===========================
  // STEP 2: Question Editor (mimics test)
  // ===========================
  return (
    <div
      style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '14px' }}
    >
      {/* Yellow Top Header */}
      <header style={{ height: '52px', flexShrink: 0, background: '#FFD700', borderBottom: '2px solid #e6c200', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: '900', fontSize: '14px', color: '#000', background: '#fff', padding: '4px 8px', border: '2px solid #000' }}>
            QUESTION BUILDER
          </span>
          <button
            onClick={() => setStep(1)}
            style={{ fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', background: '#fff', border: '1px solid #000', cursor: 'pointer' }}
          >
            ← Back to Settings
          </button>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#000' }}>{exam.title}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
           <div style={{ fontWeight: 'bold', color: '#333' }}>Duration: {exam.durationMinutes}m</div>
           <button
            onClick={() => router.push('/admin/exams')}
            style={{ fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Exit Builder
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Question Form Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #ccc', background: '#fff' }}>
          {/* Section selector + Question sub-header */}
          {hasSections && (
            <div style={{ height: '36px', flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 16px', background: '#fff8dc', borderBottom: '1px solid #e6c200' }}>
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value)}
                style={{ padding: '4px 8px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #ccc', borderRadius: '3px', background: '#fff', cursor: 'pointer' }}
              >
                <option value="all">All Sections</option>
                {sectionNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div style={{ height: '38px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
              Editing Question {activeQ}
              {currentQ ? ' (Saved)' : ' (Unsaved New)'}
            </span>
            {hasSections && (
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Section:</span>
                 <select
                  value={qSection}
                  onChange={(e) => setQSection(e.target.value)}
                  style={{ padding: '2px 6px', fontSize: '12px', border: '1px solid #ccc' }}
                >
                  <option value="">No Section</option>
                  {sectionNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
               </div>
            )}
          </div>

          {/* Question fields */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#fdfdfd' }}>
            {successMsg && (
              <div
                style={{
                  background: '#d4edda',
                  border: '1px solid #c3e6cb',
                  color: '#155724',
                  padding: '8px 12px',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div style={{ background: '#f8d7da', border: '1px solid #f5c6cb', color: '#721c24', padding: '8px 12px', fontSize: '13px', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
               <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>
                 Reading passage (optional)
               </label>
               <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px' }}>
                 Shown in the left column during the test, like Law Prep comprehension layouts. Question text below is the stem.
               </p>
               <textarea
                 value={qPassage}
                 onChange={(e) => setQPassage(e.target.value)}
                 rows={8}
                 placeholder="Long passage or directions for this item…"
                 style={{ width: '100%', padding: '12px', fontSize: '14px', lineHeight: '1.65', border: '1px dashed #ccc', outline: 'none', background: '#fff' }}
                 onFocus={(e) => { e.target.style.border = '1px solid #000'; }}
                 onBlur={(e) => { e.target.style.border = '1px dashed #ccc'; }}
               />
            </div>

            <div style={{ marginBottom: '24px' }}>
               <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>
                 Question text (stem)
               </label>
               <textarea
                 value={qText}
                 onChange={e => setQText(e.target.value)}
                 rows={5}
                 placeholder="Enter question stem here..."
                 style={{ width: '100%', padding: '12px', fontSize: '15px', lineHeight: '1.6', border: '1px dashed #ccc', outline: 'none', background: '#fff' }}
                 onFocus={e => e.target.style.border = '1px solid #000'}
                 onBlur={e => e.target.style.border = '1px dashed #ccc'}
               />
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#555' }}>
                 Answer Options (Select correct answer using radio button)
              </label>
              {['A', 'B', 'C', 'D'].map((optKey) => {
                const isCorrect = qCorrect === optKey;
                return (
                  <div key={optKey} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '8px' }}>
                      <input 
                        type="radio" 
                        name="correctAnswer" 
                        checked={isCorrect}
                        onChange={() => setQCorrect(optKey)}
                        style={{ transform: 'scale(1.2)' }}
                      />
                      <span style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '4px', color: isCorrect ? '#28a745' : '#666' }}>{optKey}</span>
                    </div>
                    <textarea
                      value={qOptions[optKey]}
                      onChange={e => setQOptions(prev => ({ ...prev, [optKey]: e.target.value }))}
                      rows={2}
                      placeholder={`Option ${optKey}`}
                      style={{ 
                        flex: 1, padding: '10px 12px', fontSize: '14px', 
                        border: isCorrect ? '2px solid #28a745' : '1px solid #ddd',
                        background: isCorrect ? '#f8fff8' : '#fff',
                        outline: 'none', borderRadius: '4px' 
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div
            style={{
              minHeight: '52px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              background: '#f0f0f0',
              borderTop: '1px solid #ccc',
              padding: '8px 16px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={handleDeleteQuestion}
              disabled={isSaving}
              style={{
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 'bold',
                background: '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '3px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              {currentQ?.id ? 'Delete' : 'Discard draft'}
            </button>
            <div style={{ flex: 1, minWidth: '8px' }} />
            <button
              type="button"
              onClick={() => handleSaveQuestion(false)}
              disabled={isSaving}
              style={{
                padding: '8px 18px',
                fontSize: '12px',
                fontWeight: 'bold',
                background: '#5cb85c',
                color: '#fff',
                border: '1px solid #4cae4c',
                borderRadius: '3px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
              }}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => handleSaveQuestion(true)}
              disabled={isSaving}
              style={{
                padding: '8px 18px',
                fontSize: '12px',
                fontWeight: 'bold',
                background: '#0f3460',
                color: '#fff',
                border: '1px solid #0a2540',
                borderRadius: '3px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
              }}
            >
              {isSaving ? 'Saving…' : 'Save & next'}
            </button>
          </div>
        </div>

        {/* Right Sidebar Palette */}
        <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#fdfdfd', borderLeft: '1px solid #ccc' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid #ddd', background: '#f8f9fa' }}>
            <button
              onClick={handleAddNewQuestion}
              style={{ width: '100%', padding: '10px', fontSize: '12px', fontWeight: 'bold', background: '#fff', color: '#0f3460', border: '2px solid #0f3460', borderRadius: '4px', cursor: 'pointer' }}
            >
              + Add New Question
            </button>
          </div>

          <div style={{ padding: '10px 12px', borderBottom: '1px solid #ddd', background: '#f6f6f6' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
              Question Palette ({questions.length})
            </div>
            <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
              Grey = Saved, Blue = Unsaved/New
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', justifyItems: 'center' }}>
              {questions
                .filter((q) => activeSection === 'all' || q.section === activeSection)
                .map((q) => (
                  <button
                    key={q.questionNumber}
                    onClick={() => jumpToQuestion(q.questionNumber)}
                    style={{
                      width: '36px', height: '36px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: 'bold',
                      background: '#ddd', color: '#333',
                      border: activeQ === q.questionNumber ? '2px solid #000' : '1px solid #bbb',
                      borderRadius: '2px', cursor: 'pointer',
                    }}
                  >
                    {q.questionNumber}
                  </button>
                ))}
              {/* Show the active unsaved question if it's new */}
              {!currentQ && (
                <button
                  style={{
                    width: '36px', height: '36px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 'bold',
                    background: '#5bc0de', color: '#fff',
                    border: '2px solid #000',
                    borderRadius: '2px', cursor: 'pointer',
                  }}
                >
                  {activeQ}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
