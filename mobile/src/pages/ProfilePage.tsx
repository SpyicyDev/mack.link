import { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonAvatar,
  IonList,
  IonListHeader,
  IonNote,
  IonAlert,
  IonToast,
} from '@ionic/react';
import {
  person,
  logOut,
  settings,
  informationCircle,
  linkOutline,
  analyticsOutline,
  downloadOutline,
} from 'ionicons/icons';
import { authService, User } from '../services/auth';
import { useLinks } from '../hooks/useLinks';
import { useAnalyticsOverview } from '../hooks/useAnalytics';

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const { data: links = {} } = useLinks();
  const { data: analytics } = useAnalyticsOverview();

  useEffect(() => {
    authService.getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      // The app will automatically redirect to login due to auth state change
    } catch {
      setToastMessage('Logout failed. Please try again.');
      setShowToast(true);
    }
  };

  const totalLinks = Object.keys(links).length;
  const totalClicks = analytics?.totalClicks || 0;

  const appVersion = '1.0.0'; // This would typically come from package.json or build process
  const buildDate = new Date().toLocaleDateString(); // This would typically be set during build

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* User Info Card */}
        <IonCard>
          <IonCardContent>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <IonAvatar style={{ width: '60px', height: '60px', marginRight: '1rem' }}>
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name || user.login} />
                ) : (
                  <IonIcon icon={person} style={{ fontSize: '2rem' }} />
                )}
              </IonAvatar>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{user?.name || user?.login}</h2>
                <p style={{ margin: 0, color: 'var(--ion-color-medium)' }}>@{user?.login}</p>
                {user?.email && (
                  <p style={{ margin: 0, color: 'var(--ion-color-medium)', fontSize: '0.9rem' }}>
                    {user.email}
                  </p>
                )}
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Stats Card */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Your Stats</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="none">
              <IonIcon icon={linkOutline} slot="start" color="primary" />
              <IonLabel>
                <h3>Total Links</h3>
                <p>{totalLinks.toLocaleString()}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none">
              <IonIcon icon={analyticsOutline} slot="start" color="success" />
              <IonLabel>
                <h3>Total Clicks</h3>
                <p>{totalClicks.toLocaleString()}</p>
              </IonLabel>
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* Actions */}
        <IonList>
          <IonListHeader>
            <IonLabel>Actions</IonLabel>
          </IonListHeader>
          
          <IonItem button>
            <IonIcon icon={downloadOutline} slot="start" />
            <IonLabel>
              <h3>Export Data</h3>
              <p>Download your links and analytics</p>
            </IonLabel>
          </IonItem>

          <IonItem button>
            <IonIcon icon={settings} slot="start" />
            <IonLabel>
              <h3>Settings</h3>
              <p>App preferences and configuration</p>
            </IonLabel>
          </IonItem>

          <IonItem button>
            <IonIcon icon={informationCircle} slot="start" />
            <IonLabel>
              <h3>About</h3>
              <p>App version and information</p>
            </IonLabel>
          </IonItem>
        </IonList>

        {/* App Info */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>App Information</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="none">
              <IonLabel>
                <h3>Version</h3>
                <p>{appVersion}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>
                <h3>Build Date</h3>
                <p>{buildDate}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>
                <h3>Platform</h3>
                <p>Ionic React Mobile</p>
              </IonLabel>
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* Development Info */}
        {import.meta.env.VITE_AUTH_DISABLED === 'true' && (
          <IonCard color="warning">
            <IonCardHeader>
              <IonCardTitle>Development Mode</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>Authentication is disabled for development purposes.</p>
              <IonNote>
                API Base: {import.meta.env.VITE_API_BASE || 'Same origin'}
              </IonNote>
            </IonCardContent>
          </IonCard>
        )}

        {/* Logout Button */}
        <div className="ion-padding">
          <IonButton
            expand="block"
            color="danger"
            fill="outline"
            onClick={() => setShowLogoutAlert(true)}
          >
            <IonIcon icon={logOut} slot="start" />
            Sign Out
          </IonButton>
        </div>

        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header="Sign Out"
          message="Are you sure you want to sign out?"
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
            },
            {
              text: 'Sign Out',
              role: 'destructive',
              handler: handleLogout,
            },
          ]}
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

export default ProfilePage;