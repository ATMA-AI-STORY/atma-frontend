import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const processingRef = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (processingRef.current) return;
    processingRef.current = true;

    const handleAuthCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      console.log('🔍 AuthCallback: Processing auth with token:', !!token, 'error:', error);

      if (error) {
        navigate('/login?error=' + error, { replace: true });
        return;
      }

      if (token) {
        try {
          // Store token and get user info
          localStorage.setItem('access_token', token);
          const user = await authService.getCurrentUser();
          
          if (user) {
            console.log('✅ AuthCallback: User authenticated successfully');
            await refreshUser();
            navigate('/', { replace: true });
          } else {
            console.error('❌ AuthCallback: No user data returned');
            localStorage.removeItem('access_token');
            navigate('/login?error=user_info_failed', { replace: true });
          }
        } catch (error) {
          console.error('💥 AuthCallback: Authentication error:', error);
          localStorage.removeItem('access_token');
          navigate('/login?error=callback_error', { replace: true });
        }
      } else {
        console.error('❌ AuthCallback: No token in callback');
        navigate('/login?error=no_token', { replace: true });
      }
    };

    handleAuthCallback();
  }, []); // Remove dependencies to prevent re-execution

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}
