import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();

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
          console.log('Token stored in localStorage');
          
          // Small delay to ensure token is saved
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Verify the token by getting user info
          console.log('Attempting to get user info...');
          const user = await authService.getCurrentUser();
          
          if (user) {
            console.log('Authentication successful for user:', user.email);
            
            // Trigger AuthContext to refresh and recognize the authenticated user
            console.log('Refreshing auth context...');
            await refreshUser();
            console.log('Auth context refreshed');
            
            // Small delay to ensure state updates
            setTimeout(() => {
              console.log('Navigating to home page...');
              // Redirect to main app welcome page
              navigate('/', { replace: true });
            }, 300);
          } else {
            console.error('Failed to get user info after authentication - user is null');
            localStorage.removeItem('access_token');
            navigate('/login?error=user_info_failed&details=user_null');
          }
        } catch (error) {
          console.error('Error handling authentication callback:', error);
          localStorage.removeItem('access_token');
          navigate('/login?error=callback_error&details=' + encodeURIComponent(error.message || 'unknown'));
        }
      } else {
        console.error('No token received in callback');
        navigate('/login?error=no_token');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams, refreshUser]);

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}
