import { useState, useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { link, analytics, person } from 'ionicons/icons';
import LinksPage from './pages/LinksPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import { QueryProvider } from './providers/QueryProvider';
import { authService } from './services/auth';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  useEffect(() => {
    // Initialize auth and listen for changes
    authService.getCurrentUser().then(() => {
      setIsAuthenticated(authService.isAuthenticated());
    }).catch(() => {
      setIsAuthenticated(false);
    });

    const handleAuthChange = () => {
      setIsAuthenticated(authService.isAuthenticated());
    };

    window.addEventListener('auth:change', handleAuthChange);
    return () => window.removeEventListener('auth:change', handleAuthChange);
  }, []);

  if (!isAuthenticated) {
    return (
      <QueryProvider>
        <IonApp>
          <LoginPage />
        </IonApp>
      </QueryProvider>
    );
  }

  return (
    <QueryProvider>
      <IonApp>
        <IonReactRouter>
          <IonTabs>
            <IonRouterOutlet>
              <Route exact path="/links">
                <LinksPage />
              </Route>
              <Route exact path="/analytics">
                <AnalyticsPage />
              </Route>
              <Route path="/profile">
                <ProfilePage />
              </Route>
              <Route exact path="/">
                <Redirect to="/links" />
              </Route>
            </IonRouterOutlet>
            <IonTabBar slot="bottom">
              <IonTabButton tab="links" href="/links">
                <IonIcon aria-hidden="true" icon={link} />
                <IonLabel>Links</IonLabel>
              </IonTabButton>
              <IonTabButton tab="analytics" href="/analytics">
                <IonIcon aria-hidden="true" icon={analytics} />
                <IonLabel>Analytics</IonLabel>
              </IonTabButton>
              <IonTabButton tab="profile" href="/profile">
                <IonIcon aria-hidden="true" icon={person} />
                <IonLabel>Profile</IonLabel>
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        </IonReactRouter>
      </IonApp>
    </QueryProvider>
  );
};

export default App;
