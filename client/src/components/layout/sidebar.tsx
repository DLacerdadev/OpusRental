import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import logoPath from "@assets/image_1759264185138.png";
import { useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Truck,
  MapPin,
  DollarSign,
  FileText,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings,
  CheckCircle,
  Users,
  Satellite,
  Building2,
  Receipt,
  ClipboardCheck,
  Wrench,
  Bug,
  UserCog,
} from "lucide-react";

interface SidebarProps {
  user: any;
  onNavigate?: () => void;
  isMobile?: boolean;
}

export function Sidebar({ user, onNavigate, isMobile = false }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const effectiveCollapsed = isMobile ? false : isCollapsed;

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: t('nav.logout'),
        description: t('nav.logout'),
      });
      setLocation("/login");
    },
  });

  const isManager = user?.role === "manager" || user?.role === "admin";

  const navGroups = [
    {
      title: "",
      items: [
        { path: "/dashboard", icon: LayoutDashboard, label: t('nav.dashboard'), roles: ["investor", "manager", "admin"] },
        { path: "/portfolio", icon: Briefcase, label: t('nav.portfolio'), roles: ["investor"] },
      ]
    },
    {
      title: t('nav.assets'),
      items: [
        { path: "/investor-shares", icon: Users, label: t('nav.investors'), roles: ["manager", "admin"] },
        { path: "/assets", icon: Truck, label: t('nav.assets'), roles: ["manager", "admin"] },
        { path: "/tracking", icon: MapPin, label: t('nav.tracking'), roles: ["manager", "admin"] },
        { path: "/gps-config", icon: Satellite, label: t('nav.gpsConfig'), roles: ["manager", "admin"] },
      ]
    },
    {
      title: t('nav.rentalContracts'),
      items: [
        { path: "/rental-clients", icon: Building2, label: t('nav.rentalClients'), roles: ["manager", "admin"] },
        { path: "/rental-contracts", icon: FileText, label: t('nav.rentalContracts'), roles: ["manager", "admin"] },
        { path: "/invoices", icon: Receipt, label: t('nav.invoices'), roles: ["manager", "admin"] },
      ]
    },
    {
      title: t('nav.operations'),
      items: [
        { path: "/inspections", icon: ClipboardCheck, label: t('nav.inspections'), roles: ["manager", "admin"] },
        { path: "/maintenance", icon: Wrench, label: t('nav.maintenance'), roles: ["manager", "admin"] },
        { path: "/broker", icon: Truck, label: t('nav.broker'), roles: ["manager", "admin"] },
      ]
    },
    {
      title: t('nav.financial'),
      items: [
        { path: "/financial", icon: DollarSign, label: t('nav.financial'), roles: ["manager", "admin"] },
        { path: "/reports", icon: FileText, label: t('nav.reports'), roles: ["manager", "admin"] },
        { path: "/compliance", icon: Shield, label: t('nav.compliance'), roles: ["manager", "admin"] },
      ]
    },
    {
      title: t('nav.system'),
      items: [
        { path: "/approvals", icon: CheckCircle, label: t('nav.approvals'), roles: ["manager", "admin"] },
        { path: "/admin/users", icon: UserCog, label: t('nav.adminUsers'), roles: ["admin"] },
        { path: "/admin/debug", icon: Bug, label: "Debug", roles: ["manager", "admin"] },
        { path: "/settings", icon: Settings, label: t('nav.settings'), roles: ["investor", "manager", "admin"] },
      ]
    }
  ];

  const filteredNavGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => item.roles.includes(user?.role || "investor"))
  })).filter(group => group.items.length > 0);

  const getInitials = () => {
    if (!user?.firstName && !user?.lastName) return "U";
    return `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <div className={`h-screen flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ${effectiveCollapsed ? "w-20" : "w-72"}`}>
      {/* Collapse Toggle - Hidden on mobile */}
      {!isMobile && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-10 z-50 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 rounded-full p-1.5 shadow-sm hover:shadow transition-all items-center justify-center"
          data-testid="button-toggle-sidebar"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      )}

      {/* Header with Logo */}
      <div className="p-6 border-b border-slate-200">
        {!effectiveCollapsed && (
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 p-2 rounded-xl">
              <img src={logoPath} alt="Opus" className="h-10 w-10 rounded-lg" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Opus Rental Capital</h1>
              <p className="text-xs text-slate-500 font-medium">{t('nav.investmentPlatform')}</p>
            </div>
          </div>
        )}
        {effectiveCollapsed && (
          <div className="bg-slate-50 p-2 rounded-xl mx-auto w-fit">
            <img src={logoPath} alt="Opus" className="h-9 w-9 rounded-lg" />
          </div>
        )}
      </div>

      {/* Navigation - Grouped & Clean */}
      <nav className="p-3 flex-1 overflow-y-auto">
        {filteredNavGroups.map((group, groupIndex) => (
          <div key={groupIndex} className={groupIndex > 0 ? "mt-6" : ""}>
            {!effectiveCollapsed && group.title && (
              <div className="text-xs font-bold text-slate-400 mb-2 px-3 uppercase tracking-wider">
                {group.title}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                
                return (
                  <Link key={item.path} href={item.path}>
                    <button
                      onClick={onNavigate}
                      className={`w-full flex items-center ${effectiveCollapsed ? "justify-center px-3" : "px-3"} py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive 
                          ? "bg-[#0D2847] text-white" 
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                      data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Icon className={`h-4 w-4 ${effectiveCollapsed ? "" : "mr-3"} flex-shrink-0`} />
                      {!effectiveCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-200">
        <button
          className={`w-full flex items-center ${effectiveCollapsed ? "justify-center px-3" : "px-3"} py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 transition-all`}
          onClick={() => logoutMutation.mutate()}
          data-testid="button-logout"
        >
          <LogOut className={`h-4 w-4 ${effectiveCollapsed ? "" : "mr-3"} flex-shrink-0`} />
          {!effectiveCollapsed && <span>{t('nav.logout')}</span>}
        </button>
      </div>
    </div>
  );
}
