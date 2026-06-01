import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import About from './pages/About';
import { Login, Signup } from './pages/Auth';
import Dashboard from './pages/Dashboard';
import InteractiveExploration from './pages/InteractiveExploration';
import SignIn from './pages/SignIn';

const CLIENT_ID = '1028088959211-ugnllf0slr936ndeg3ml6c3rcq8r1018.apps.googleusercontent.com';

/* Routes where the Navbar is hidden (full-screen auth pages) */
const NO_NAVBAR_ROUTES = ['/login', '/signup', '/signin'];

/* Guard: redirect logged-in users away from auth pages */
function GuestRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <Navigate to="/" replace /> : children;
}

function AnimatedRoutes() {
  const location = useLocation();
  const hideNav = NO_NAVBAR_ROUTES.includes(location.pathname);

  return (
    <>
      {!hideNav && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"             element={<Home />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/about"        element={<About />} />
          <Route path="/login"        element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/signup"       element={<GuestRoute><Signup /></GuestRoute>} />
          <Route path="/signin"       element={<GuestRoute><SignIn /></GuestRoute>} />
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/interactive"  element={<InteractiveExploration />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
