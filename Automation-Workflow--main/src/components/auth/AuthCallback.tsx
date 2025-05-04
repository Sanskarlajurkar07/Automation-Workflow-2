import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState({
    isLoading: true,
    error: null as string | null,
    success: false
  });

  useEffect(() => {
    const handleCallback = () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const error = params.get('error');

      if (error) {
        setStatus({
          isLoading: false,
          error: decodeURIComponent(error),
          success: false
        });
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!token) {
        setStatus({
          isLoading: false,
          error: 'No authentication token received',
          success: false
        });
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        login(token);
        setStatus({
          isLoading: false,
          error: null,
          success: true
        });
        setTimeout(() => navigate('/dashboard'), 1500);
      } catch (err) {
        setStatus({
          isLoading: false,
          error: 'Failed to process authentication',
          success: false
        });
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [navigate, login]);

  if (status.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#17252A] via-[#2B7A78] to-[#17252A] flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-[#3AAFA9]/20">
          <div className="text-center">
            <Brain className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 font-medium">Authentication failed</p>
            <p className="text-sm mt-2 text-red-400/80">{status.error}</p>
            <p className="text-sm text-[#DEF2F1]/80 mt-4">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#17252A] via-[#2B7A78] to-[#17252A] flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-[#3AAFA9]/20">
        <div className="flex flex-col items-center space-y-4">
          <Brain className={`w-10 h-10 ${status.success ? 'text-green-400' : 'text-[#3AAFA9] animate-pulse'}`} />
          <p className="text-white text-center">
            {status.isLoading ? (
              "Processing authentication..."
            ) : status.success ? (
              "Authentication successful! Redirecting..."
            ) : (
              "Finalizing your session..."
            )}
          </p>
        </div>
      </div>
    </div>
  );
};