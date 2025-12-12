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
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-gray-900">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/background.jpg')",
          filter: 'brightness(0.3)'
        }}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8 text-white text-center">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/images/logo.png" 
              alt="Logo" 
              className="h-20 w-20 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="bg-white bg-opacity-20 w-20 h-20 rounded-full items-center justify-center hidden">
              <Lock size={40} />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">SUMBER JAYA GRUP</h1>
          <p className="text-gray-300">Sistem Sumber Jaya Grup Official</p>
        </div>
        
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Login</h2>
          
          {loginError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              <span className="text-sm">{loginError}</span>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan username"
                onKeyPress={(e) => e.key === 'Enter' && onLogin()}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan password"
                  onKeyPress={(e) => e.key === 'Enter' && onLogin()}
                />
                <button
                  type="button"
                  onClick={() => onShowPasswordToggle(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              className={`w-full py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl ${
                isLoggingIn 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-700 hover:to-blue-900'
              }`}
            >
              {isLoggingIn ? 'Loading...' : 'Login'}
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-[10px] text-gray-600 text-center">
              © 2025 Sumber Jaya Grup Official | Powered by Rigeel One Click
            </p>
            <p className="text-[10px] text-gray-500 text-center mt-1">
              Version {APP_VERSION}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
