
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import GanGenerator from './pages/GanGenerator';
import GanGeneratorAdvanced from './pages/GanGeneratorAdvanced';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/auth/ProtectedRoute';
import HowItWorks from './pages/HowItWorks';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/gan-generator',
    element: <ProtectedRoute><GanGenerator /></ProtectedRoute>,
  },
  {
    path: '/advanced',
    element: <ProtectedRoute><GanGeneratorAdvanced /></ProtectedRoute>,
  },
  {
    path: '/profile',
    element: <ProtectedRoute><Profile /></ProtectedRoute>,
  },
  {
    path: '/how-it-works',
    element: <HowItWorks />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default router;
