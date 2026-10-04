import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AnalysisPage } from '@/pages/analysis'
import { HomePage } from '@/pages/home'
import { FamilyPage } from '@/pages/households/family-page'
import {
  CaptureInvitationPage,
  HouseholdJoinPage,
} from '@/pages/households/household-pages'
import { LoginPage } from '@/pages/login'
import { AppNotFoundPage, PublicNotFoundPage } from '@/pages/not-found'
import {
  AccountSettingsPage,
  AppearanceSettingsPage,
  BudgetSettingsPage,
  CategorySettingsPage,
  CsvImportPage,
  HouseholdSettingsPage,
  PaymentSettingsPage,
  RecurringTransactionSettingsPage,
  SettingsPage,
} from '@/pages/settings'
import {
  EditTransactionPage,
  NewTransactionPage,
  TransactionsPage,
} from '@/pages/transactions'

import { AppShell } from '../layouts/app-shell'
import { FamilyShell } from '../layouts/family-shell'
import { ProtectedRoute, RootRedirect } from './auth-routes'
import { RouteErrorPage } from './route-error-page'

export const router = createBrowserRouter([
  { path: '/family/join', element: <CaptureInvitationPage /> },
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
        path: '/app/family',
        element: <FamilyShell />,
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <FamilyPage /> },
          { path: 'transactions', element: <FamilyPage transactions /> },
          { path: 'analysis', element: <FamilyPage analysis /> },
          { path: 'sharing', element: <FamilyPage sharing /> },
          { path: 'new', element: <NewTransactionPage /> },
          {
            path: 'transactions/:transactionId/edit',
            element: <EditTransactionPage />,
          },
          { path: 'join', element: <HouseholdJoinPage /> },
        ],
      },
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
          { path: 'settings/family', element: <HouseholdSettingsPage /> },
          { path: 'settings/account', element: <AccountSettingsPage /> },
          { path: 'settings/budget', element: <BudgetSettingsPage /> },
          { path: 'settings/categories', element: <CategorySettingsPage /> },
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
