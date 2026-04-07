import Link from 'next/link';
import {
  createQuestionAction, deleteQuestionAction, updateQuestionAction,
} from '@/app/admin/actions';
import { getExamDetail } from '@/lib/dashboard-data';

export const dynamic = 'force-dynamic';

export default async function ExamBuilderPage({ params, searchParams }) {
  const { examId } = await params;
  const sParams = await searchParams;
  const activeQuestionId = sParams?.q || 'new';

  const detail = await getExamDetail(examId);
  if (!detail) return <div className="py-16 text-center"><h1 className="text-lg font-extrabold" style={{ color: '#1a1a2e' }}>Exam Not Found</h1></div>;

  const { exam, questions } = detail;
  const nextNum = questions.length + 1;
  const activeQ = questions.find((q) => q.id === activeQuestionId);
  const editing = !!activeQ;

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col overflow-hidden -mx-6 -my-6">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-2.5 shrink-0"
        style={{ background: 'linear-gradient(90deg, #1a1a2e, #16213e)', borderBottom: '3px solid #e94560' }}>
        <div className="flex items-center gap-3 text-[12px]">
          <Link href={`/admin/exams/${exam.id}`} className="flex items-center gap-1 font-bold transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            SETTINGS
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span className="font-bold text-white tracking-wide">{exam.title.toUpperCase()}</span>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
          <span className="font-extrabold" style={{ color: '#e94560' }}>{questions.length} QUESTIONS</span>
        </div>
      </div>

      {/* Split pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Palette */}
        <div className="w-[280px] flex flex-col shrink-0" style={{ background: '#f4f6f9', borderRight: '2px solid #dfe6e9' }}>
          <div className="p-3" style={{ background: '#f0f3f8', borderBottom: '1px solid #dfe6e9' }}>
            <p className="text-[9px] font-extrabold uppercase tracking-widest mb-2" style={{ color: '#636e72' }}>Question Palette</p>
            <Link href={`/admin/exams/${exam.id}/builder?q=new`}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all rounded-sm text-white"
              style={!editing
                ? { background: 'linear-gradient(135deg, #0f3460, #1a5276)', boxShadow: '0 2px 8px rgba(15,52,96,0.3)' }
                : { background: 'white', color: '#0f3460', border: '2px solid #0f3460' }
              }>
              + Add Question
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {questions.length === 0 ? (
              <p className="text-center p-8 text-[12px] font-medium" style={{ color: '#b2bec3' }}>No questions yet</p>
            ) : (
              questions.map((q) => {
                const isActive = activeQuestionId === q.id;
                return (
                  <Link href={`/admin/exams/${exam.id}/builder?q=${q.id}`} key={q.id}
                    className="block px-3 py-2.5 text-[12px] transition-all"
                    style={isActive
                      ? { background: '#e8f4fd', border: '2px solid #0f3460', boxShadow: '0 1px 3px rgba(15,52,96,0.15)' }
                      : { background: '#ffffff', border: '2px solid #dfe6e9' }
                    }>
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold" style={{ color: isActive ? '#0f3460' : '#2d3436' }}>Q.{q.questionNumber}</span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm"
                        style={isActive
                          ? { background: '#0f3460', color: '#ffffff' }
                          : { background: '#f0f3f8', color: '#0f3460' }
                        }>{q.correctAnswer}</span>
                    </div>
                    <div className="text-[11px] truncate mt-1" style={{ color: '#b2bec3' }}>{q.questionText}</div>
                  </Link>
                );
              })
            )}
          </div>

          <div className="px-4 py-3 flex justify-between text-[10px] font-extrabold"
            style={{ background: '#f0f3f8', borderTop: '1px solid #dfe6e9', color: '#636e72' }}>
            <span>Total: <span style={{ color: '#1a1a2e' }}>{questions.length}</span></span>
            <span>Duration: <span style={{ color: '#1a1a2e' }}>{exam.durationMinutes}m</span></span>
          </div>
        </div>

        {/* Right — Editor */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <form action={editing ? updateQuestionAction : createQuestionAction} className="max-w-2xl">
            <div className="flex items-center justify-between mb-5 pb-3" style={{ borderBottom: '2px solid #0f3460' }}>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 flex items-center justify-center text-[11px] font-extrabold text-white rounded-sm"
                  style={{ background: 'linear-gradient(90deg, #1a1a2e, #16213e)' }}>
                  {editing ? activeQ.questionNumber : '+'}
                </div>
                <h2 className="text-[15px] font-extrabold" style={{ color: '#1a1a2e' }}>
                  {editing ? `Edit Question ${activeQ.questionNumber}` : 'New Question'}
                </h2>
              </div>
              {editing && (
                <button formAction={deleteQuestionAction}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm text-[10px] font-extrabold uppercase tracking-wider text-white"
                  style={{ background: 'linear-gradient(135deg, #e94560, #c0392b)' }}>
                  Delete
                </button>
              )}
            </div>

            <input type="hidden" name="examId" value={exam.id} />
            {editing && <input type="hidden" name="questionId" value={activeQ.id} />}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: '#636e72' }}>Question # *</label>
                  <input type="number" name="questionNumber" min="1" defaultValue={editing ? activeQ.questionNumber : nextNum} required
                    className="w-full rounded-sm px-3 py-2.5 text-[13px] font-bold outline-none"
                    style={{ background: '#f8f9fa', border: '2px solid #dfe6e9', color: '#2d3436' }} />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: '#636e72' }}>Correct Answer *</label>
                  <select name="correctAnswer" defaultValue={editing ? activeQ.correctAnswer : 'A'}
                    className="w-full rounded-sm px-3 py-2.5 text-[13px] font-extrabold outline-none"
                    style={{ background: '#f8f9fa', border: '2px solid #dfe6e9', color: '#2d3436' }}>
                    <option value="A">Option A</option><option value="B">Option B</option>
                    <option value="C">Option C</option><option value="D">Option D</option>
                  </select>
                </div>
              </div>

              {exam.sections?.length > 0 && (
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: '#636e72' }}>Section</label>
                  <select
                    name="section"
                    defaultValue={editing ? (activeQ.section || '') : ''}
                    className="w-full rounded-sm px-3 py-2.5 text-[13px] font-bold outline-none"
                    style={{ background: '#f8f9fa', border: '2px solid #dfe6e9', color: '#2d3436' }}
                  >
                    <option value="">— None —</option>
                    {exam.sections.map((s) => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: '#636e72' }}>Reading passage (optional)</label>
                <textarea name="passage" rows="5" placeholder="Long passage for the left panel during the test…" defaultValue={editing ? (activeQ.passage || '') : ''}
                  className="w-full rounded-sm px-3 py-2.5 text-[13px] leading-relaxed outline-none resize-none"
                  style={{ background: '#f8f9fa', border: '2px solid #dfe6e9', color: '#2d3436' }} />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: '#636e72' }}>Question Text *</label>
                <textarea name="questionText" rows="4" placeholder="Type question stem..." defaultValue={editing ? activeQ.questionText : ''} required
                  className="w-full rounded-sm px-3 py-2.5 text-[13px] leading-relaxed outline-none resize-none"
                  style={{ background: '#f8f9fa', border: '2px solid #dfe6e9', color: '#2d3436' }} />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: '#636e72' }}>Answer Options</label>
                <div className="space-y-2">
                  {['A', 'B', 'C', 'D'].map((key) => {
                    const correct = editing ? activeQ.correctAnswer === key : key === 'A';
                    return (
                      <div key={key} className="flex items-start gap-2">
                        <span className="shrink-0 w-8 h-[42px] flex items-center justify-center text-[12px] font-extrabold"
                          style={correct
                            ? { background: '#d4edda', color: '#155724', border: '2px solid #a3d9b1' }
                            : { background: '#f0f3f8', color: '#636e72', border: '2px solid #dfe6e9' }
                          }>{key}</span>
                        <textarea name={`option${key}`} rows="1" placeholder={`Option ${key}`}
                          defaultValue={editing ? activeQ.options[key] : ''} required
                          className="w-full rounded-sm px-3 py-2.5 text-[13px] outline-none resize-none"
                          style={correct
                            ? { background: '#f0fff4', border: '2px solid #a3d9b1', color: '#2d3436' }
                            : { background: '#f8f9fa', border: '2px solid #dfe6e9', color: '#2d3436' }
                          } />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-3" style={{ borderTop: '2px solid #dfe6e9' }}>
                <button type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-[12px] font-bold text-white tracking-wide uppercase rounded-sm"
                  style={{ background: 'linear-gradient(135deg, #0f3460, #1a5276)', boxShadow: '0 2px 8px rgba(15,52,96,0.3)' }}>
                  {editing ? 'Save Changes' : 'Add Question'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
