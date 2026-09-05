import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, Building2, User as UserIcon, Globe, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import * as userApi from '../services/user.api';
import { uploadFile } from '../services/upload.api';
import { toApiError } from '../lib/api';

/**
 * Mandatory profile setup.
 *
 * `username` is optional in the User schema but every profile URL, @handle and
 * board-recipient lookup depends on it, so a signed-in account without one
 * cannot really use the product. This page is the gate; RequireProfileSetup in
 * App.tsx routes here until it is completed.
 *
 * Ported from the four-step flow in the old frontend
 * (legacy-frontend/src/components/account/).
 */

const COUNTRIES = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'United States', 'United Kingdom',
  'Canada', 'Ireland', 'Australia', 'India', 'Germany', 'France', 'Netherlands',
  'Brazil', 'Mexico', 'Japan', 'Other',
];

type Step = 'type' | 'country' | 'username';

export const AccountSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, rawUser, refresh, ready } = useAuth();

  const [step, setStep] = useState<Step>('type');
  const [accountType, setAccountType] = useState<'personal' | 'enterprise'>('personal');
  const [country, setCountry] = useState('');
  const [username, setUsername] = useState('');
  const [availability, setAvailability] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already set up, or signed out — nothing to do here.
  useEffect(() => {
    if (!ready) return;
    if (!user) navigate('/login', { replace: true });
    else if (rawUser?.username) navigate('/', { replace: true });
  }, [ready, user, rawUser, navigate]);

  // Debounced availability check against GET /user/check-username/:username
  useEffect(() => {
    const clean = username.trim().replace(/^@/, '').toLowerCase();
    if (clean.length < 3) {
      setAvailability('idle');
      return;
    }

    setAvailability('checking');
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const { available } = await userApi.checkUsername(clean);
        if (!cancelled) setAvailability(available ? 'available' : 'taken');
      } catch {
        if (!cancelled) setAvailability('idle');
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username]);

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = username.trim().replace(/^@/, '').toLowerCase();
    if (clean.length < 3 || clean.length > 14) {
      setError('Username must be between 3 and 14 characters');
      return;
    }
    if (availability === 'taken') {
      setError(`@${clean} is already taken. Please pick another.`);
      return;
    }

    setSubmitting(true);
    try {
      let profileImage: string | undefined;
      if (avatarFile) {
        const uploaded = await uploadFile(avatarFile, 'image');
        profileImage = uploaded.url;
      }

      await userApi.updateProfile({
        username: clean,
        country: country || undefined,
        accountType,
        ...(profileImage ? { profileImage } : {}),
      });

      await refresh();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : toApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const stepIndex = step === 'type' ? 0 : step === 'country' ? 1 : 2;

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xs border border-[#ECEFF3]">
        {/* Progress */}
        <div className="flex gap-1.5 mb-6" role="progressbar" aria-valuenow={stepIndex + 1} aria-valuemin={1} aria-valuemax={3}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-[#FE6349]' : 'bg-[#ECEFF3]'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 text-[#FE6349] text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Step 1 — account type */}
        {step === 'type' && (
          <>
            <h1 className="text-2xl font-extrabold text-[#1A1B25] mb-1.5">How will you use Heartboard?</h1>
            <p className="text-sm text-[#808897] mb-6">You can change this later.</p>

            <div className="space-y-3">
              {([
                { id: 'personal', icon: UserIcon, title: 'Personal', desc: 'Celebrate friends, family and colleagues' },
                { id: 'enterprise', icon: Building2, title: 'Organisation', desc: 'Recognition boards for a team or brand' },
              ] as const).map(({ id, icon: Icon, title, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAccountType(id)}
                  className={`w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                    accountType === id
                      ? 'border-[#FE6349] bg-rose-50/50'
                      : 'border-[#ECEFF3] hover:border-[#DFE1E6]'
                  }`}
                >
                  <Icon className="w-5 h-5 text-[#FE6349] shrink-0 mt-0.5" />
                  <span>
                    <span className="block font-extrabold text-sm text-[#1A1B25]">{title}</span>
                    <span className="block text-xs text-[#808897] mt-0.5">{desc}</span>
                  </span>
                  {accountType === id && <Check className="w-4 h-4 text-[#FE6349] ml-auto shrink-0" />}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setStep('country')}
              className="w-full mt-6 py-3.5 rounded-2xl bg-[#FE6349] hover:bg-[#e05234] text-white font-extrabold text-sm transition-all"
            >
              Continue
            </button>
          </>
        )}

        {/* Step 2 — country */}
        {step === 'country' && (
          <>
            <h1 className="text-2xl font-extrabold text-[#1A1B25] mb-1.5">Where are you based?</h1>
            <p className="text-sm text-[#808897] mb-6">This helps us surface local moments.</p>

            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A4ABB8]" />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-[#F8F9FB] rounded-2xl text-sm font-medium text-[#1A1B25] focus:outline-none appearance-none"
              >
                <option value="">Select a country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => setStep('type')}
                className="px-6 py-3.5 rounded-2xl bg-[#F8F9FB] text-[#1A1B25] font-extrabold text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep('username')}
                className="flex-1 py-3.5 rounded-2xl bg-[#FE6349] hover:bg-[#e05234] text-white font-extrabold text-sm transition-all"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* Step 3 — username + avatar */}
        {step === 'username' && (
          <form onSubmit={handleFinish}>
            <h1 className="text-2xl font-extrabold text-[#1A1B25] mb-1.5">Claim your handle</h1>
            <p className="text-sm text-[#808897] mb-6">
              This is your profile address: heartboard.app/profile/<strong>you</strong>
            </p>

            {/* Avatar */}
            <div className="flex justify-center mb-5">
              <label className="relative cursor-pointer">
                <span className="block w-20 h-20 rounded-full bg-[#F8F9FB] overflow-hidden border-2 border-[#ECEFF3]">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center">
                      <Camera className="w-6 h-6 text-[#A4ABB8]" />
                    </span>
                  )}
                </span>
                <input type="file" accept="image/*" onChange={handleAvatarPick} className="sr-only" />
              </label>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A4ABB8] font-bold">@</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourname"
                maxLength={14}
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full pl-9 pr-11 py-3.5 bg-[#F8F9FB] rounded-2xl text-sm font-medium text-[#1A1B25] focus:outline-none focus:bg-[#ECEFF3]/60"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2">
                {availability === 'checking' && <Loader2 className="w-4 h-4 text-[#A4ABB8] animate-spin" />}
                {availability === 'available' && <Check className="w-4 h-4 text-emerald-500" />}
                {availability === 'taken' && <span className="text-xs font-bold text-[#FE6349]">Taken</span>}
              </span>
            </div>
            <p className="text-[11px] text-[#A4ABB8] mt-2">3-14 characters. Letters, numbers and underscores.</p>

            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => setStep('country')}
                className="px-6 py-3.5 rounded-2xl bg-[#F8F9FB] text-[#1A1B25] font-extrabold text-sm"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting || availability === 'taken'}
                className="flex-1 py-3.5 rounded-2xl bg-[#FE6349] hover:bg-[#e05234] text-white font-extrabold text-sm transition-all disabled:opacity-60"
              >
                {submitting ? 'Finishing…' : 'Finish setup'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
