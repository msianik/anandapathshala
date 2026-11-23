import React, { useState, useEffect } from 'react';
import { PortalAccount } from '../types/school';
import {
  getAllPortalAccounts,
  detectAccountFromIdentifier,
  findAccountByEmailOrPhone,
  resetPortalAccountCredentials,
} from '../utils/schoolLogic';
import {
  Lock,
  User,
  Sparkles,
  X,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  Mail,
  Phone,
  Eye,
  EyeOff,
  RotateCcw,
  ArrowLeft,
  Send,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (account: PortalAccount) => void;
  logoUrl?: string;
  isStandalonePage?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  logoUrl = '/assets/fb/logo.jpg',
  isStandalonePage = false,
}) => {
  // Input fields (clean, empty by default)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorBn, setErrorBn] = useState<string | null>(null);
  const [resetNoticeBn, setResetNoticeBn] = useState<string | null>(null);

  // Smooth animation states: 'idle' | 'authenticating' | 'success'
  const [loginState, setLoginState] = useState<'idle' | 'authenticating' | 'success'>('idle');
  const [authenticatedAccount, setAuthenticatedAccount] = useState<PortalAccount | null>(null);

  // Forgot Password Flow State
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState<'verify' | 'reset' | 'success'>('verify');
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryMethod, setRecoveryMethod] = useState<'email' | 'phone'>('phone');
  const [verifiedAccount, setVerifiedAccount] = useState<PortalAccount | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotErrorBn, setForgotErrorBn] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setIdentifier('');
      setPassword('');
      setErrorBn(null);
      setLoginState('idle');
      setAuthenticatedAccount(null);
      setIsForgotMode(false);
      setForgotStep('verify');
      setForgotErrorBn(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBn(null);

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setErrorBn('অনুগ্রহ করে ইউজার নেম, ইমেইল অথবা মোবাইল নম্বর লিখুন।');
      return;
    }
    if (!cleanPass) {
      setErrorBn('অনুগ্রহ করে পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    // Start verification animation
    setLoginState('authenticating');

    // Slight delay for smooth visual feedback
    await new Promise((resolve) => setTimeout(resolve, 600));

    const account = detectAccountFromIdentifier(cleanId);
    if (!account) {
      setLoginState('idle');
      setErrorBn('প্রদত্ত ইউজার নেম, ইমেইল বা মোবাইল নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি।');
      return;
    }

    if (account.isAccessDisabled) {
      setLoginState('idle');
      setErrorBn('🚫 আপনার অ্যাকাউন্টটির অ্যাক্সেস বর্তমানে সুপার অ্যাডমিন কর্তৃক স্থগিত (Blocked) রয়েছে।');
      return;
    }

    const expectedPassword = account.passwordHint || '123456';
    if (cleanPass !== expectedPassword) {
      setLoginState('idle');
      setErrorBn('পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।');
      return;
    }

    // Success animation phase
    setAuthenticatedAccount(account);
    setLoginState('success');

    // Smooth transition into dashboard
    setTimeout(() => {
      onLoginSuccess(account);
      setLoginState('idle');
    }, 1100);
  };

  const openForgotPasswordFlow = () => {
    setIsForgotMode(true);
    setForgotStep('verify');
    setForgotErrorBn(null);
    setResetNoticeBn(null);
    const initial = identifier.trim();
    setRecoveryIdentifier(initial);
    setRecoveryMethod(initial.includes('@') ? 'email' : 'phone');
    setOtpInput('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const closeForgotPasswordFlow = () => {
    setIsForgotMode(false);
    setForgotStep('verify');
    setForgotErrorBn(null);
  };

  const handleSendVerificationCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryIdentifier.trim()) {
      setForgotErrorBn('অনুগ্রহ করে আপনার নিবন্ধিত ইমেইল এড্রেস অথবা মোবাইল নম্বর প্রদান করুন।');
      return;
    }

    const found = findAccountByEmailOrPhone(recoveryIdentifier);
    if (!found) {
      setForgotErrorBn(
        'প্রদত্ত ইমেইল বা মোবাইল নম্বরের সাথে কোনো নিবন্ধিত পোর্টাল অ্যাকাউন্ট পাওয়া যায়নি।'
      );
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    setVerifiedAccount(found);
    setGeneratedOtp(code);
    setOtpInput(code);
    setNewUserId(found.username);
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotErrorBn(null);
    setForgotStep('reset');
  };

  const handleResendOtp = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setOtpInput(code);
    setForgotErrorBn(null);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedAccount) return;

    if (otpInput.trim() !== generatedOtp) {
      setForgotErrorBn(`ভেরিফিকেশন কোড সঠিক নয়। সঠিক কোড লিখুন।`);
      return;
    }

    if (!newPassword || newPassword.trim().length < 4) {
      setForgotErrorBn('নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }

    if (newPassword.trim() !== confirmNewPassword.trim()) {
      setForgotErrorBn('নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মেলেনি।');
      return;
    }

    const updated = resetPortalAccountCredentials(
      verifiedAccount.id,
      newPassword.trim(),
      newUserId.trim() || verifiedAccount.username
    );

    if (!updated) {
      setForgotErrorBn('পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      return;
    }

    setVerifiedAccount(updated);
    setIdentifier(updated.username);
    setPassword(newPassword.trim());
    setErrorBn(null);
    setForgotErrorBn(null);
    setResetNoticeBn(
      `${updated.nameBn}-এর পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে। নতুন পাসওয়ার্ড দিয়ে লগইন করুন।`
    );
    setForgotStep('success');
  };

  const handleQuickLoginAfterReset = (account: PortalAccount) => {
    setAuthenticatedAccount(account);
    setLoginState('success');
    setTimeout(() => {
      onLoginSuccess(account);
      setLoginState('idle');
    }, 1000);
  };

  const modalContent = (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 ${
        isStandalonePage ? 'my-auto shadow-emerald-950/20' : 'my-4'
      } flex flex-col animate-in fade-in zoom-in-95 duration-200`}
    >
      {/* Top Header Banner */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-950 text-white p-5 sm:p-6 relative shrink-0">
        {!isStandalonePage && loginState === 'idle' && (
          <button
            onClick={onClose}
            aria-label="লগইন উইন্ডো বন্ধ করুন"
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

          <div className="flex items-center gap-3.5 sm:gap-4">
            <img
              src={logoUrl}
              alt="আনন্দ পাঠশালা লোগো"
              referrerPolicy="no-referrer"
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover bg-white p-1 border-2 border-amber-300 shadow-md shrink-0"
            />
            <div>
              <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-amber-200">
                <Sparkles className="w-3 h-3 text-amber-300" />
                স্মার্ট স্কুল পোর্টাল
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight mt-1">
                আনন্দ পাঠশালা
              </h2>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                পোর্টাল লগইন
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {resetNoticeBn && !isForgotMode && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-2 text-xs text-emerald-900 font-bold animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{resetNoticeBn}</span>
              </div>
              <button
                type="button"
                onClick={() => setResetNoticeBn(null)}
                className="text-[11px] text-emerald-700 hover:underline shrink-0 cursor-pointer"
              >
                বন্ধ
              </button>
            </div>
          )}

          {/* SUCCESS ANIMATION VIEW */}
          {loginState === 'success' && authenticatedAccount && (
            <div className="py-8 px-4 text-center space-y-4 animate-in zoom-in-95 fade-in duration-300">
              <div className="relative inline-block">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-100 border-4 border-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce">
                  {authenticatedAccount.avatarUrl ? (
                    <img
                      src={authenticatedAccount.avatarUrl}
                      alt={authenticatedAccount.nameBn}
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
                    <ShieldCheck className="w-10 h-10 text-emerald-600" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow-md">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="inline-block text-[11px] font-bold px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                  {authenticatedAccount.roleTitleBn}
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  স্বাগতম, {authenticatedAccount.nameBn}!
                </h3>
                <p className="text-xs text-slate-500">
                  লগইন সফল হয়েছে। ড্যাশবোর্ডে প্রবেশ করানো হচ্ছে...
                </p>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-48 mx-auto h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full animate-pulse w-full" />
              </div>
            </div>
          )}

          {/* FORGOT PASSWORD FLOW */}
          {loginState !== 'success' && isForgotMode && (
            <div className="bg-amber-50/70 p-4 sm:p-5 rounded-2xl border border-amber-300 space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200/80 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      পাসওয়ার্ড পুনরুদ্ধার
                    </h3>
                    <p className="text-[11px] text-slate-600">
                      নিবন্ধিত তথ্য যাচাই করে নতুন পাসওয়ার্ড দিন
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeForgotPasswordFlow}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>ফিরে যান</span>
                </button>
              </div>

              {forgotErrorBn && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{forgotErrorBn}</span>
                </div>
              )}

              {forgotStep === 'verify' && (
                <form onSubmit={handleSendVerificationCode} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryMethod('phone');
                        setForgotErrorBn(null);
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        recoveryMethod === 'phone'
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>মোবাইল নম্বর</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryMethod('email');
                        setForgotErrorBn(null);
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        recoveryMethod === 'email'
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>ইমেইল এড্রেস</span>
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1.5">
                      {recoveryMethod === 'phone'
                        ? 'আপনার নিবন্ধিত মোবাইল নম্বর লিখুন:'
                        : 'আপনার নিবন্ধিত ইমেইল এড্রেস লিখুন:'}
                    </label>
                    <div className="relative">
                      {recoveryMethod === 'phone' ? (
                        <Phone className="w-4 h-4 text-amber-600 absolute left-3.5 top-3" />
                      ) : (
                        <Mail className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
                      )}
                      <input
                        type="text"
                        value={recoveryIdentifier}
                        onChange={(e) => {
                          setRecoveryIdentifier(e.target.value);
                          setForgotErrorBn(null);
                        }}
                        placeholder={
                          recoveryMethod === 'phone'
                            ? 'যেমন: 01788990011'
                            : 'যেমন: name@anandapathshala.edu.bd'
                        }
                        className="w-full pl-10 pr-3 py-2.5 text-base sm:text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 text-xs font-black text-white bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ভেরিফিকেশন কোড পাঠান</span>
                  </button>
                </form>
              )}

              {forgotStep === 'reset' && verifiedAccount && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-white border border-emerald-300 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">
                        {verifiedAccount.nameBn} ({verifiedAccount.roleTitleBn})
                      </span>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer"
                      >
                        পুনরায় কোড পাঠান
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      ভেরিফিকেশন কোড: <strong className="font-mono text-emerald-800">{generatedOtp}</strong>
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      ভেরিফিকেশন কোড (OTP):
                    </label>
                    <input
                      type="text"
                      required
                      value={otpInput}
                      onChange={(e) => {
                        setOtpInput(e.target.value);
                        setForgotErrorBn(null);
                      }}
                      placeholder="৬ সংখ্যার কোড"
                      className="w-full px-3 py-2 text-base sm:text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      নতুন পাসওয়ার্ড:
                    </label>
                    <div className="relative">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-700 absolute left-3 top-2.5" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setForgotErrorBn(null);
                        }}
                        placeholder="নতুন পাসওয়ার্ড (কমপক্ষে ৪ অক্ষর)"
                        className="w-full pl-8 pr-8 py-2 text-base sm:text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 font-mono font-bold text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      পুনরায় নতুন পাসওয়ার্ড লিখুন:
                    </label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={confirmNewPassword}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value);
                        setForgotErrorBn(null);
                      }}
                      placeholder="পাসওয়ার্ড নিশ্চিত করুন"
                      className="w-full px-3 py-2 text-base sm:text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setForgotStep('verify')}
                      className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 cursor-pointer"
                    >
                      পূর্ববর্তী
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>পাসওয়ার্ড সংরক্ষণ করুন</span>
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 'success' && verifiedAccount && (
                <div className="p-4 rounded-2xl bg-white border border-emerald-400 space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে!
                      </h4>
                      <p className="text-xs text-slate-600">
                        এখন সরাসরি আপনার অ্যাকাউন্টে প্রবেশ করতে পারেন।
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={closeForgotPasswordFlow}
                      className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                    >
                      লগইন ফর্মে ফিরুন
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLoginAfterReset(verifiedAccount)}
                      className="px-5 py-2 text-xs font-black text-white bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>সরাসরি প্রবেশ করুন</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STANDARD CLEAN LOGIN FORM */}
          {loginState !== 'success' && !isForgotMode && (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {errorBn && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="flex-1">{errorBn}</span>
                </div>
              )}

              {/* Username / Identifier Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ইউজার আইডি:</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={loginState === 'authenticating'}
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setErrorBn(null);
                    }}
                    placeholder="ইউজারনেম বা মোবাইল নম্বর"
                    className="w-full px-3.5 py-2.5 text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 font-medium text-slate-900 transition-all placeholder:text-slate-400 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>পাসওয়ার্ড:</span>
                  </label>
                  <button
                    type="button"
                    onClick={openForgotPasswordFlow}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    disabled={loginState === 'authenticating'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorBn(null);
                    }}
                    placeholder="আপনার পাসওয়ার্ড লিখুন"
                    className="w-full pl-3.5 pr-10 py-2.5 text-base sm:text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 font-mono font-bold text-slate-900 transition-all placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal disabled:opacity-60"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    title={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button with Smooth Animation */}
              <button
                type="submit"
                disabled={loginState === 'authenticating'}
                className="w-full mt-2 py-3 px-4 text-xs font-black text-white bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-800 hover:to-teal-900 active:scale-[0.99] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80"
              >
                {loginState === 'authenticating' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>যাচাই করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>লগইন করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    );

  if (isStandalonePage) {
    return (
      <div
        className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 flex flex-col items-center justify-center p-4 sm:p-6"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
        }}
      >
        {modalContent}
        <div className="mt-4 text-center">
          <p className="text-emerald-400/80 text-xs font-semibold tracking-wide">
            আনন্দ পাঠশালা • স্মার্ট পোর্টাল
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="আনন্দ পাঠশালা স্মার্ট পোর্টাল লগইন"
      onClick={loginState !== 'idle' ? undefined : onClose}
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      {modalContent}
    </div>
  );
};
