"use client";

import { useEffect, useRef, useState } from 'react';

const RESEND_COOLDOWN = 30;

export default function CandidateDetailsStep({
  exam,
  name,
  setName,
  phone,
  setPhone,
  errorMsg,
  onContinue,   // called only after OTP verified
}) {
  const sectionsCount = exam?.sections?.length || 0;
  const examSlug = exam?.slug || '';
  const [phase, setPhase] = useState('details'); // 'details' | 'sending' | 'otp' | 'verifying' | 'verified'
  const [otpError, setOtpError] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef([]);
  const cooldownRef = useRef(null);

  /* ── cooldown timer ── */
  useEffect(() => {
    if (cooldown <= 0) { clearInterval(cooldownRef.current); return; }
    cooldownRef.current = setInterval(() => {
      setCooldown(c => { if (c <= 1) { clearInterval(cooldownRef.current); return 0; } return c - 1; });
    }, 1000);
    return () => clearInterval(cooldownRef.current);
  }, [cooldown]);

  const maskedPhone = phone ? `+91 ${phone.slice(0, 2)}••• ••${phone.slice(-2)}` : '';

  /* ── send OTP ── */
  async function sendOTP() {
    setPhase('sending'); setOtpError('');
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        setPhase('otp'); setCooldown(RESEND_COOLDOWN);
        setTimeout(() => inputRefs.current[0]?.focus(), 120);
      } else { setPhase('details'); setOtpError(data.message || 'Failed to send OTP.'); }
    } catch { setPhase('details'); setOtpError('Network error. Please try again.'); }
  }

  /* ── resend OTP ── */
  async function resendOTP(type = 'text') {
    if (cooldown > 0) return;
    setPhase('sending'); setOtpError(''); setOtp(['', '', '', '', '', '']);
    try {
      const res = await fetch('/api/otp/resend', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, type }),
      });
      const data = await res.json();
      if (data.success) { setPhase('otp'); setCooldown(RESEND_COOLDOWN); setTimeout(() => inputRefs.current[0]?.focus(), 120); }
      else { setPhase('otp'); setOtpError(data.message); }
    } catch { setPhase('otp'); setOtpError('Network error. Please try again.'); }
  }

  /* ── verify OTP ── */
  async function verifyOTP(otpOverride) {
    const code = otpOverride || otp.join('');
    if (code.length !== 6) { setOtpError('Please enter the complete 6-digit OTP.'); triggerShake(); return; }
    setPhase('verifying'); setOtpError('');
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: code, examSlug }),
      });
      const data = await res.json();
      if (data.success) { setPhase('verified'); setTimeout(() => onContinue(), 600); }
      else {
        setPhase('otp'); setOtpError(data.message || 'Incorrect OTP. Try again.');
        setOtp(['', '', '', '', '', '']); triggerShake();
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch { setPhase('otp'); setOtpError('Network error. Please try again.'); }
  }

  function triggerShake() { setShake(true); setTimeout(() => setShake(false), 600); }

  function handleOtpInput(index, value) {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp]; next[index] = value; setOtp(next);
    setOtpError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (value && index === 5 && next.every(d => d !== '')) setTimeout(() => verifyOTP(next.join('')), 80);
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'Enter') verifyOTP();
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', '']; pasted.split('').forEach((d, i) => { if (i < 6) next[i] = d; });
    setOtp(next);
    const fi = next.findIndex(d => d === ''); inputRefs.current[fi === -1 ? 5 : fi]?.focus();
    if (pasted.length === 6) setTimeout(() => verifyOTP(pasted), 80);
  }

  /* ── "Continue" button on step-1 ── */
  function handleContinueClick() {
    if (!name.trim() || !phone.trim()) { setOtpError('Please provide both name and phone number.'); return; }
    if (phone.replace(/\D/g, '').length !== 10) { setOtpError('Phone number must be exactly 10 digits.'); return; }
    setOtpError('');
    sendOTP();
  }

  const isSending   = phase === 'sending';
  const isVerifying = phase === 'verifying';
  const isVerified  = phase === 'verified';
  const inOTPMode   = phase === 'otp' || phase === 'verifying' || phase === 'verified' || phase === 'sending';
  const otpFilled   = otp.every(d => d !== '');

  const inputBase = { width: '100%', height: '42px', padding: '0 12px', border: '1px solid #c7cdd4', fontSize: '14px', background: '#fff', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '100vh', background: '#f6f7fb', fontFamily: 'Arial, Helvetica, sans-serif', color: '#333' }}>
      {/* Yellow exam title bar */}
      <div style={{ background: '#FFD700', padding: '12px 0', borderBottom: '3px solid #e6c200' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', margin: 0 }}>{exam.title}</h1>
        </div>
      </div>

      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '24px 18px' }}>

        {/* Section header bar */}
        <div style={{ marginBottom: '16px', border: '1px solid #e5e7eb', background: '#fff', padding: '14px 16px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
            {inOTPMode ? 'Mobile Verification' : 'Candidate Authentication'}
          </div>
          <div style={{ marginTop: '6px', fontSize: '13px', color: '#6b7280', lineHeight: 1.55 }}>
            {inOTPMode
              ? <>A 6-digit OTP has been sent to <strong style={{ color: '#111827' }}>{maskedPhone}</strong>. Enter it below to verify your identity.</>
              : 'Enter your details as per registration record. These details are used for attempt verification and result mapping.'
            }
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>

          {/* LEFT CARD — switches between details & OTP */}
          <div style={{ border: '1px solid #d1d5db', background: '#fff' }}>
            <div style={{ background: '#f3f4f6', padding: '10px 16px', borderBottom: '1px solid #d1d5db', fontWeight: 'bold', fontSize: '14px' }}>
              {inOTPMode ? 'Enter OTP' : 'Candidate Information'}
            </div>

            {/* ── DETAILS PHASE ── */}
            {!inOTPMode && (
              <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Full Name *
                  </label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)}
                    placeholder="Enter your full name" style={inputBase} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Phone Number *
                  </label>
                  <input type="tel" required inputMode="numeric" maxLength={10} value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10 digit phone number" style={inputBase} />
                </div>
              </div>
            )}

            {/* ── OTP PHASE ── */}
            {inOTPMode && (
              <div style={{ padding: '20px 16px' }}>
                {/* Candidate pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', padding: '10px 12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>{name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{name}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' }}>{maskedPhone}</div>
                  </div>
                  {isVerified
                    ? <span style={{ fontSize: '10px', fontWeight: 700, color: '#155724', background: '#d4edda', border: '1px solid #a3d9b1', padding: '3px 10px' }}>✓ Verified</span>
                    : <span style={{ fontSize: '10px', fontWeight: 700, color: '#856404', background: '#fff3cd', border: '1px solid #ffc107', padding: '3px 10px' }}>OTP Sent</span>
                  }
                </div>

                {/* OTP label */}
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  6-Digit Verification Code
                </label>

                {/* OTP boxes */}
                <div
                  style={{ display: 'flex', gap: '10px', marginBottom: '16px', ...(shake ? { animation: 'shake 0.5s ease' } : {}) }}
                >
                  <style>{`
                    @keyframes shake {
                      0%,100%{transform:translateX(0)} 20%{transform:translateX(-7px)} 40%{transform:translateX(7px)}
                      60%{transform:translateX(-5px)} 80%{transform:translateX(5px)}
                    }
                    .otp-box:focus { border-color: #1a1a2e !important; background: #f0f4ff !important; outline: none; box-shadow: 0 0 0 3px rgba(26,26,46,0.08); }
                  `}</style>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => inputRefs.current[idx] = el}
                      className="otp-box"
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleOtpInput(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      onPaste={idx === 0 ? handlePaste : undefined}
                      disabled={isVerifying || isSending || isVerified}
                      style={{
                        width: '48px', height: '52px', textAlign: 'center',
                        fontSize: '22px', fontWeight: 800, fontFamily: 'monospace',
                        border: `2px solid ${otpError ? '#e94560' : digit ? '#1a1a2e' : '#d1d5db'}`,
                        background: isVerified ? '#d4edda' : digit ? '#f0f4ff' : '#fafafa',
                        color: otpError ? '#e94560' : isVerified ? '#155724' : '#1a1a2e',
                        borderRadius: '4px', transition: 'all 0.15s',
                        cursor: isVerifying || isSending || isVerified ? 'not-allowed' : 'text',
                        opacity: isSending && !isVerified ? 0.5 : 1,
                      }}
                    />
                  ))}
                </div>

                {/* OTP Error */}
                {otpError && (
                  <div style={{ marginBottom: '12px', padding: '9px 12px', background: '#f8d7da', border: '1px solid #f5c6cb', color: '#721c24', fontSize: '12px', fontWeight: 600 }}>
                    {otpError}
                  </div>
                )}

                {/* Resend row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {cooldown > 0
                      ? <>Resend in <strong style={{ color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{cooldown}s</strong></>
                      : "Didn't receive it?"
                    }
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[['text', 'Resend SMS'], ['voice', 'Call Me']].map(([type, label]) => (
                      <button key={type} onClick={() => resendOTP(type)}
                        disabled={cooldown > 0 || isSending || isVerified}
                        style={{ padding: '5px 12px', fontSize: '11px', fontWeight: 700, border: `1px solid ${cooldown > 0 || isSending ? '#e5e7eb' : '#d1d5db'}`, background: '#fff', color: cooldown > 0 || isSending ? '#9ca3af' : '#374151', cursor: cooldown > 0 || isSending || isVerified ? 'not-allowed' : 'pointer', borderRadius: '2px' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Security note */}
                <div style={{ marginTop: '16px', borderTop: '1px solid #f0f2f8', paddingTop: '12px', fontSize: '11px', color: '#9ca3af', lineHeight: 1.6 }}>
                  🔒 This OTP is valid for {process.env.NEXT_PUBLIC_OTP_EXPIRY || '10'} minutes. Do not share it with anyone.
                </div>
              </div>
            )}
          </div>

          {/* RIGHT CARD — Exam Snapshot (always visible) */}
          <div style={{ border: '1px solid #d1d5db', background: '#fff', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: '#f3f4f6', padding: '10px 14px', borderBottom: '1px solid #d1d5db', fontWeight: 'bold', fontSize: '13px' }}>
              Exam Snapshot
            </div>
            <div style={{ padding: '12px 14px', display: 'grid', rowGap: '10px', fontSize: '13px' }}>
              {[
                ['Duration', `${exam.durationMinutes} min`],
                ['Questions', exam.totalQuestionsOverride ?? '--'],
                ['Sections', sectionsCount],
                ['Negative Marking', exam.negativeMarks ?? 0],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ color: '#6b7280' }}>{label}</span>
                  <span style={{ fontWeight: 700 }}>{val}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 'auto', padding: '12px 14px', borderTop: '1px solid #e5e7eb', fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>
              {inOTPMode
                ? 'Do not close or refresh this page during verification.'
                : 'Keep your ID and registered phone nearby for verification in case of support checks.'
              }
            </div>
          </div>
        </div>

        {/* Error message (details phase) */}
        {(errorMsg || (!inOTPMode && otpError)) && (
          <div style={{ marginTop: '14px', background: '#f8d7da', border: '1px solid #f5c6cb', color: '#721c24', padding: '10px 16px', fontSize: '13px', fontWeight: 'bold' }}>
            {errorMsg || otpError}
          </div>
        )}

        {/* Footer bar */}
        <div style={{ marginTop: '14px', background: '#fff', border: '1px solid #d1d5db', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#374151', fontSize: '13px' }}>
            <span style={{ background: '#d4edda', border: '1px solid #28a745', color: '#155724', fontWeight: 700, padding: '4px 8px' }}>
              Step 1 of 4
            </span>
            <span>
              {inOTPMode ? 'Verify your mobile number to continue' : 'Enter your details — OTP will be sent for verification'}
            </span>
          </div>

          {/* Action button */}
          {!inOTPMode && (
            <button
              onClick={handleContinueClick}
              style={{ padding: '11px 28px', fontSize: '14px', fontWeight: 'bold', background: '#222', color: '#fff', border: '1px solid #111', cursor: 'pointer', borderRadius: '2px', letterSpacing: '0.2px' }}
            >
              {isSending ? 'Sending OTP…' : 'Continue to Instructions'}
            </button>
          )}

          {inOTPMode && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* Back button */}
              {!isVerified && (
                <button
                  onClick={() => { setPhase('details'); setOtp(['', '', '', '', '', '']); setOtpError(''); }}
                  disabled={isVerifying || isSending}
                  style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 700, background: '#fff', color: '#374151', border: '1px solid #d1d5db', cursor: isVerifying || isSending ? 'not-allowed' : 'pointer', borderRadius: '2px' }}
                >
                  ← Back
                </button>
              )}
              {/* Verify button */}
              <button
                onClick={() => verifyOTP()}
                disabled={!otpFilled || isVerifying || isSending || isVerified}
                style={{
                  padding: '11px 28px', fontSize: '14px', fontWeight: 'bold',
                  background: isVerified ? '#27ae60' : otpFilled && !isVerifying && !isSending ? '#222' : '#9ca3af',
                  color: '#fff', border: 'none', cursor: !otpFilled || isVerifying || isSending || isVerified ? 'not-allowed' : 'pointer', borderRadius: '2px', letterSpacing: '0.2px',
                }}
              >
                {isVerified ? '✓ Verified!' : isVerifying ? 'Verifying…' : 'Verify & Proceed →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
