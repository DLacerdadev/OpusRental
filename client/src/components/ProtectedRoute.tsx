import { useAuth } from "@/hooks/useAuth";
import { useLocation, Redirect } from "wouter";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("investor" | "manager" | "admin")[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    } else if (!isLoading && user && allowedRoles && !allowedRoles.includes(user.role as "investor" | "manager" | "admin")) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [user, isLoading, allowedRoles, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role as "investor" | "manager" | "admin")) {
    return null;
  }

  return <>{children}</>;
}
