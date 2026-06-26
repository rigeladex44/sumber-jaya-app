/**
 * Login Form Component
 * Handles user authentication UI
 */
import React from 'react';
import { Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { APP_VERSION } from '../../utils/constants';

const LoginForm = ({
  username,
  password,
  showPassword,
  loginError,
  isLoggingIn,
  onUsernameChange,
  onPasswordChange,
  onShowPasswordToggle,
  onLogin
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative bg-gray-900 overflow-hidden">
      {/* Background with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
        style={{
          backgroundImage: "url('/images/background.png')"
        }}
      />
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"></div>
      
      {/* Abstract blur blobs for premium feel */}
      <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-blue-500/30 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 rounded-full bg-purple-500/30 blur-3xl pointer-events-none"></div>

      {/* Glassmorphism Form Card */}
      <div className="relative bg-white/40 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] w-full max-w-[420px] overflow-hidden z-10">
        <div className="p-8 md:p-10">
          
          {/* Logo inside the card */}
          <div className="flex flex-col items-center justify-center mb-8">
            <img 
              src="/images/logo.png" 
              alt="Logo" 
              className="object-contain drop-shadow-lg transform hover:scale-105 transition-transform duration-500"
              style={{ width: '100%', maxWidth: '300px', height: 'auto' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="bg-white/20 backdrop-blur-xl rounded-2xl items-center justify-center hidden border border-white/30 shadow-2xl w-full max-w-[300px] h-[100px]">
              <Lock size={50} className="text-white drop-shadow-md" />
            </div>
          </div>

          <div className="text-center mb-8 hidden">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Selamat Datang</h2>
            <p className="text-sm font-medium text-gray-700">Silakan login untuk masuk ke dashboard</p>
          </div>
          
          {loginError && (
            <div className="mb-6 p-4 bg-red-50/90 backdrop-blur-sm border border-red-200/50 rounded-xl flex items-start gap-3 text-red-700 shadow-sm animate-bounce-short">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span className="text-sm font-medium leading-relaxed">{loginError}</span>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2 tracking-wide">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                className="w-full px-5 py-3.5 border border-white/60 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500/50 bg-white/60 backdrop-blur-sm shadow-inner transition-all text-gray-800 font-medium placeholder-gray-500"
                placeholder="Masukkan username"
                onKeyPress={(e) => e.key === 'Enter' && onLogin()}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2 tracking-wide">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  className="w-full px-5 py-3.5 pr-14 border border-white/60 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500/50 bg-white/60 backdrop-blur-sm shadow-inner transition-all text-gray-800 font-medium placeholder-gray-500"
                  placeholder="Masukkan password"
                  onKeyPress={(e) => e.key === 'Enter' && onLogin()}
                />
                <button
                  type="button"
                  onClick={() => onShowPasswordToggle(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 focus:outline-none transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              className={`w-full py-4 mt-2 rounded-xl font-bold tracking-wide transition-all duration-300 transform active:scale-[0.98] ${
                isLoggingIn 
                  ? 'bg-gray-400/80 text-gray-200 cursor-not-allowed shadow-none' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_8px_25px_rgba(37,99,235,0.4)] hover:-translate-y-0.5'
              }`}
            >
              {isLoggingIn ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Memproses...</span>
                </div>
              ) : 'Login Dashboard'}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-400/20">
            <div className="flex flex-col items-center justify-center gap-1.5">
              <p className="text-[11px] font-medium text-gray-700 text-center tracking-wide">
                © 2025 Sumber Jaya Grup Official
              </p>
              <div className="flex items-center justify-center gap-2 text-[10px] text-gray-600 font-medium">
                <span>Powered by Rigeel One Click</span>
                <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                <span>v{APP_VERSION}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
