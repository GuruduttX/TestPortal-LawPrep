"use client";

import { useEffect, useRef, useState } from 'react';

const RESEND_COOLDOWN = 30;

export default function OTPVerificationStep({ exam, phone, name, onVerified, onBack }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);
  const cooldownRef = useRef(null);
  const [shake, setShake] = useState(false);

  useEffect(() => { sendOTP(); }, []); // eslint-disable-line

  useEffect(() => {
    if (cooldown <= 0) { clearInterval(cooldownRef.current); return; }
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => { if (c <= 1) { clearInterval(cooldownRef.current); return 0; } return c - 1; });
    }, 1000);
    return () => clearInterval(cooldownRef.current);
  }, [cooldown]);

  async function sendOTP() {
    setStatus('sending'); setMessage('');
    try {
      const res = await fetch('/api/otp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
      const data = await res.json();
      if (data.success) {
        setStatus('idle'); setCooldown(RESEND_COOLDOWN);
        setTimeout(() => inputRefs.current[0]?.focus(), 150);
      } else { setStatus('error'); setMessage(data.message || 'Failed to send OTP.'); }
    } catch { setStatus('error'); setMessage('Network error. Please check your connection.'); }
  }

  async function resendOTP(type = 'text') {
    if (cooldown > 0) return;
    setStatus('sending'); setMessage(''); setOtp(['', '', '', '', '', '']);
    try {
      const res = await fetch('/api/otp/resend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, type }) });
      const data = await res.json();
      if (data.success) { setStatus('idle'); setCooldown(RESEND_COOLDOWN); setTimeout(() => inputRefs.current[0]?.focus(), 150); }
      else { setStatus('error'); setMessage(data.message); }
    } catch { setStatus('error'); setMessage('Network error. Please try again.'); }
  }

  async function verifyOTP(otpOverride) {
    const otpString = otpOverride || otp.join('');
    if (otpString.length !== 6) { setStatus('error'); setMessage('Please enter the complete 6-digit OTP.'); triggerShake(); return; }
    setStatus('verifying'); setMessage('');
    try {
      const res = await fetch('/api/otp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, otp: otpString }) });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setTimeout(() => onVerified(), 900);
      } else {
        setStatus('error'); setMessage(data.message || 'Incorrect OTP. Please try again.');
        setOtp(['', '', '', '', '', '']); triggerShake();
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch { setStatus('error'); setMessage('Network error. Please try again.'); }
  }

  function triggerShake() { setShake(true); setTimeout(() => setShake(false), 600); }

  function handleInputChange(index, value) {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp]; newOtp[index] = value; setOtp(newOtp);
    setMessage(''); if (status === 'error') setStatus('idle');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (value && index === 5 && newOtp.every(d => d !== '')) {
      setTimeout(() => verifyOTP(newOtp.join('')), 100);
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'Enter') verifyOTP();
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newOtp = ['', '', '', '', '', ''];
    pasted.split('').forEach((d, i) => { if (i < 6) newOtp[i] = d; });
    setOtp(newOtp);
    const nextEmpty = newOtp.findIndex(d => d === '');
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
    if (pasted.length === 6) setTimeout(() => verifyOTP(pasted), 100);
  }

  const isVerifying = status === 'verifying';
  const isSending = status === 'sending';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const otpFilled = otp.every(d => d !== '');
  const maskedPhone = `+91 ${phone.slice(0, 2)}••• ••${phone.slice(-2)}`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @keyframes otpShake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        @keyframes successPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes checkDraw {
          from { stroke-dashoffset: 50; }
          to { stroke-dashoffset: 0; }
        }
        .otp-page { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .otp-input:focus { border-color: #1a1a2e !important; background: #f0f4ff !important; box-shadow: 0 0 0 3px rgba(26,26,46,0.08) !important; outline: none; }
        .otp-shake { animation: otpShake 0.6s ease; }
        .fade-up { animation: fadeSlideUp 0.4s ease; }
        .otp-success-pulse { animation: successPulse 0.5s ease; }
      `}</style>

      <div className="otp-page" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f2f8 0%, #e8ecf4 100%)', display: 'flex', flexDirection: 'column' }}>

        {/* Institutional Top Bar */}
        <div style={{ background: '#1a1a2e', borderBottom: '3px solid #e94560', padding: '0' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Shield icon */}
              <div style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #e94560, #c0392b)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em', lineHeight: 1.2 }}>
                  {process.env.NEXT_PUBLIC_APP_NAME || 'EXAM PORTAL'}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Secure Examination System
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#27ae60', boxShadow: '0 0 6px #27ae60' }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Secure Connection Active</span>
            </div>
          </div>
        </div>

        {/* Exam title strip */}
        <div style={{ background: '#FFD700', borderBottom: '2px solid #e6c200', padding: '9px 24px', textAlign: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#000', letterSpacing: '0.01em' }}>{exam.title}</span>
        </div>

        {/* Centered Card */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
          <div className="fade-up" style={{ width: '100%', maxWidth: '460px' }}>

            {/* Main verification card */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(26,26,46,0.12), 0 4px 16px rgba(26,26,46,0.06)',
              overflow: 'hidden',
              border: '1px solid rgba(26,26,46,0.06)',
            }}>
              {/* Card header */}
              <div style={{ padding: '32px 32px 24px', textAlign: 'center', background: 'linear-gradient(180deg, #fafbff 0%, #ffffff 100%)', borderBottom: '1px solid #f0f2f8' }}>
                {/* Icon circle */}
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px',
                  background: isSuccess ? 'linear-gradient(135deg, #27ae60, #1e8449)' : isError ? 'linear-gradient(135deg, #e94560, #c0392b)' : 'linear-gradient(135deg, #1a1a2e, #0f3460)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.4s ease',
                  boxShadow: isSuccess ? '0 8px 24px rgba(39,174,96,0.35)' : isError ? '0 8px 24px rgba(233,69,96,0.35)' : '0 8px 24px rgba(26,26,46,0.25)',
                }}>
                  {isSuccess ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 50, strokeDashoffset: 0, animation: 'checkDraw 0.4s ease' }}/>
                    </svg>
                  ) : isSending || isVerifying ? (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10"/>
                    </svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                      <line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                  )}
                </div>

                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.01em' }}>
                  {isSuccess ? 'Verified Successfully' : 'Mobile Verification'}
                </h1>
                <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>
                  {isSuccess
                    ? `Welcome, ${name}. Proceeding to exam instructions…`
                    : isSending
                    ? 'Sending OTP to your registered number…'
                    : <>A 6-digit code has been sent to <strong style={{ color: '#1a1a2e' }}>{maskedPhone}</strong></>
                  }
                </p>
              </div>

              {/* OTP input area */}
              {!isSuccess && (
                <div style={{ padding: '28px 32px' }}>
                  {/* Candidate info pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '10px 14px', background: '#f8faff', border: '1px solid #e8edf8', borderRadius: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>{name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2 }}>{name}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace', lineHeight: 1.2 }}>{maskedPhone}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 700, color: '#27ae60', background: '#d4edda', padding: '3px 8px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                      OTP Sent
                    </div>
                  </div>

                  {/* OTP boxes */}
                  <div
                    className={shake ? 'otp-shake' : ''}
                    style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '16px' }}
                  >
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={el => inputRefs.current[index] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleInputChange(index, e.target.value)}
                        onKeyDown={e => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        disabled={isVerifying || isSending}
                        className="otp-input"
                        style={{
                          width: '52px',
                          height: '60px',
                          textAlign: 'center',
                          fontSize: '24px',
                          fontWeight: 800,
                          fontFamily: 'Inter, monospace',
                          border: `2px solid ${isError ? '#e94560' : digit ? '#1a1a2e' : '#d1d5db'}`,
                          borderRadius: '10px',
                          background: isError && digit ? '#fff5f6' : digit ? '#f0f4ff' : '#fafafa',
                          color: isError ? '#e94560' : '#1a1a2e',
                          transition: 'all 0.15s ease',
                          cursor: isVerifying || isSending ? 'not-allowed' : 'text',
                          opacity: isVerifying || isSending ? 0.6 : 1,
                        }}
                      />
                    ))}
                  </div>

                  {/* Error message */}
                  {isError && message && (
                    <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#fff5f6', border: '1px solid #fdd', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e94560" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#c0392b' }}>{message}</span>
                    </div>
                  )}

                  {/* Verify button */}
                  <button
                    onClick={() => verifyOTP()}
                    disabled={!otpFilled || isVerifying || isSending}
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '14px',
                      fontWeight: 700,
                      background: otpFilled && !isVerifying && !isSending
                        ? 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)'
                        : '#e5e7eb',
                      color: otpFilled && !isVerifying && !isSending ? '#ffffff' : '#9ca3af',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: otpFilled && !isVerifying && !isSending ? 'pointer' : 'not-allowed',
                      letterSpacing: '0.04em',
                      transition: 'all 0.2s ease',
                      boxShadow: otpFilled && !isVerifying && !isSending ? '0 4px 12px rgba(26,26,46,0.3)' : 'none',
                      marginBottom: '20px',
                    }}
                  >
                    {isVerifying ? 'Verifying…' : isSending ? 'Sending OTP…' : 'Verify & Proceed →'}
                  </button>

                  {/* Resend row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {cooldown > 0
                        ? <span>Resend available in <strong style={{ color: '#1a1a2e', fontVariantNumeric: 'tabular-nums' }}>{cooldown}s</strong></span>
                        : <span>Didn&apos;t receive it?</span>
                      }
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => resendOTP('text')}
                        disabled={cooldown > 0 || isSending}
                        style={{ padding: '6px 14px', fontSize: '11px', fontWeight: 700, border: `1px solid ${cooldown > 0 || isSending ? '#e5e7eb' : '#1a1a2e'}`, borderRadius: '6px', background: 'transparent', color: cooldown > 0 || isSending ? '#9ca3af' : '#1a1a2e', cursor: cooldown > 0 || isSending ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}
                      >
                        Resend SMS
                      </button>
                      <button
                        onClick={() => resendOTP('voice')}
                        disabled={cooldown > 0 || isSending}
                        style={{ padding: '6px 14px', fontSize: '11px', fontWeight: 700, border: `1px solid ${cooldown > 0 || isSending ? '#e5e7eb' : '#d1d5db'}`, borderRadius: '6px', background: 'transparent', color: cooldown > 0 || isSending ? '#9ca3af' : '#6b7280', cursor: cooldown > 0 || isSending ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}
                      >
                        Call Me
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ margin: '20px 0 0', borderTop: '1px solid #f0f2f8' }} />

                  {/* Security note */}
                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '1px', flexShrink: 0 }}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', lineHeight: 1.6 }}>
                      This is a one-time code valid for {process.env.NEXT_PUBLIC_OTP_EXPIRY || '10'} minutes. Never share it with anyone. This code is generated exclusively for your registered examination session.
                    </p>
                  </div>
                </div>
              )}

              {/* Success state */}
              {isSuccess && (
                <div style={{ padding: '28px 32px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>
                    Redirecting to exam instructions…
                  </div>
                  <div style={{ marginTop: '16px', height: '3px', background: '#f0f2f8', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg, #27ae60, #1e8449)', borderRadius: '99px', animation: 'fadeSlideIn 0.9s ease forwards' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Back link below card */}
            {!isSuccess && (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                  onClick={onBack}
                  disabled={isVerifying || isSending}
                  style={{ background: 'none', border: 'none', cursor: isVerifying || isSending ? 'not-allowed' : 'pointer', fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '8px 12px', borderRadius: '6px', fontFamily: 'inherit' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                  Change phone number
                </button>
              </div>
            )}

            {/* Step indicator */}
            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {[1, 2, 3, 4, 5].map(s => (
                <div key={s} style={{ width: s === 2 ? '24px' : '7px', height: '7px', borderRadius: '99px', background: s === 2 ? '#1a1a2e' : s < 2 ? '#27ae60' : '#d1d5db', transition: 'all 0.3s' }} />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>
              Step 2 of 5 — Mobile Verification
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
