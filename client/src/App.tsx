import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
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

function ProtectedRoute({ component: Component, title }: { component: any; title: string }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} user={user} />
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated && location !== "/login") {
    return <Login />;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        {() => <ProtectedRoute component={Dashboard} title="Dashboard" />}
      </Route>
      <Route path="/portfolio">
        {() => <ProtectedRoute component={Portfolio} title="Minha Carteira" />}
      </Route>
      <Route path="/assets">
        {() => <ProtectedRoute component={Assets} title="Gestão de Ativos" />}
      </Route>
      <Route path="/tracking">
        {() => <ProtectedRoute component={Tracking} title="Monitoramento GPS" />}
      </Route>
      <Route path="/financial">
        {() => <ProtectedRoute component={Financial} title="Financeiro" />}
      </Route>
      <Route path="/reports">
        {() => <ProtectedRoute component={Reports} title="Relatórios" />}
      </Route>
      <Route path="/compliance">
        {() => <ProtectedRoute component={Compliance} title="Compliance" />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={Settings} title="Configurações" />}
      </Route>
      <Route path="/approvals">
        {() => <ProtectedRoute component={Approvals} title="Aprovações" />}
      </Route>
      <Route path="/investor-shares">
        {() => <ProtectedRoute component={InvestorShares} title="Cotas dos Investidores" />}
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
