import { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonLoading,
  IonToast,
} from '@ionic/react';
import { logoGithub, linkOutline } from 'ionicons/icons';
import { authService } from '../services/auth';

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Check if dev auth is enabled
      if (import.meta.env.VITE_AUTH_DISABLED === 'true') {
        await authService.devLogin();
      } else {
        // Redirect to GitHub OAuth
        window.location.href = authService.getAuthUrl();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setToastMessage(errorMessage);
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mack.link Mobile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          textAlign: 'center'
        }}>
          <IonIcon 
            icon={linkOutline} 
            style={{ fontSize: '4rem', marginBottom: '2rem', color: 'var(--ion-color-primary)' }}
          />
          
          <IonCard style={{ width: '100%', maxWidth: '400px' }}>
            <IonCardHeader>
              <IonCardTitle>Welcome to Mack.link</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p style={{ marginBottom: '2rem' }}>
                Manage your short links and view analytics on the go.
              </p>
              
              <IonButton
                expand="block"
                onClick={handleLogin}
                disabled={isLoading}
              >
                <IonIcon icon={logoGithub} slot="start" />
                Sign in with GitHub
              </IonButton>
              
              {import.meta.env.VITE_AUTH_DISABLED === 'true' && (
                <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--ion-color-medium)' }}>
                  Development mode: Authentication is disabled
                </p>
              )}
            </IonCardContent>
          </IonCard>
        </div>

        <IonLoading
          isOpen={isLoading}
          message="Signing you in..."
        />

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={3000}
          onDidDismiss={() => setShowToast(false)}
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;