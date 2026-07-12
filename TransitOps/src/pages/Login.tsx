import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Truck, ShieldCheck, Mail, Lock, User as UserIcon, ArrowRight, Clock } from 'lucide-react';

type Mode = 'signin' | 'signup';

export const Login: React.FC = () => {
  const { loginWithCredentials, registerAccount } = useApp();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('signin');

  // Sign In fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInError, setSignInError] = useState('');

  // Sign Up fields
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirm, setSuConfirm] = useState('');
  const [suRole, setSuRole] = useState<'Driver' | 'Safety Officer' | 'Financial Analyst'>('Driver');
  const [signUpError, setSignUpError] = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setSignInError('Please enter your email and password.');
      return;
    }

    const res = loginWithCredentials(email, password);
    if (!res.success) {
      setSignInError(res.message);
      return;
    }

    switch (res.role) {
      case 'Driver':
        navigate('/trips');
        break;
      case 'Safety Officer':
        navigate('/drivers');
        break;
      case 'Financial Analyst':
        navigate('/reports');
        break;
      default:
        navigate('/');
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpSuccess('');

    if (!suName.trim() || !suEmail.trim() || !suPassword) {
      setSignUpError('Please fill in all required fields.');
      return;
    }
    if (suPassword.length < 6) {
      setSignUpError('Password must be at least 6 characters.');
      return;
    }
    if (suPassword !== suConfirm) {
      setSignUpError('Passwords do not match.');
      return;
    }

    const res = registerAccount(suName, suEmail, suPassword, suRole);
    if (!res.success) {
      setSignUpError(res.message);
      return;
    }

    setSignUpError('');
    setSignUpSuccess(res.message);
    setSuName('');
    setSuEmail('');
    setSuPassword('');
    setSuConfirm('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">

        {/* Left Info Panel */}
        <div className="md:w-1/2 bg-slate-900 p-8 md:p-12 text-slate-350 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-lg text-white">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white m-0">TransitOps</h2>
              <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Transport Core Platform</span>
            </div>
          </div>

          <div className="my-8">
            <h3 className="text-2xl font-bold text-white mb-3 font-heading">Role-Gated Access</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Driver, Safety Officer, and Financial Analyst accounts require Fleet Manager approval before first login.
              Submit a request below, and the Fleet Manager will review and grant access.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>All access requests are logged and auditable.</span>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-slate-900 transition-colors">

          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 mb-6">
            <button
              onClick={() => { setMode('signin'); setSignUpError(''); setSignUpSuccess(''); }}
              className={`flex-1 px-3 py-2 text-xs font-semibold rounded-md transition-all ${
                mode === 'signin'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setSignInError(''); }}
              className={`flex-1 px-3 py-2 text-xs font-semibold rounded-md transition-all ${
                mode === 'signup'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Create Account
            </button>
          </div>

          {mode === 'signin' ? (
            <div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-950 dark:text-white">Welcome back</h3>
                <p className="text-xs text-slate-500 mt-1">Sign in with your registered email and password.</p>
              </div>

              {signInError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-600 dark:text-red-400 font-medium">
                  {signInError}
                </div>
              )}

              <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      required
                      onChange={(e) => { setEmail(e.target.value); setSignInError(''); }}
                      placeholder="you@transitops.com"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      required
                      onChange={(e) => { setPassword(e.target.value); setSignInError(''); }}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/25 cursor-pointer flex items-center justify-center gap-2"
                >
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-950 dark:text-white">Request Access</h3>
                <p className="text-xs text-slate-500 mt-1">
                  New Driver, Safety Officer, and Financial Analyst accounts require Fleet Manager approval before signing in.
                </p>
              </div>

              {signUpError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-600 dark:text-red-400 font-medium">
                  {signUpError}
                </div>
              )}

              {signUpSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-start gap-2">
                  <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{signUpSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={suName}
                      required
                      onChange={(e) => { setSuName(e.target.value); setSignUpError(''); }}
                      placeholder="e.g. Priyesh Kadam"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={suEmail}
                      required
                      onChange={(e) => { setSuEmail(e.target.value); setSignUpError(''); }}
                      placeholder="you@transitops.com"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        value={suPassword}
                        required
                        onChange={(e) => { setSuPassword(e.target.value); setSignUpError(''); }}
                        placeholder="Min 6 characters"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        value={suConfirm}
                        required
                        onChange={(e) => { setSuConfirm(e.target.value); setSignUpError(''); }}
                        placeholder="Re-enter password"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Requested Role</label>
                  <select
                    value={suRole}
                    onChange={(e) => setSuRole(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="Driver">Driver</option>
                    <option value="Safety Officer">Safety Officer</option>
                    <option value="Financial Analyst">Financial Analyst</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/25 cursor-pointer"
                >
                  Submit Access Request
                </button>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};