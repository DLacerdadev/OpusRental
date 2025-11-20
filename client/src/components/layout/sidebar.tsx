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
  UserCog,
  Users,
  Satellite,
  Building2,
  Receipt,
  ClipboardCheck,
  Wrench,
  Activity,
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

  const navItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: t('nav.dashboard'), roles: ["investor", "manager", "admin"] },
    { path: "/portfolio", icon: Briefcase, label: t('nav.portfolio'), roles: ["investor"] },
    { path: "/investor-shares", icon: Users, label: t('nav.investors'), roles: ["manager", "admin"] },
    { path: "/assets", icon: Truck, label: t('nav.assets'), roles: ["manager", "admin"] },
    { path: "/tracking", icon: MapPin, label: t('nav.tracking'), roles: ["manager", "admin"] },
    { path: "/gps-config", icon: Satellite, label: t('nav.gpsConfig'), roles: ["manager", "admin"] },
    { path: "/rental-clients", icon: Building2, label: t('nav.rentalClients'), roles: ["manager", "admin"] },
    { path: "/rental-contracts", icon: FileText, label: t('nav.rentalContracts'), roles: ["manager", "admin"] },
    { path: "/invoices", icon: Receipt, label: t('nav.invoices'), roles: ["manager", "admin"] },
    { path: "/inspections", icon: ClipboardCheck, label: t('nav.inspections'), roles: ["manager", "admin"] },
    { path: "/maintenance", icon: Wrench, label: t('nav.maintenance'), roles: ["manager", "admin"] },
    { path: "/broker", icon: Truck, label: t('nav.broker'), roles: ["manager", "admin"] },
    { path: "/financial", icon: DollarSign, label: t('nav.financial'), roles: ["manager", "admin"] },
    { path: "/reports", icon: FileText, label: t('nav.reports'), roles: ["manager", "admin"] },
    { path: "/compliance", icon: Shield, label: t('nav.compliance'), roles: ["manager", "admin"] },
  ];

  const settingsItems = [
    { path: "/approvals", icon: CheckCircle, label: t('nav.approvals'), roles: ["manager", "admin"] },
    { path: "/settings", icon: Settings, label: t('nav.settings'), roles: ["investor", "manager", "admin"] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role || "investor"));
  const filteredSettingsItems = settingsItems.filter(item => item.roles.includes(user?.role || "investor"));

  const getInitials = () => {
    if (!user?.firstName && !user?.lastName) return "U";
    return `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <div className={`relative h-screen flex flex-col shadow-2xl transition-all duration-300 ${effectiveCollapsed ? "w-20" : "w-72"} bg-gradient-to-br from-[#0D2847] via-[#0a1f38] to-[#0D2847]`}>
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2196F308_1px,transparent_1px),linear-gradient(to_bottom,#2196F308_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"></div>
      
      {/* Glowing orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2196F3]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#2196F3]/10 rounded-full blur-3xl"></div>

      {/* Collapse Toggle - Hidden on mobile */}
      {!isMobile && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-4 top-10 z-50 bg-gradient-to-r from-[#2196F3] to-[#0D2847] hover:from-[#1976D2] hover:to-[#0a1f38] text-white rounded-full p-2.5 shadow-2xl shadow-[#2196F3]/50 hover:shadow-[#2196F3]/70 transition-all hover:scale-110 items-center justify-center"
          data-testid="button-toggle-sidebar"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      )}

      {/* Header with Logo - PREMIUM DESIGN */}
      <div className="relative z-10 p-6 border-b-2 border-[#2196F3]/20">
        {!effectiveCollapsed && (
          <div className="flex items-center gap-3.5 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-[#2196F3]/30 rounded-2xl blur-lg animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-[#2196F3]/20 to-[#0D2847]/40 p-2.5 rounded-2xl border-2 border-[#2196F3]/40 backdrop-blur-xl">
                <img src={logoPath} alt="Opus" className="h-12 w-12 rounded-xl" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">Opus Rental Capital</h1>
              <p className="text-xs text-[#2196F3] font-bold uppercase tracking-wider">{t('nav.investmentPlatform')}</p>
            </div>
          </div>
        )}
        {effectiveCollapsed && (
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-[#2196F3]/30 rounded-2xl blur-lg animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-[#2196F3]/20 to-[#0D2847]/40 p-2.5 rounded-2xl border-2 border-[#2196F3]/40 backdrop-blur-xl mx-auto w-fit">
              <img src={logoPath} alt="Opus" className="h-11 w-11 rounded-xl" />
            </div>
          </div>
        )}
        
        {/* User Profile Card - PREMIUM BANKING STYLE */}
        {!effectiveCollapsed && (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#2196F3]/20 to-[#0D2847]/20 rounded-2xl blur-md group-hover:blur-lg transition-all"></div>
            <div className="relative bg-gradient-to-br from-white/10 to-white/5 border-2 border-[#2196F3]/30 rounded-2xl p-4 backdrop-blur-xl shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#2196F3] rounded-full blur-sm animate-pulse"></div>
                  <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-[#2196F3] to-[#0D2847] flex items-center justify-center text-white font-black text-lg shadow-lg ring-2 ring-white/20">
                    {getInitials()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full bg-[#2196F3] animate-pulse shadow-lg shadow-[#2196F3]/50"></div>
                    <p className="text-xs text-[#2196F3] font-black uppercase tracking-wider">Live</p>
                  </div>
                  <p className="text-sm text-white font-black capitalize truncate">
                    {t(`roles.${user?.role || 'investor'}`)}
                  </p>
                </div>
              </div>
              {user?.email && (
                <p className="text-xs text-white/70 font-semibold truncate bg-[#0D2847]/30 px-3 py-1.5 rounded-lg border border-[#2196F3]/20">
                  {user.email}
                </p>
              )}
            </div>
          </div>
        )}
        {effectiveCollapsed && (
          <div className="relative">
            <div className="absolute inset-0 bg-[#2196F3]/30 rounded-full blur-md animate-pulse"></div>
            <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-[#2196F3] to-[#0D2847] flex items-center justify-center text-white font-black text-base shadow-xl ring-2 ring-white/20 mx-auto">
              {getInitials()}
            </div>
          </div>
        )}
      </div>

      {/* Navigation - MODERN BANKING STYLE */}
      <nav className="relative z-10 p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <button
                onClick={onNavigate}
                className={`relative w-full flex items-center ${effectiveCollapsed ? "justify-center px-3" : "px-4"} py-3.5 rounded-xl text-sm font-bold transition-all group ${
                  isActive 
                    ? "bg-gradient-to-r from-[#2196F3] to-[#0D2847] text-white shadow-2xl shadow-[#2196F3]/50" 
                    : "text-white/80 hover:bg-white/10 hover:text-white hover:shadow-lg hover:shadow-[#2196F3]/20"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {isActive && !effectiveCollapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-lg shadow-white/50"></div>
                )}
                <Icon className={`h-5 w-5 ${effectiveCollapsed ? "" : "mr-3.5"} flex-shrink-0 ${isActive ? "drop-shadow-lg" : ""}`} />
                {!effectiveCollapsed && <span className="truncate">{item.label}</span>}
                {isActive && !effectiveCollapsed && (
                  <Activity className="h-3.5 w-3.5 ml-auto text-white animate-pulse" />
                )}
              </button>
            </Link>
          );
        })}
      </nav>

      {/* Settings Section - PREMIUM */}
      <div className="relative z-10 p-4 border-t-2 border-[#2196F3]/20 space-y-2 bg-[#0D2847]/50 backdrop-blur-xl">
        {!effectiveCollapsed && (
          <div className="flex items-center gap-2 mb-3 px-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#2196F3]/50 to-transparent"></div>
            <p className="text-xs font-black text-white/60 uppercase tracking-widest">
              {t('nav.system')}
            </p>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#2196F3]/50 to-transparent"></div>
          </div>
        )}
        
        {filteredSettingsItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <button
                onClick={onNavigate}
                className={`relative w-full flex items-center ${effectiveCollapsed ? "justify-center px-3" : "px-4"} py-3.5 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? "bg-gradient-to-r from-[#2196F3] to-[#0D2847] text-white shadow-2xl shadow-[#2196F3]/50" 
                    : "text-white/80 hover:bg-white/10 hover:text-white hover:shadow-lg hover:shadow-[#2196F3]/20"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className={`h-5 w-5 ${effectiveCollapsed ? "" : "mr-3.5"} flex-shrink-0`} />
                {!effectiveCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            </Link>
          );
        })}

        <button
          className={`w-full flex items-center ${effectiveCollapsed ? "justify-center px-3" : "px-4"} py-3.5 rounded-xl text-sm font-bold text-white/80 hover:bg-red-500/20 hover:text-white transition-all hover:shadow-lg hover:shadow-red-500/20 border-2 border-transparent hover:border-red-500/30`}
          onClick={() => logoutMutation.mutate()}
          data-testid="button-logout"
        >
          <LogOut className={`h-5 w-5 ${effectiveCollapsed ? "" : "mr-3.5"} flex-shrink-0`} />
          {!effectiveCollapsed && <span>{t('nav.logout')}</span>}
        </button>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(33, 150, 243, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(33, 150, 243, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(33, 150, 243, 0.5);
        }
      `}</style>
    </div>
  );
}
