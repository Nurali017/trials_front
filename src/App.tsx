import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import ErrorBoundary from './components/common/ErrorBoundary';
import RouteErrorBoundary from './components/common/RouteErrorBoundary';
import { Login } from './pages/Auth/Login';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { ApplicationsList } from './pages/Applications/ApplicationsList';
import { ApplicationDetail } from './pages/Applications/ApplicationDetail';
import { ApplicationCreate } from './pages/Applications/ApplicationCreate';
import { TrialDetail } from './pages/Trials/TrialDetail';
import { TrialsList } from './pages/Trials/TrialsList';
import { MyTasks } from './pages/Trials/MyTasks';
import { Form008 } from './pages/Trials/Form008';
import { ResultsEntry } from './pages/Results/ResultsEntry';
import { MethodologyContainer, MethodologyTest } from './pages/Methodology';
import { DictionariesMain } from './pages/Dictionaries/DictionariesMain';
import { CultureGroupsPage } from './pages/Dictionaries/CultureGroupsPage';
import { CulturesPage } from './pages/Dictionaries/CulturesPage';
import { RegionsPage } from './pages/Dictionaries/RegionsPage';
import { OblastsPage } from './pages/Dictionaries/OblastsPage';
import { IndicatorsPage } from './pages/Dictionaries/IndicatorsPage';
import { OriginatorsPage } from './pages/Dictionaries/OriginatorsPage';
import { SortsList } from './pages/SortRecords/SortsList';
import { TrialPlansList } from './pages/TrialPlans';
import TrialPlanDetail from './pages/TrialPlans/TrialPlanDetail';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#9c27b0',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// Placeholder components
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ padding: 24 }}>
    <h2>{title}</h2>
    <p>This page is under development.</p>
  </div>
);

function App() {
  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            autoHideDuration={3000}
          >
            <BrowserRouter>
              <AuthProvider>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />

                  {/* Protected Routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <MainLayout />
                      </ProtectedRoute>
                    }
                    errorElement={<RouteErrorBoundary />}
                  >
                    <Route index element={<Dashboard />} />

                    {/* Applications */}
                    <Route path="applications">
                      <Route index element={<ApplicationsList />} />
                      <Route path=":id" element={<ApplicationDetail />} />
                      <Route path="create" element={<ApplicationCreate />} />
                    </Route>

                    {/* Trials */}
                    <Route path="trials">
                      <Route index element={<TrialsList />} />
                      <Route path="my-tasks" element={<MyTasks />} />
                      <Route path=":id" element={<TrialDetail />} />
                      <Route path=":id/form008" element={<Form008 />} />
                      <Route path=":id/results/add" element={<ResultsEntry />} />
                    </Route>

                    {/* Methodology Table */}
                    <Route path="methodology">
                      <Route index element={<MethodologyContainer />} />
                      <Route path="test" element={<MethodologyTest />} />
                    </Route>

                    {/* Results */}
                    <Route path="results">
                      <Route
                        index
                        element={<PlaceholderPage title="Результаты измерений" />}
                      />
                    </Route>

                    {/* Sort Records */}
                    <Route path="sort-records">
                      <Route index element={<SortsList />} />
                    </Route>

                    {/* Trial Plans */}
                    <Route path="trial-plans">
                      <Route index element={<TrialPlansList />} />
                      <Route path=":id" element={<TrialPlanDetail />} />
                    </Route>

                    {/* Dictionaries */}
                    <Route path="dictionaries">
                      <Route index element={<DictionariesMain />} />
                      <Route path="culture-groups" element={<CultureGroupsPage />} />
                      <Route path="cultures" element={<CulturesPage />} />
                      <Route path="regions" element={<RegionsPage />} />
                      <Route path="oblasts" element={<OblastsPage />} />
                      <Route path="indicators" element={<IndicatorsPage />} />
                      <Route path="originators" element={<OriginatorsPage />} />
                    </Route>

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </AuthProvider>
            </BrowserRouter>
          </SnackbarProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
