import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Github, Mail, Lock, ArrowRight, Brain, Chrome } from 'lucide-react';

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export const Login = ({ onLogin }: { onLogin: (token: string) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 
          username: email,
          password: password 
        }),
        credentials: 'include', // Important for cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data: LoginResponse = await response.json();

      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        onLogin(data.access_token);
        navigate('/dashboard');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    }
  };

  const handleOAuthLogin = (provider: 'google' | 'github') => {
    try {
      // Store the current URL to redirect back after login
      localStorage.setItem('preLoginPath', window.location.pathname);
      
      // Use absolute URL to prevent any path resolution issues
      const apiBaseUrl = 'http://localhost:8000';
      window.location.href = `${apiBaseUrl}/api/auth/${provider}/login`;
    } catch (err) {
      setError(`Failed to initiate ${provider} login`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#17252A] via-[#2B7A78] to-[#17252A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-[#3AAFA9]/20">
          <div className="flex items-center justify-center mb-8">
            <Brain className="w-10 h-10 text-[#3AAFA9]" />
            <span className="text-2xl font-bold bg-gradient-to-r from-[#3AAFA9] to-[#DEF2F1] bg-clip-text text-transparent ml-2">
              FlowMind AI
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-6 text-center">Welcome back</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* OAuth2 Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuthLogin('google')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
            >
              <Chrome className="w-5 h-5" />
              Sign in with Google
            </button>

            <button
              onClick={() => handleOAuthLogin('github')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
            >
              <Github className="w-5 h-5" />
              Sign in with GitHub
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#3AAFA9]/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#17252A] text-[#DEF2F1]">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#DEF2F1] mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#DEF2F1]/70" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-[#3AAFA9]/30 rounded-lg py-2 pl-10 pr-4 text-black placeholder-[#DEF2F1]/50 focus:outline-none focus:ring-2 focus:ring-[#3AAFA9] focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#DEF2F1] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#DEF2F1]/70" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-[#3AAFA9]/30 rounded-lg py-2 pl-10 pr-4 text-black placeholder-[#DEF2F1]/50 focus:outline-none focus:ring-2 focus:ring-[#3AAFA9] focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#3AAFA9]/30 text-[#3AAFA9] focus:ring-[#3AAFA9]"
                />
                <label className="ml-2 block text-sm text-[#DEF2F1]">
                  Remember me
                </label>
              </div>
              <a href="#" className="text-sm text-[#3AAFA9] hover:text-[#DEF2F1]">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-[#2B7A78] to-[#3AAFA9] rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
            >
              Sign in
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#DEF2F1]/70">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#3AAFA9] hover:text-[#DEF2F1] font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};