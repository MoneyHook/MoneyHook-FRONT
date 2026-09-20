import { lazy } from 'react'

export const HomePage = lazy(() =>
  import('@/pages/home/home-page').then((module) => ({
    default: module.HomePage,
  })),
)

export const AnalysisPage = lazy(() =>
  import('@/pages/analysis/analysis-page').then((module) => ({
    default: module.AnalysisPage,
  })),
)

export const TransactionsPage = lazy(() =>
  import('@/pages/transactions/transactions-page').then((module) => ({
    default: module.TransactionsPage,
  })),
)

export const NewTransactionPage = lazy(() =>
  import('@/pages/transactions/new-transaction-page').then((module) => ({
    default: module.NewTransactionPage,
  })),
)

export const EditTransactionPage = lazy(() =>
  import('@/pages/transactions/edit-transaction-page').then((module) => ({
    default: module.EditTransactionPage,
  })),
)

export const CsvImportPage = lazy(() =>
  import('@/pages/settings/csv-import-page').then((module) => ({
    default: module.CsvImportPage,
  })),
)

export const LoginPage = lazy(() =>
  import('@/pages/login/login-page').then((module) => ({
    default: module.LoginPage,
  })),
)

export const SettingsPage = lazy(() =>
  import('@/pages/settings/settings-page').then((module) => ({
    default: module.SettingsPage,
  })),
)

export const AccountSettingsPage = lazy(() =>
  import('@/pages/settings/settings-page').then((module) => ({
    default: module.AccountSettingsPage,
  })),
)

export const AppearanceSettingsPage = lazy(() =>
  import('@/pages/settings/settings-page').then((module) => ({
    default: module.AppearanceSettingsPage,
  })),
)

export const BudgetSettingsPage = lazy(() =>
  import('@/pages/settings/settings-page').then((module) => ({
    default: module.BudgetSettingsPage,
  })),
)

export const PaymentSettingsPage = lazy(() =>
  import('@/pages/settings/settings-page').then((module) => ({
    default: module.PaymentSettingsPage,
  })),
)

export const RecurringTransactionSettingsPage = lazy(() =>
  import('@/pages/settings/settings-page').then((module) => ({
    default: module.RecurringTransactionSettingsPage,
  })),
)
