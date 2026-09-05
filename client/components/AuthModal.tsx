import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  Lock, 
  User, 
  Check, 
  AlertCircle, 
  Camera, 
  ArrowLeft, 
  Sparkles, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Heart,
  ChevronRight,
  Globe
} from 'lucide-react';
import { RegisteredUser, MOCK_REGISTERED_USERS } from '../types';

export type AuthMode = 'login' | 'signup' | 'verify' | 'onboarding_step1' | 'onboarding_step2';

export interface AuthModalProps {
  isOpen?: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  promptMessage?: string;
  onAuthSuccess: (user: RegisteredUser, isNewRegistration: boolean) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200'
];

export const AuthView: React.FC<AuthModalProps> = ({
  isOpen = true,
  onClose,
  initialMode = 'login',
  promptMessage,
  onAuthSuccess
}) => {
  const [currentStep, setCurrentStep] = useState<AuthMode>(initialMode);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');

  // Form Fields
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // OTP Verification State
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Onboarding Step 1 State
  const [customHandle, setCustomHandle] = useState('');
  const [handleAvailability, setHandleAvailability] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(PRESET_AVATARS[0]);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Onboarding Step 2 State
  const [agreedToRules, setAgreedToRules] = useState(false);

  // Reset or initialize state on open / mode change
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(initialMode);
      setErrorMessage(null);
      setSuccessMessage(null);
      setOtpValues(['', '', '', '', '', '']);
      setResendTimer(30);
      setCanResend(false);
      setAgreedToRules(false);
    }
  }, [isOpen, initialMode]);

  // Resend Timer Countdown
  useEffect(() => {
    let interval: any;
    if (currentStep === 'verify' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep, resendTimer]);

  // Real-time handle availability checking (Debounced)
  useEffect(() => {
    if (currentStep !== 'onboarding_step1') return;

    const trimmed = customHandle.trim().replace(/^@/, '').toLowerCase();
    if (!trimmed || trimmed.length < 3) {
      setHandleAvailability('idle');
      return;
    }

    setHandleAvailability('checking');
    const timer = setTimeout(() => {
      // Check against MOCK_REGISTERED_USERS
      const isTaken = MOCK_REGISTERED_USERS.some((u) => {
        const existingClean = u.handle.replace(/^@/, '').toLowerCase();
        return existingClean === trimmed || u.name.toLowerCase() === trimmed;
      });

      if (isTaken) {
        setHandleAvailability('taken');
      } else {
        setHandleAvailability('available');
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [customHandle, currentStep]);

  if (!isOpen) return null;

  // Handle OTP Input Change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // User pasted full OTP
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otpValues];
      pasted.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtpValues(newOtp);
      const nextIdx = Math.min(pasted.length, 5);
      otpInputRefs.current[nextIdx]?.focus();
      return;
    }

    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Submit Handler: Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!emailOrPhone.trim()) {
      setErrorMessage(authMethod === 'email' ? 'Please enter your email address' : 'Please enter your phone number');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    // Lookup existing user mock
    const cleanInput = emailOrPhone.trim().toLowerCase();
    const existing = MOCK_REGISTERED_USERS.find(u => 
      u.name.toLowerCase().includes(cleanInput) || 
      u.handle.toLowerCase().includes(cleanInput)
    ) || MOCK_REGISTERED_USERS[2]; // Default to Micky if not found

    onAuthSuccess(existing, false);
    onClose();
  };

  // Submit Handler: Sign Up Form -> Move to Verification
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!emailOrPhone.trim()) {
      setErrorMessage(authMethod === 'email' ? 'Please enter your email address' : 'Please enter your phone number');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    // Auto populate suggested handle based on email / phone
    const cleanPrefix = emailOrPhone.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase().slice(0, 15);
    setCustomHandle(cleanPrefix);

    // Send code -> move to Verify Step
    setCurrentStep('verify');
    setSuccessMessage(`Verification code sent to ${emailOrPhone}`);
    setResendTimer(30);
    setCanResend(false);
  };

  // Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const code = otpValues.join('');
    if (code.length < 6) {
      setErrorMessage('Please enter the full 6-digit verification code');
      return;
    }

    // Code verified -> move to Onboarding Step 1
    setSuccessMessage(null);
    setCurrentStep('onboarding_step1');
  };

  // Resend OTP Code
  const handleResendCode = () => {
    if (!canResend) return;
    setResendTimer(45);
    setCanResend(false);
    setSuccessMessage(`A new verification code has been dispatched to ${emailOrPhone}`);
    setOtpValues(['', '', '', '', '', '']);
    otpInputRefs.current[0]?.focus();
  };

  // Google Authentication (Login or Signup)
  const handleGoogleAuth = () => {
    const googleUser: RegisteredUser = {
      id: `u-g-${Date.now()}`,
      name: 'alex_rivera',
      handle: '@alex_rivera',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      isVerified: true,
      heartsCount: 14,
      boardsCount: 2,
      messagesCount: '5',
      taggedCount: '3',
      bio: 'Digital storyteller & grateful collaborator',
      role: 'Registered Member'
    };

    if (currentStep === 'login') {
      // Direct login for existing accounts
      onAuthSuccess(googleUser, false);
      onClose();
    } else {
      // Direct to onboarding for new registrations
      setCustomHandle('alex_rivera');
      setSelectedAvatar(googleUser.avatar);
      setCurrentStep('onboarding_step1');
    }
  };

  // Quick Demo Login Handler
  const handleQuickDemoLogin = () => {
    const defaultMicky: RegisteredUser = {
      id: 'u-micky',
      name: 'Micky Mouse',
      handle: '@mickymouse',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Micky',
      isVerified: true,
      heartsCount: 342,
      boardsCount: 6,
      messagesCount: '24',
      taggedCount: '18',
      bio: 'Official Curator on Heartboard',
      role: 'Verified Curator'
    };
    onAuthSuccess(defaultMicky, false);
    onClose();
  };

  // Complete Onboarding Step 1
  const handleStep1Continue = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clean = customHandle.trim().replace(/^@/, '').toLowerCase();
    if (!clean || clean.length < 3) {
      setErrorMessage('Username must be at least 3 characters long');
      return;
    }
    if (handleAvailability === 'taken') {
      setErrorMessage(`@${clean} is already taken. Please pick another username.`);
      return;
    }

    setCurrentStep('onboarding_step2');
  };

  // Complete Onboarding Step 2 (Final Finish)
  const handleStep2Finish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToRules) {
      setErrorMessage('You must agree to the Community Rules to continue');
      return;
    }

    const cleanUsername = customHandle.trim().replace(/^@/, '').toLowerCase();
    const userHandle = `@${cleanUsername}`;

    const newUser: RegisteredUser = {
      id: `u-${Date.now()}`,
      name: cleanUsername,
      handle: userHandle,
      avatar: selectedAvatar || PRESET_AVATARS[0],
      isVerified: false,
      heartsCount: 0,
      boardsCount: 0,
      messagesCount: '0',
      taggedCount: '0',
      bio: 'Heartboard curator & appreciation sender',
      role: 'Registered Member'
    };

    onAuthSuccess(newUser, true);
    onClose();
  };

  // Handle Photo File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8F9FB] flex flex-col justify-between selection:bg-rose-100 font-sans">
      
      {/* Top Header Bar */}
      <header className="w-full bg-white border-b border-[#ECEFF3] px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {currentStep !== 'login' && currentStep !== 'signup' && (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 'verify') setCurrentStep('signup');
                if (currentStep === 'onboarding_step1') setCurrentStep('verify');
                if (currentStep === 'onboarding_step2') setCurrentStep('onboarding_step1');
              }}
              className="w-8 h-8 rounded-full bg-[#F8F9FB] hover:bg-[#ECEFF3] flex items-center justify-center text-[#1A1B25] transition-colors cursor-pointer mr-1"
              aria-label="Go back to previous step"
            >
              <ArrowLeft size={16} />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FE6349] flex items-center justify-center text-white shadow-xs">
              <Heart size={16} fill="currentColor" />
            </div>
            <div>
              <span className="font-extrabold text-base text-[#1A1B25] tracking-tight">Heartboard</span>
            </div>
          </div>
        </div>

        {/* Step Progress Pills for Onboarding / Verification */}
        <div className="hidden sm:flex items-center gap-2">
          {currentStep === 'signup' && (
            <span className="text-xs font-bold text-[#808897] bg-[#F8F9FB] px-3 py-1 rounded-full border border-[#ECEFF3]">
              Account Registration
            </span>
          )}
          {currentStep === 'login' && (
            <span className="text-xs font-bold text-[#808897] bg-[#F8F9FB] px-3 py-1 rounded-full border border-[#ECEFF3]">
              Member Sign In
            </span>
          )}
          {currentStep === 'verify' && (
            <span className="text-xs font-bold text-[#FE6349] bg-rose-50 px-3 py-1 rounded-full border border-rose-200/60 flex items-center gap-1.5">
              <ShieldCheck size={13} /> Security Verification
            </span>
          )}
          {currentStep === 'onboarding_step1' && (
            <span className="text-xs font-bold text-[#FE6349] bg-rose-50 px-3 py-1 rounded-full border border-rose-200/60">
              Step 1 of 2: Create Profile
            </span>
          )}
          {currentStep === 'onboarding_step2' && (
            <span className="text-xs font-bold text-[#FE6349] bg-rose-50 px-3 py-1 rounded-full border border-rose-200/60">
              Step 2 of 2: Ground Rules
            </span>
          )}
        </div>

        {/* Exit / Return to Platform Button */}
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F8F9FB] hover:bg-[#ECEFF3] text-[#666D80] hover:text-[#1A1B25] text-xs font-bold transition-colors cursor-pointer border border-[#ECEFF3]"
          aria-label="Back to Heartboard"
        >
          <span className="hidden sm:inline">Back to Heartboard</span>
          <X size={15} />
        </button>
      </header>

      {/* Main Full-Page Content Viewport */}
      <main className="w-full max-w-[480px] mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center">

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-50 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-red-600 border border-red-100">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Global Success Banner */}
        {successMessage && (
          <div className="mb-5 p-3.5 bg-emerald-50 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-emerald-700 border border-emerald-100">
            <Check size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ================= STEP 1: FULL-PAGE LOGIN ================= */}
        {currentStep === 'login' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xs">
            <div className="text-left mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1B25] tracking-tight">
                Welcome back
              </h1>
              <p className="text-xs sm:text-sm text-[#808897] font-medium mt-1.5 leading-relaxed">
                Sign in to blow hearts, contribute to boards, and build your reputation trophy case.
              </p>
            </div>

            {/* Google One-Click Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full py-3 px-4 rounded-2xl bg-[#F8F9FB] hover:bg-[#ECEFF3] text-[#1A1B25] font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer mb-5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="h-[1px] bg-[#ECEFF3] flex-1" />
              <span className="text-[11px] font-bold text-[#A4ABB8] uppercase tracking-wider">or sign in with</span>
              <div className="h-[1px] bg-[#ECEFF3] flex-1" />
            </div>

            {/* Method Tabs (Email vs Phone) */}
            <div className="flex bg-[#F8F9FB] p-1 rounded-2xl mb-4">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('email');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMethod === 'email' ? 'bg-white text-[#1A1B25] shadow-xs' : 'text-[#808897] hover:text-gray-900'
                }`}
              >
                <Mail size={14} />
                <span>Email</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('phone');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMethod === 'phone' ? 'bg-white text-[#1A1B25] shadow-xs' : 'text-[#808897] hover:text-gray-900'
                }`}
              >
                <Phone size={14} />
                <span>Phone</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#666D80] mb-1 text-left">
                  {authMethod === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    {authMethod === 'email' ? <Mail size={16} /> : <Phone size={16} />}
                  </div>
                  <input
                    type={authMethod === 'email' ? 'email' : 'tel'}
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder={authMethod === 'email' ? 'you@domain.com' : '+1 (555) 000-0000'}
                    className="w-full bg-[#F8F9FB] focus:bg-[#ECEFF3]/50 border-none rounded-2xl py-3 pl-10 pr-4 text-xs sm:text-sm font-semibold text-[#1A1B25] placeholder:text-gray-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#666D80]">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setSuccessMessage('Password reset instructions sent to your email.');
                      setErrorMessage(null);
                    }}
                    className="text-[11px] font-bold text-[#FE6349] hover:underline cursor-pointer"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-[#F8F9FB] focus:bg-[#ECEFF3]/50 border-none rounded-2xl py-3 pl-10 pr-10 text-xs sm:text-sm font-semibold text-[#1A1B25] placeholder:text-gray-400 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#FE6349] hover:bg-[#FE6349]/90 text-white font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-sm mt-2"
              >
                Sign In
              </button>
            </form>

            {/* Footer Switch to Sign Up */}
            <p className="text-xs text-[#808897] font-semibold text-center mt-6">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setCurrentStep('signup');
                }}
                className="text-[#FE6349] font-extrabold hover:underline cursor-pointer"
              >
                Create an account
              </button>
            </p>
          </div>
        )}

        {/* ================= STEP 2: FULL-PAGE SIGN UP ================= */}
        {currentStep === 'signup' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xs">
            <div className="text-left mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1B25] tracking-tight">
                Join Heartboard
              </h1>
              <p className="text-xs sm:text-sm text-[#808897] font-medium mt-1.5 leading-relaxed">
                Create a permanent profile to send authentic compliments and accumulate verifiable goodwill.
              </p>
            </div>

            {/* Google Sign-Up Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full py-3 px-4 rounded-2xl bg-[#F8F9FB] hover:bg-[#ECEFF3] text-[#1A1B25] font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer mb-5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign Up with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="h-[1px] bg-[#ECEFF3] flex-1" />
              <span className="text-[11px] font-bold text-[#A4ABB8] uppercase tracking-wider">or register with</span>
              <div className="h-[1px] bg-[#ECEFF3] flex-1" />
            </div>

            {/* Method Tabs */}
            <div className="flex bg-[#F8F9FB] p-1 rounded-2xl mb-4">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('email');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMethod === 'email' ? 'bg-white text-[#1A1B25] shadow-xs' : 'text-[#808897] hover:text-gray-900'
                }`}
              >
                <Mail size={14} />
                <span>Email Address</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('phone');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMethod === 'phone' ? 'bg-white text-[#1A1B25] shadow-xs' : 'text-[#808897] hover:text-gray-900'
                }`}
              >
                <Phone size={14} />
                <span>Phone Number</span>
              </button>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#666D80] mb-1 text-left">
                  {authMethod === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    {authMethod === 'email' ? <Mail size={16} /> : <Phone size={16} />}
                  </div>
                  <input
                    type={authMethod === 'email' ? 'email' : 'tel'}
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder={authMethod === 'email' ? 'sarah@example.com' : '+1 (555) 234-5678'}
                    className="w-full bg-[#F8F9FB] focus:bg-[#ECEFF3]/50 border-none rounded-2xl py-3 pl-10 pr-4 text-xs sm:text-sm font-semibold text-[#1A1B25] placeholder:text-gray-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#666D80] mb-1 text-left">Password</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password (min 6 chars)"
                    className="w-full bg-[#F8F9FB] focus:bg-[#ECEFF3]/50 border-none rounded-2xl py-3 pl-10 pr-10 text-xs sm:text-sm font-semibold text-[#1A1B25] placeholder:text-gray-400 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#FE6349] hover:bg-[#FE6349]/90 text-white font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-md mt-2 flex items-center justify-center gap-2"
              >
                <span>Continue & Send Code</span>
                <ChevronRight size={16} />
              </button>
            </form>

            {/* Footer Switch to Sign In */}
            <p className="text-xs text-[#808897] font-semibold text-center mt-6">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setCurrentStep('login');
                }}
                className="text-[#1A1B25] font-extrabold hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </p>
          </div>
        )}

        {/* ================= STEP 3: FULL-PAGE VERIFICATION ================= */}
        {currentStep === 'verify' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xs">
            <div className="text-left mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#FE6349] text-[10px] font-extrabold uppercase tracking-wider mb-3">
                <ShieldCheck size={12} />
                <span>Security Step</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1B25] tracking-tight">
                Enter verification code
              </h1>
              <p className="text-xs sm:text-sm text-[#808897] font-medium mt-1.5 leading-relaxed">
                We sent a 6-digit verification code to <strong className="text-[#1A1B25]">{emailOrPhone || 'your contact'}</strong>.
              </p>
            </div>

            {/* 6 Digit OTP Inputs */}
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-between gap-2 sm:gap-3 my-4">
                {otpValues.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-14 sm:w-13 sm:h-16 bg-[#F8F9FB] border-none rounded-2xl text-center text-xl sm:text-2xl font-extrabold text-[#1A1B25] focus:bg-[#ECEFF3]/60 focus:outline-none transition-all shadow-2xs"
                  />
                ))}
              </div>

              {/* Simulated Auto-Fill Hint */}
              <div className="p-3.5 bg-[#F8F9FB] rounded-2xl flex items-center justify-between text-xs text-[#808897]">
                <span>Demo Test Code: <strong className="text-[#1A1B25]">123456</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setOtpValues(['1', '2', '3', '4', '5', '6']);
                  }}
                  className="font-bold text-[#FE6349] hover:underline cursor-pointer"
                >
                  Auto-fill Code
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#FE6349] hover:bg-[#FE6349]/90 text-white font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-md"
              >
                Verify & Continue
              </button>

              {/* Resend Code Section */}
              <div className="text-center text-xs font-semibold text-[#808897] pt-2">
                {resendTimer > 0 ? (
                  <span>Resend code in <strong className="text-[#1A1B25]">{resendTimer}s</strong></span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="text-[#FE6349] font-extrabold hover:underline cursor-pointer"
                  >
                    Resend Code Now
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 4: FULL-PAGE ONBOARDING 1 (USERNAME & AVATAR) ================= */}
        {currentStep === 'onboarding_step1' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xs">
            <div className="text-left mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#FE6349] text-[10px] font-extrabold uppercase tracking-wider mb-2">
                <span>Step 1 of 2</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1B25] tracking-tight">
                Choose your username
              </h1>
              <p className="text-xs sm:text-sm text-[#808897] font-medium mt-1.5 leading-relaxed">
                Your unique handle identifies your Heartboard and allows others to blow you hearts and messages.
              </p>
            </div>

            <form onSubmit={handleStep1Continue} className="space-y-6">
              {/* Profile Avatar Upload / Selection */}
              <div className="flex flex-col items-center gap-3.5 p-4 bg-[#F8F9FB] rounded-3xl">
                <div className="relative group">
                  <div className="w-22 h-22 rounded-full bg-[#FAF0EC] p-1 flex items-center justify-center overflow-hidden shadow-xs">
                    <img
                      src={selectedAvatar}
                      alt="Avatar Preview"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                    title="Upload custom photo"
                  >
                    <Camera size={22} />
                  </button>
                </div>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="text-xs font-bold text-[#FE6349] hover:underline cursor-pointer"
                  >
                    Upload Custom Photo
                  </button>
                  <span className="text-gray-300 text-xs">•</span>
                  <span className="text-xs text-[#808897] font-medium">Or choose avatar:</span>
                </div>

                {/* Preset Avatars Row */}
                <div className="flex items-center gap-2.5">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAvatar(url)}
                      className={`w-9 h-9 rounded-full overflow-hidden transition-all cursor-pointer ${
                        selectedAvatar === url ? 'scale-110 shadow-xs ring-2 ring-[#FE6349]' : 'opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Username Input with Real-Time Availability Indicator */}
              <div>
                <label className="block text-xs font-bold text-[#666D80] mb-1.5 text-left">
                  Unique Username
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-base text-[#808897]">
                    @
                  </span>
                  <input
                    type="text"
                    value={customHandle}
                    onChange={(e) => {
                      const val = e.target.value.replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '');
                      setCustomHandle(val);
                      setErrorMessage(null);
                    }}
                    placeholder="yourname"
                    className="w-full bg-[#F8F9FB] focus:bg-[#ECEFF3]/50 border-none rounded-2xl py-3.5 pl-10 pr-32 text-sm font-bold text-[#1A1B25] placeholder:text-gray-400 focus:outline-none transition-all shadow-2xs"
                  />

                  {/* Real-time Indicator Pill */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {handleAvailability === 'checking' && (
                      <span className="text-xs font-bold text-gray-400 animate-pulse">
                        Checking...
                      </span>
                    )}
                    {handleAvailability === 'available' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold">
                        <Check size={13} strokeWidth={3} /> Available
                      </span>
                    )}
                    {handleAvailability === 'taken' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-extrabold">
                        <X size={13} strokeWidth={3} /> Already taken
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-[#808897] font-medium mt-1.5 text-left">
                  3–20 characters. Letters, numbers, and underscores only. This will be your permanent unique identity across Heartboard.
                </p>
              </div>

              <button
                type="submit"
                disabled={handleAvailability === 'taken' || !customHandle.trim()}
                className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                  handleAvailability === 'taken' || !customHandle.trim()
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#FE6349] hover:bg-[#FE6349]/90 text-white cursor-pointer'
                }`}
              >
                <span>Continue to Ground Rules</span>
                <ChevronRight size={16} />
              </button>
            </form>
          </div>
        )}

        {/* ================= STEP 5: FULL-PAGE ONBOARDING 2 (COMMUNITY RULES) ================= */}
        {currentStep === 'onboarding_step2' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xs">
            <div className="text-left mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#FE6349] text-[10px] font-extrabold uppercase tracking-wider mb-2">
                <span>Step 2 of 2</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1B25] tracking-tight">
                Community Rules & Goodwill
              </h1>
              <p className="text-xs sm:text-sm text-[#808897] font-medium mt-1.5 leading-relaxed">
                Heartboard is a dedicated space for genuine human kindness and verifiable social appreciation.
              </p>
            </div>

            {/* Scrollable Rules Container */}
            <div className="bg-[#F8F9FB] rounded-2xl p-4 sm:p-5 max-h-64 overflow-y-auto text-left space-y-4 text-xs text-[#353849] leading-relaxed">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-100 text-[#FE6349] flex items-center justify-center shrink-0 mt-0.5">
                  <Heart size={13} fill="currentColor" />
                </div>
                <div>
                  <h4 className="font-extrabold text-[#1A1B25] text-xs sm:text-sm">1. Authentic Appreciation</h4>
                  <p className="text-[11px] text-[#666D80] mt-0.5 leading-normal">
                    Messages and heart tokens must represent truthful, uplifting gratitude. Sarcasm, spam, or false vouches undermine community trust.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck size={13} />
                </div>
                <div>
                  <h4 className="font-extrabold text-[#1A1B25] text-xs sm:text-sm">2. Zero Tolerance for Harassment</h4>
                  <p className="text-[11px] text-[#666D80] mt-0.5 leading-normal">
                    Hate speech, defamation, online bullying, or deceptive reputation manipulation will result in immediate permanent profile suspension.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles size={13} />
                </div>
                <div>
                  <h4 className="font-extrabold text-[#1A1B25] text-xs sm:text-sm">3. Meaningful Semantic Hearts</h4>
                  <p className="text-[11px] text-[#666D80] mt-0.5 leading-normal">
                    Our structured heart spectrum (Loving Partner, Hard Work, Reliability, Inspiration, Workspace Legend) carries real weight. Gift tokens with intention.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock size={13} />
                </div>
                <div>
                  <h4 className="font-extrabold text-[#1A1B25] text-xs sm:text-sm">4. Respect Privacy & Consent</h4>
                  <p className="text-[11px] text-[#666D80] mt-0.5 leading-normal">
                    Honor private and anonymous modes. Never expose personal secrets or private contact information without explicit permission.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#ECEFF3]/80 flex items-start gap-2.5">
                <AlertCircle size={15} className="text-[#FE6349] shrink-0 mt-0.5" />
                <p className="text-[11px] font-semibold text-[#666D80] leading-normal">
                  Users who violate Heartboard’s platform rules or community guidelines may have their account suspended.
                </p>
              </div>
            </div>

            {/* Mandatory Agreement Checkbox */}
            <form onSubmit={handleStep2Finish} className="space-y-4 mt-6">
              <label className="flex items-start gap-3 text-left cursor-pointer group p-1.5 rounded-xl hover:bg-[#F8F9FB] transition-colors">
                <input
                  type="checkbox"
                  checked={agreedToRules}
                  onChange={(e) => {
                    setAgreedToRules(e.target.checked);
                    setErrorMessage(null);
                  }}
                  className="w-5 h-5 mt-0.5 rounded-lg border-2 border-gray-300 text-[#FE6349] focus:ring-[#FE6349] cursor-pointer"
                />
                <span className="text-xs font-bold text-[#1A1B25] group-hover:text-black leading-relaxed">
                  I agree to Heartboard's Community Rules, Terms of Service, and Goodwill Guidelines.
                </span>
              </label>

              <button
                type="submit"
                disabled={!agreedToRules}
                className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                  !agreedToRules
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#FE6349] hover:bg-[#FE6349]/90 text-white cursor-pointer'
                }`}
              >
                <span>Complete Registration & Enter</span>
                <Check size={16} strokeWidth={3} />
              </button>
            </form>
          </div>
        )}

      </main>

      {/* Subtle Bottom Footer */}
      <footer className="w-full py-4 text-center text-xs font-semibold text-[#A4ABB8] border-t border-[#ECEFF3] bg-white">
        <span>© 2026 Heartboard • Wall of Love & Social Resume</span>
      </footer>

    </div>
  );
};

export const AuthModal = AuthView;
export default AuthView;
