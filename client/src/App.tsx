import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Portfolio from "@/pages/portfolio";
import Assets from "@/pages/assets";
import Tracking from "@/pages/tracking";
import Financial from "@/pages/financial";
import Reports from "@/pages/reports";
import Compliance from "@/pages/compliance";
import Settings from "@/pages/settings";
import Approvals from "@/pages/approvals";
import InvestorShares from "@/pages/investor-shares";
import GpsConfig from "@/pages/gps-config";
import RentalClients from "@/pages/rental-clients";
import RentalContracts from "@/pages/rental-contracts";
import Invoices from "@/pages/invoices";
import Inspections from "@/pages/inspections";

function ProtectedRoute({ component: Component, titleKey }: { component: any; titleKey: string }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You need to be logged in to access this page",
        variant: "destructive",
      });
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar user={user} />
      </div>

      {/* Mobile Drawer */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <Sidebar user={user} onNavigate={() => setIsMobileMenuOpen(false)} isMobile={true} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          title={t(titleKey)} 
          user={user} 
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-auto bg-background">
          <Component />
        </main>
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading && location !== "/" && location !== "/login" && location !== "/register") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} titleKey="pageTitles.dashboard" />}
      </Route>
      <Route path="/portfolio">
        {() => <ProtectedRoute component={Portfolio} titleKey="pageTitles.portfolio" />}
      </Route>
      <Route path="/assets">
        {() => <ProtectedRoute component={Assets} titleKey="pageTitles.assets" />}
      </Route>
      <Route path="/tracking">
        {() => <ProtectedRoute component={Tracking} titleKey="pageTitles.tracking" />}
      </Route>
      <Route path="/financial">
        {() => <ProtectedRoute component={Financial} titleKey="pageTitles.financial" />}
      </Route>
      <Route path="/reports">
        {() => <ProtectedRoute component={Reports} titleKey="pageTitles.reports" />}
      </Route>
      <Route path="/compliance">
        {() => <ProtectedRoute component={Compliance} titleKey="pageTitles.compliance" />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={Settings} titleKey="pageTitles.settings" />}
      </Route>
      <Route path="/approvals">
        {() => <ProtectedRoute component={Approvals} titleKey="pageTitles.approvals" />}
      </Route>
      <Route path="/investor-shares">
        {() => <ProtectedRoute component={InvestorShares} titleKey="pageTitles.investorShares" />}
      </Route>
      <Route path="/gps-config">
        {() => <ProtectedRoute component={GpsConfig} titleKey="pageTitles.gpsConfig" />}
      </Route>
      <Route path="/rental-clients">
        {() => <ProtectedRoute component={RentalClients} titleKey="pageTitles.rentalClients" />}
      </Route>
      <Route path="/rental-contracts">
        {() => <ProtectedRoute component={RentalContracts} titleKey="pageTitles.rentalContracts" />}
      </Route>
      <Route path="/invoices">
        {() => <ProtectedRoute component={Invoices} titleKey="pageTitles.invoices" />}
      </Route>
      <Route path="/inspections">
        {() => <ProtectedRoute component={Inspections} titleKey="pageTitles.inspections" />}
      </Route>
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
