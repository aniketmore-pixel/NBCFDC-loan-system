// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Routes, Route } from "react-router-dom";

// import Landing from "./pages/Landing";
// import Signup from "./pages/Signup";
// import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";
// import Home from "./pages/dashboard/Home";
// import Profile from "./pages/dashboard/Profile";
// import LoanEligibility from "./pages/dashboard/LoanEligibility";
// import Benefits from "./pages/dashboard/Benefits";
// import TrackApplication from "./pages/dashboard/TrackApplication";
// import NotFound from "./pages/NotFound";

// const queryClient = new QueryClient();

// const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <TooltipProvider>
//       <Toaster />
//       <Sonner />
//       <BrowserRouter>
//         <Routes>
//           <Route path="/" element={<Landing />} />
//           <Route path="/signup" element={<Signup />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/dashboard" element={<Dashboard />}>
//             <Route index element={<Home />} />
//             <Route path="profile" element={<Profile />} />
//             <Route path="eligibility" element={<LoanEligibility />} />
//             <Route path="benefits" element={<Benefits />} />
//             <Route path="track" element={<TrackApplication />} />
//           </Route>
//           <Route path="*" element={<NotFound />} />
//         </Routes>
//       </BrowserRouter>
//     </TooltipProvider>
//   </QueryClientProvider>
// );

// export default App;


// App.jsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/dashboard/Home";
import Profile from "./pages/dashboard/Profile";
import LoanEligibility from "./pages/dashboard/LoanEligibility";
import Benefits from "./pages/dashboard/Benefits";
import TrackApplication from "./pages/dashboard/TrackApplication";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoutes"; // <- import your wrapper
import ApplyLoan from "./pages/ApplyLoan";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

// Create an Axios instance that automatically sends the token
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5010/api",
});

// Add a request interceptor to send Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protect all dashboard routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="profile" element={<Profile />} />
            <Route path="eligibility" element={<LoanEligibility />} />
            <Route path="benefits" element={<Benefits />} />
            <Route path="track" element={<TrackApplication />} />
            <Route path="apply" element={<ApplyLoan />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
