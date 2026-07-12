import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Truck, ShieldCheck, Phone, Key, ArrowLeft, Timer } from 'lucide-react';

const MOCK_PHONE_MAP = {
  '+91 98765 43001': { role: 'Fleet Manager', name: 'Yash Patil', email: 'manager@transitops.com' },
  '+91 98765 43210': { role: 'Driver', name: 'Alex Fernandes', email: 'driver@transitops.com' },
  '+91 98765 43003': { role: 'Safety Officer', name: 'Priya Shah', email: 'safety@transitops.com' },
  '+91 98765 43004': { role: 'Financial Analyst', name: 'Rahul Deshmukh', email: 'finance@transitops.com' }
} as const;

export const Login: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();

  // Login steps: 1 = Enter Phone, 2 = Verify OTP
  const [step, setStep] = useState<1 | 2>(1);
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  
  // Custom role selection if user registers a new custom phone number
  const [selectedRole, setSelectedRole] = useState<'Fleet Manager' | 'Driver' | 'Safety Officer' | 'Financial Analyst'>('Fleet Manager');
  const [isCustomNumber, setIsCustomNumber] = useState(false);

  const [error, setError] = useState('');
  const [smsBanner, setSmsBanner] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);

  // Auto-detect role matching pre-configured numbers
  useEffect(() => {
    const formatted = mobileNumber.trim();
    if (formatted in MOCK_PHONE_MAP) {
      setIsCustomNumber(false);
    } else if (formatted.length >= 10) {
      setIsCustomNumber(true);
    }
  }, [mobileNumber]);

  // Countdown timer for resending OTP
  useEffect(() => {
    let timer: any;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = mobileNumber.trim();
    if (!cleanNum || cleanNum.length < 10) {
      setError('Please enter a valid mobile number.');
      return;
    }

    // Generate a random 4-digit OTP
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setCountdown(30);
    setStep(2);
    setError('');

    // Simulate SMS notification banner
    setSmsBanner(`TransitOps SMS Gateway: Verification code is ${code}`);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the verification code.');
      return;
    }

    if (otp !== generatedOtp) {
      setError('Invalid code entered. Please try again.');
      return;
    }

    // Resolve credentials
    const cleanNum = mobileNumber.trim();
    let loginRole = selectedRole;
    let loginEmail = 'custom@transitops.com';

    if (cleanNum in MOCK_PHONE_MAP) {
      const match = MOCK_PHONE_MAP[cleanNum as keyof typeof MOCK_PHONE_MAP];
      loginRole = match.role;
      loginEmail = match.email;
    }

    login(loginEmail, loginRole);

    // Redirect to respective initial view
    if (loginRole === 'Driver') {
      navigate('/trips');
    } else if (loginRole === 'Safety Officer') {
      navigate('/drivers');
    } else if (loginRole === 'Financial Analyst') {
      navigate('/reports');
    } else {
      navigate('/');
    }
  };

  const triggerQuickLogin = (phone: string) => {
    setMobileNumber(phone);
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setCountdown(30);
    setStep(2);
    setError('');
    setSmsBanner(`TransitOps SMS Gateway: Verification code is ${code}`);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row relative">
        
        {/* Mock SMS Banner Alert */}
        {smsBanner && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-slate-900/95 border border-slate-700/80 text-white p-3.5 rounded-xl shadow-2xl z-50 flex items-start gap-3 backdrop-blur-sm animate-bounce">
            <Phone className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">💬 Text Message</span>
              <p className="text-xs text-slate-100 font-medium mt-0.5">{smsBanner}</p>
            </div>
            <button onClick={() => setSmsBanner(null)} className="text-slate-400 hover:text-white text-xs font-bold leading-none px-1">✕</button>
          </div>
        )}

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
            <h3 className="text-2xl font-bold text-white mb-3 font-heading">Smart Operations Center</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Digitizing vehicle dispatch, driver management, expense reporting, predictive maintenance, and real-time ROI auditing with simulated mobile SMS authentication.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Enforcing active business rules and compliance logs.</span>
          </div>
        </div>

        {/* Right Side Credentials/Form */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-slate-900 transition-colors">
          {step === 1 ? (
            /* STEP 1: Phone Entry */
            <div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-950 dark:text-white">OTP Verification</h3>
                <p className="text-xs text-slate-500 mt-1">Enter your registered mobile number to receive a verification code.</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-600 dark:text-red-400 font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={mobileNumber}
                      required
                      onChange={(e) => { setMobileNumber(e.target.value); setError(''); }}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                {isCustomNumber && (
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 border border-slate-200 dark:border-slate-800 rounded-lg animate-fade-in">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Assign Custom Account Role
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded px-2.5 py-1.5 text-xs focus:outline-none"
                    >
                      <option value="Fleet Manager">Fleet Manager (Full Access)</option>
                      <option value="Driver">Driver (Trips & Expenses)</option>
                      <option value="Safety Officer">Safety Officer (License Monitor)</option>
                      <option value="Financial Analyst">Financial Analyst (Costs & reports)</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/25 cursor-pointer"
                >
                  Send Verification Code
                </button>
              </form>

              {/* Quick Demo Switch Section */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3 text-center">
                  Quick OTP Switches (Demo Mode)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => triggerQuickLogin('+91 98765 43001')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-[11px] font-semibold rounded-lg text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    Fleet Manager
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerQuickLogin('+91 98765 43210')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-[11px] font-semibold rounded-lg text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    Driver
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerQuickLogin('+91 98765 43003')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-[11px] font-semibold rounded-lg text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    Safety Officer
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerQuickLogin('+91 98765 43004')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-[11px] font-semibold rounded-lg text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    Financial Analyst
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: OTP Verification */
            <div>
              <button
                onClick={() => { setStep(1); setOtp(''); setError(''); }}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-6 font-semibold"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Change mobile number
              </button>

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-950 dark:text-white">Verify SMS Code</h3>
                <p className="text-xs text-slate-500 mt-1">We sent a 4-digit code to <strong className="text-slate-800 dark:text-slate-350">{mobileNumber}</strong></p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-600 dark:text-red-400 font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Enter Code
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      maxLength={4}
                      value={otp}
                      required
                      onChange={(e) => { setOtp(e.target.value); setError(''); }}
                      placeholder="e.g. 4829"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg pl-10 pr-4 py-2.5 text-sm tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/25 cursor-pointer"
                >
                  Verify & Sign In
                </button>
              </form>

              {/* Timer or Resend Option */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Timer className="h-4 w-4" />
                {countdown > 0 ? (
                  <span>Resend code in {countdown} seconds</span>
                ) : (
                  <button
                    onClick={handleSendOtp}
                    className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};
