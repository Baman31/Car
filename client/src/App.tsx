import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Dashboard from "@/pages/dashboard";
import Courses from "@/pages/courses";
import CourseDetail from "@/pages/course-detail";
import TestResults from "@/pages/test-results";
import Admin from "@/pages/admin";
import VideoPlayer from "@/pages/video-player";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth-page";
import EmailVerification from "@/pages/email-verification";
import AccountSetup from "@/pages/AccountSetup";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

function Router() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const { toast } = useToast();

  // Handle Google OAuth token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const authSuccess = urlParams.get('auth_success');
    
    if (token && authSuccess) {
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Show success message
      toast({
        title: "Login successful",
        description: "Welcome! You have been logged in with Google.",
      });
      
      // Refresh the page to update authentication state
      window.location.reload();
    }
  }, [toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/verify-email" component={EmailVerification} />
      <Route path="/account-setup" component={AccountSetup} />
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/">
            <Dashboard />
          </Route>
          <Route path="/dashboard">
            <Dashboard />
          </Route>
          <Route path="/mycourses">
            <Courses />
          </Route>
          <Route path="/courses">
            <Courses />
          </Route>
          <Route path="/courses/:id">
            <CourseDetail />
          </Route>
          <Route path="/video/:courseId/:moduleId">
            <VideoPlayer />
          </Route>
          <Route path="/test-results">
            <TestResults />
          </Route>
          {isAdmin && (
            <Route path="/admin">
              <Admin />
            </Route>
          )}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
