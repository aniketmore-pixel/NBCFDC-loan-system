// src/App.jsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import LoanApproval from "./pages/LoanApproval.jsx";
import Beneficiaries from "./pages/Beneficiaries.jsx";
import LoanTracking from "./pages/LoanTracking.jsx";
import Reports from "./pages/Reports.jsx";
import NotFound from "./pages/NotFound.jsx";
import ApproveRejectLoan from "./pages/ApproveRejectLoan.jsx";
import UploadData from "./pages/UploadData.jsx";


const queryClient = new QueryClient();

const AUTH_KEY = "nbcfdc_admin_auth";

// Simple Protected Route wrapper
const RequireAuth = ({ children }) => {
  const isAuthenticated = localStorage.getItem(AUTH_KEY) === "true";

  if (!isAuthenticated) {
    // Not logged in → redirect to login
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/" element={<Login />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/loan-approval"
            element={
              <RequireAuth>
                <LoanApproval />
              </RequireAuth>
            }
          />
          <Route
            path="/approve-reject-Loan"
            element={
              <RequireAuth>
                <ApproveRejectLoan />
              </RequireAuth>
            }
          />
          <Route
            path="/beneficiaries"
            element={
              <RequireAuth>
                <Beneficiaries />
              </RequireAuth>
            }
          />
          <Route
            path="/loan-tracking"
            element={
              <RequireAuth>
                <LoanTracking />
              </RequireAuth>
            }
          />
          <Route
            path="/upload-data"
            element={
              <RequireAuth>
                <UploadData />
              </RequireAuth>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
