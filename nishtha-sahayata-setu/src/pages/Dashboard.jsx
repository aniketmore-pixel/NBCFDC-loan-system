import { Outlet, Navigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { HelpChatbot } from "@/components/HelpChatbot";

// ProtectedRoute Component
const ProtectedRoute = ({ children }) => {
  // Check if token exists in localStorage
  const token = localStorage.getItem("token");

  if (!token) {
    // Redirect to login if no token
    return <Navigate to="/login" replace />;
  }

  // Optionally, you can also decode and verify JWT expiry here using jwt-decode
  return children;
};

const Dashboard = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <SidebarProvider>
          <div className="flex w-full flex-1">
            <DashboardSidebar />
            <main className="flex-1 overflow-auto">
              <Outlet />
            </main>
          </div>
        </SidebarProvider>
        <HelpChatbot />
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
