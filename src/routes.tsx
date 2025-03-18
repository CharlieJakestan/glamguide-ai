
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import GanGenerator from './pages/GanGenerator';
import GanGeneratorAdvanced from './pages/GanGeneratorAdvanced';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/auth/ProtectedRoute';

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
    path: '*',
    element: <NotFound />,
  },
]);

export default router;
