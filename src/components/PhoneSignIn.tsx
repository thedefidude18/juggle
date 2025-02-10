import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const PhoneSignIn: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('otp');
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle OTP verification here
    console.log('OTP:', otp.join(''));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#242538] rounded-2xl w-full max-w-md p-6">
        {step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit}>
            <h2 className="text-2xl font-bold text-white mb-6">Enter your phone number</h2>
            <div className="mb-6">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-[#1a1b2e] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
                placeholder="+234 800 000 0000"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl font-medium bg-[#1a1b2e] text-white hover:bg-[#2f3049] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 rounded-xl font-medium bg-[#CCFF00] text-black hover:bg-[#b3ff00] transition-colors"
              >
                Continue
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit}>
            <h2 className="text-2xl font-bold text-white mb-2">Enter verification code</h2>
            <p className="text-gray-400 mb-6">
              We've sent a code to {phoneNumber}
            </p>
            <div className="grid grid-cols-6 gap-2 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className="w-full aspect-square bg-[#1a1b2e] text-white text-center text-xl font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
                />
              ))}
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium bg-[#CCFF00] text-black hover:bg-[#b3ff00] transition-colors"
            >
              Verify
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="w-full mt-3 px-4 py-3 rounded-xl font-medium text-[#CCFF00] hover:bg-[#1a1b2e] transition-colors"
            >
              Resend Code
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PhoneSignIn;