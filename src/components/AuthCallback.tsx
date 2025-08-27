import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '@/lib/auth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        console.error('Authentication error:', error);
        navigate('/login?error=' + error);
        return;
      }

      if (token) {
        try {
          // Store the token in localStorage
          localStorage.setItem('access_token', token);
          
          // Verify the token by getting user info
          const user = await authService.getCurrentUser();
          
          if (user) {
            console.log('Authentication successful for user:', user.email);
            // Redirect to main app
            navigate('/');
          } else {
            console.error('Failed to get user info after authentication');
            navigate('/login?error=user_info_failed');
          }
        } catch (error) {
          console.error('Error handling authentication callback:', error);
          localStorage.removeItem('access_token');
          navigate('/login?error=callback_error');
        }
      } else {
        console.error('No token received in callback');
        navigate('/login?error=no_token');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}
