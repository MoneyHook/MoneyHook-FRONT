import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppNotFoundPage, PublicNotFoundPage } from '@/pages/not-found'

import { AppShell } from '../layouts/app-shell'
import { ProtectedRoute, RootRedirect } from './auth-routes'
import {
  AccountSettingsPage,
  AnalysisPage,
  AppearanceSettingsPage,
  BudgetSettingsPage,
  CsvImportPage,
  EditTransactionPage,
  HomePage,
  LoginPage,
  NewTransactionPage,
  PaymentSettingsPage,
  RecurringTransactionSettingsPage,
  SettingsPage,
  TransactionsPage,
} from './lazy-pages'
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
          { path: 'transactions/import', element: <CsvImportPage /> },
          {
            path: 'transactions/:transactionId/edit',
            element: <EditTransactionPage />,
          },
          { path: 'analysis', element: <AnalysisPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'settings/account', element: <AccountSettingsPage /> },
          { path: 'settings/budget', element: <BudgetSettingsPage /> },
          {
            path: 'settings/import',
            element: <Navigate replace to="/app/transactions/import" />,
          },
          { path: 'settings/payments', element: <PaymentSettingsPage /> },
          {
            path: 'settings/recurring-transactions',
            element: <RecurringTransactionSettingsPage />,
          },
          { path: 'settings/appearance', element: <AppearanceSettingsPage /> },
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
