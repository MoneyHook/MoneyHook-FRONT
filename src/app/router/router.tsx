import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AnalysisPage } from '@/pages/analysis'
import { HomePage } from '@/pages/home'
import { LoginPage } from '@/pages/login'
import { AppNotFoundPage, PublicNotFoundPage } from '@/pages/not-found'
import { SettingsPage } from '@/pages/settings'
import { NewTransactionPage, TransactionsPage } from '@/pages/transactions'

import { AppShell } from '../layouts/app-shell'
import { ProtectedRoute, RootRedirect } from './auth-routes'
import { RouteErrorPage } from './route-error-page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/app',
        element: <AppShell />,
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <Navigate replace to="home" /> },
          { path: 'home', element: <HomePage /> },
          { path: 'transactions', element: <TransactionsPage /> },
          { path: 'transactions/new', element: <NewTransactionPage /> },
          { path: 'analysis', element: <AnalysisPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: '*', element: <AppNotFoundPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <PublicNotFoundPage />,
  },
])
