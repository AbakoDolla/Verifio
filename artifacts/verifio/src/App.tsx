import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "@/pages/LandingPage";
import VendorProfile from "@/pages/VendorProfile";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/not-found";
import SplashAnimation from "@/components/SplashAnimation";
import OnboardingGuide from "@/components/OnboardingGuide";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/shop/:slug" component={VendorProfile} />
      <Route path="/dashboard" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SplashAnimation>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
            <OnboardingGuide />
          </WouterRouter>
        </SplashAnimation>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
