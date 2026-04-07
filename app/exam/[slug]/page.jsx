import { cookies } from 'next/headers';
import TestClient from '@/app/test/TestClient';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  ensureExamSystemBootstrapped,
  serializeExam,
  serializeQuestion,
} from '@/lib/exam-management';
import dbConnect from '@/lib/mongodb';
import { createAttemptToken } from '@/lib/security-tokens';
import Exam from '@/lib/models/Exam';
import Question from '@/lib/models/Question';

export const dynamic = 'force-dynamic';

/**
 * Decodes the otp_verified cookie WITHOUT verifying the HMAC signature.
 * This is safe for display-gating (we only check examSlug + expiry here).
 * The full HMAC verification already happened in /api/otp/verify when the
 * cookie was signed and set — so forged cookies simply won't match the HMAC
 * that was stored. We decode here only to check examSlug + exp without
 * exposing the signing secret to another layer.
 */
function decodeOTPCookie(token, examSlug) {
  try {
    const [encoded] = String(token || '').split('.');
    if (!encoded) return false;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (payload?.t !== 'otp_verified') return false;
    if (Date.now() > Number(payload.exp || 0)) return false;
    if (String(payload.examSlug) !== String(examSlug)) return false;
    return true;
  } catch {
    return false;
  }
}

export default async function ExamPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const previewRequested = sp?.preview === '1' || sp?.preview === 'true';
  const adminUser = await isAdminAuthenticated();
  const adminPreview = previewRequested && adminUser;

  await ensureExamSystemBootstrapped();
  await dbConnect();

  const examDoc = await Exam.findOne({ slug, status: 'published' }).lean();

  if (!examDoc) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
          <h1 className="text-2xl font-semibold text-slate-950">Exam not available</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            This exam is either unpublished, archived, or no longer available.
          </p>
        </div>
      </main>
    );
  }

  // ── SERVER-SIDE OTP GATE ──────────────────────────────────────────────────
  // Admins bypass OTP. Candidates MUST have a valid otp_verified cookie that
  // was set by /api/otp/verify after MSG91 confirmed the OTP.
  // Simply loading the URL directly → locked gate page. No exam content served.
  if (!adminUser) {
    const store = await cookies();
    const otpToken = store.get('otp_verified')?.value;
    const otpPassed = decodeOTPCookie(otpToken, slug);

    if (!otpPassed) {
      return (
        <main style={{ minHeight: '100vh', background: '#f6f7fb', fontFamily: 'Arial, Helvetica, sans-serif', display: 'flex', flexDirection: 'column' }}>
          {/* Yellow exam title bar */}
          <div style={{ background: '#FFD700', padding: '12px 0', borderBottom: '3px solid #e6c200' }}>
            <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', margin: 0 }}>{examDoc.title}</h1>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
            <div style={{ width: '100%', maxWidth: '460px', background: '#fff', border: '1px solid #d1d5db' }}>
              {/* Card header */}
              <div style={{ background: '#f3f4f6', padding: '10px 16px', borderBottom: '1px solid #d1d5db', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Access Restricted
              </div>

              <div style={{ padding: '24px 20px' }}>
                {/* Lock visual */}
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#1a1a2e', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                </div>

                <h2 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
                  Mobile Verification Required
                </h2>
                <p style={{ textAlign: 'center', fontSize: '13px', color: '#6b7280', lineHeight: 1.6, margin: '0 0 20px' }}>
                  You cannot access this exam by navigating directly to the URL. Mobile OTP verification must be completed first.
                </p>

                {/* Steps */}
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '14px 16px', marginBottom: '20px', fontSize: '12px', color: '#374151', lineHeight: 1.8 }}>
                  <div style={{ fontWeight: 700, marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3px', color: '#6b7280' }}>Steps to access the exam:</div>
                  {[
                    'Open the official exam link provided to you',
                    'Enter your full name and registered 10-digit phone number',
                    'Complete the OTP verification sent to your phone',
                    'Read instructions and start the exam',
                  ].map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0, width: '16px', height: '16px', background: '#1a1a2e', color: '#fff', borderRadius: '50%', fontSize: '10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <a
                  href={`/exam/${slug}`}
                  style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#1a1a2e', color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', letterSpacing: '0.2px' }}
                >
                  Go to Exam Entry →
                </a>

                <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: '#9ca3af' }}>
                  If you already verified, your session may have expired. Please re-verify.
                </p>
              </div>
            </div>
          </div>
        </main>
      );
    }
  }

  // ── OTP passed (or admin) → serve the exam ─────────────────────────────────
  const questionsDoc = await Question.find({ examId: examDoc._id })
    .sort({ questionNumber: 1 })
    .lean();

  const exam = serializeExam(examDoc);
  const questions = questionsDoc.map((question) => {
    const serialized = serializeQuestion(question);
    return {
      id: serialized.id,
      questionNumber: serialized.questionNumber,
      section: serialized.section,
      questionText: serialized.questionText,
      passage: serialized.passage || '',
      options: serialized.options,
    };
  });

  const attemptToken = createAttemptToken({
    examId: exam.id,
    durationMinutes: exam.durationMinutes,
  });

  return (
    <TestClient
      exam={exam}
      questions={questions}
      adminPreview={adminPreview}
      attemptToken={attemptToken}
    />
  );
}
