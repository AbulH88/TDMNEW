import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// our pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ApiCall from "./pages/ApiCall";
import ServiceCall from "./pages/ServiceCall";
import HelpWidget from "./components/HelpWidget";
import Tests from "./pages/Tests";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import UserManual from "./pages/UserManual";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

// create a client for react-query
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <ServiceCall />
                </ProtectedRoute>
              } />
              <Route path="/service-call" element={
                <ProtectedRoute permission="read:services">
                  <ServiceCall />
                </ProtectedRoute>
              } />
              <Route path="/api-call" element={
                <ProtectedRoute permission="read:services">
                  <ApiCall />
                </ProtectedRoute>
              } />
              <Route path="/generator" element={
                <ProtectedRoute permission="read:generator">
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/tests" element={
                <ProtectedRoute permission="read:tests">
                  <Tests />
                </ProtectedRoute>
              } />
              <Route path="/manual" element={
                <ProtectedRoute>
                  <UserManual />
                </ProtectedRoute>
              } />

              {/* Admin only route */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              } />

              <Route path="*" element={<NotFound />} />
            </Routes>
            <HelpWidget />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;