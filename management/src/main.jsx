import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthCallback } from './components/AuthCallback.jsx'
import { LoginScreen } from './components/LoginScreen.jsx'
import { authService } from './services/auth.js'
import { QueryProvider } from './providers/QueryProvider.jsx'

import { ThemeProvider } from './providers/ThemeProvider.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/login',
    element: <LoginScreen />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallback onAuthSuccess={() => { if (authService.isAuthenticated()) window.location.replace('/') }} />,
  },
])

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<QueryProvider>
			<ThemeProvider>
				<RouterProvider router={router} />
			</ThemeProvider>
		</QueryProvider>
	</StrictMode>,
)
