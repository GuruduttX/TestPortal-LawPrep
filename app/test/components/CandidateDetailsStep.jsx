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
  const isOTPEnabled = process.env.NEXT_PUBLIC_OTP_ENABLED === 'true';
  const sectionsCount = exam?.sections?.length || 0;
  const examSlug = exam?.slug || '';
  const [phase, setPhase] = useState('details'); // 'details' | 'sending' | 'otp' | 'verifying' | 'verified'
  const [otpError, setOtpError] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef([]);
  const cooldownRef = useRef(null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    
    if (isOTPEnabled) {
      sendOTP();
    } else {
      onContinue(); 
    }
  }

  const isSending   = phase === 'sending';
  const isVerifying = phase === 'verifying';
  const isVerified  = phase === 'verified';
  const inOTPMode   = isOTPEnabled && (phase === 'otp' || phase === 'verifying' || phase === 'verified' || phase === 'sending');
  const otpFilled   = otp.every(d => d !== '');

  const inputBase = { width: '100%', height: '42px', padding: '0 12px', border: '1px solid #c7cdd4', fontSize: '14px', background: '#fff', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '100vh', background: '#f6f7fb', fontFamily: 'Arial, Helvetica, sans-serif', color: '#333' }}>
      {/* Yellow exam title bar */}
      <div style={{ background: '#FFD700', padding: isMobile ? '8px 0' : '12px 0', borderBottom: '3px solid #e6c200' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <img src="/logo.png" alt="Logo" style={{ height: isMobile ? '30px' : '40px', width: 'auto', objectFit: 'contain', background: '#fff', padding: '2px', borderRadius: '4px' }} />
          <h1 style={{ fontSize: isMobile ? '15px' : '18px', fontWeight: 'bold', color: '#000', margin: 0 }}>{exam.title}</h1>
        </div>
      </div>

      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: isMobile ? '12px 12px' : '24px 18px' }}>

        {/* Section header bar */}
        <div style={{ marginBottom: '16px', border: '1px solid #e5e7eb', background: '#fff', padding: '14px 16px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
            Candidate Authentication
          </div>
          <div style={{ marginTop: '6px', fontSize: '13px', color: '#6b7280', lineHeight: 1.55 }}>
            Enter your details to proceed with the assessment. (OTP Verification temporarily disabled for integration testing)
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '16px' }}>

          {/* LEFT CARD — switches between details & OTP */}
          <div style={{ border: '1px solid #d1d5db', background: '#fff' }}>
            <div style={{ background: '#f3f4f6', padding: '10px 16px', borderBottom: '1px solid #d1d5db', fontWeight: 'bold', fontSize: '14px' }}>
              Candidate Information
            </div>

            {/* ── DETAILS PHASE ── */}
            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
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
                  placeholder="Enter 10 digit phone" style={inputBase} />
              </div>
            </div>
          </div>

          {/* RIGHT CARD — Exam Snapshot (always visible) */}
          <div style={{ border: '1px solid #d1d5db', background: '#fff' }}>
            <div style={{ background: '#f3f4f6', padding: '10px 14px', borderBottom: '1px solid #d1d5db', fontWeight: 'bold', fontSize: '13px' }}>
              Exam Snapshot
            </div>
            <div style={{ padding: '12px 14px', display: 'grid', rowGap: '10px', fontSize: '13px' }}>
              {[
                ['Duration', `${exam.durationMinutes} min`],
                ['Questions', exam.totalQuestionsOverride ?? '--'],
                ['Sections', sectionsCount],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ color: '#6b7280' }}>{label}</span>
                  <span style={{ fontWeight: 700 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action / Navigation Footer */}
        <div style={{ marginTop: '16px', background: '#fff', border: '1px solid #d1d5db', padding: '14px 16px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#374151', fontSize: '12px' }}>
            <span style={{ background: '#d4edda', border: '1px solid #28a745', color: '#155724', fontWeight: 700, padding: '3px 8px' }}>
              Step 1 of 4
            </span>
            <span>{isOTPEnabled ? 'Authentication via OTP' : 'Registration details'}</span>
          </div>

          {/* Action buttons */}
          {!inOTPMode && (
            <button
              onClick={handleContinueClick}
              style={{ padding: '12px 32px', fontSize: '14px', fontWeight: 'bold', background: '#222', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '2px' }}
            >
              {isSending ? 'Sending...' : isOTPEnabled ? 'Verify & Continue →' : 'Continue to Exam →'}
            </button>
          )}

          {inOTPMode && (
            <div style={{ display: 'flex', gap: '10px' }}>
              {!isVerified && (
                <button
                  onClick={() => { setPhase('details'); setOtp(['', '', '', '', '', '']); setOtpError(''); }}
                  disabled={isVerifying || isSending}
                  style={{ flex: 1, padding: '10px 16px', fontSize: '13px', fontWeight: 700, background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '2px' }}
                >
                  ← Back
                </button>
              )}
              <button
                onClick={() => verifyOTP()}
                disabled={!otpFilled || isVerifying || isSending || isVerified}
                style={{
                  flex: isMobile ? 2 : 'none', padding: '12px 32px', fontSize: '14px', fontWeight: 'bold',
                  background: isVerified ? '#27ae60' : otpFilled && !isVerifying && !isSending ? '#222' : '#9ca3af',
                  color: '#fff', border: 'none', borderRadius: '2px',
                }}
              >
                {isVerified ? '✓' : isVerifying ? '...' : 'Verify →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
