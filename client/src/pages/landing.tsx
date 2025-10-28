import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Shield, 
  Lock,
  FileCheck,
  Fingerprint,
  ShieldCheck,
  Database,
  Eye,
  Landmark,
  TrendingUp,
  MapPin,
  BarChart3,
  Truck,
  DollarSign,
  CheckCircle2,
  Award,
  Users,
  Clock,
  Zap,
  Building2,
  Globe2,
  FileText,
  Bell,
  Activity,
  Server,
  AlertTriangle,
  CheckCircle,
  Target,
  Briefcase,
  LineChart,
  PieChart,
  Calendar,
  Download,
  Upload,
  Phone,
  Mail,
  MapPinned,
  MessageSquare,
  ChevronRight,
  Star
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import logoPath from "@assets/image_1759264185138.png";

export default function Landing() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Advanced Navigation Bar - Investment Bank Style */}
      <nav className="fixed top-0 w-full bg-card/95 backdrop-blur-xl border-b border-border z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Trust Bar */}
          <div className="flex justify-between items-center py-2 sm:py-2.5 border-b border-border/50">
            <div className="flex items-center gap-3 sm:gap-6 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" />
                <span className="hidden sm:inline font-medium">SEC Registered</span>
                <span className="sm:hidden font-medium">SEC</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" />
                <span className="hidden md:inline font-medium">Bank-Level Security</span>
                <span className="md:hidden font-medium">Secure</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Award className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" />
                <span className="hidden sm:inline font-medium">FDIC Insured</span>
                <span className="sm:hidden font-medium">FDIC</span>
              </div>
              <div className="hidden lg:flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-accent" />
                <span className="font-medium">SOC 2 Certified</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                data-testid="button-toggle-theme"
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => i18n.changeLanguage(i18n.language === "en" ? "pt" : "en")}
                className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                data-testid="button-toggle-language"
              >
                {i18n.language === "en" ? "PT" : "EN"}
              </Button>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span className="font-medium">1-800-OPUS-CAP</span>
              </div>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-3 sm:gap-4">
              <img 
                src={logoPath} 
                alt="Opus Rental Capital" 
                className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl shadow-md object-cover"
              />
              <div className="flex flex-col">
                <h1 className="text-base sm:text-xl font-bold text-foreground tracking-tight leading-tight">
                  Opus Rental Capital
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold">
                  Investment Grade Asset Management
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/login">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 sm:h-10 text-xs sm:text-sm font-semibold" 
                  data-testid="button-login"
                >
                  Client Portal
                </Button>
              </Link>
              <Link href="/register">
                <Button 
                  size="sm" 
                  className="h-9 sm:h-10 px-4 sm:px-6 text-xs sm:text-sm font-bold bg-accent hover:bg-accent/90 shadow-lg" 
                  data-testid="button-get-started"
                >
                  Open Account
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Enhanced with Background Pattern */}
      <section className="pt-32 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background"></div>
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center"
          >
            {/* Trust Badge with Animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6 sm:mb-8"
            >
              <Landmark className="h-4 w-4 text-accent" />
              <span className="text-xs sm:text-sm font-bold text-accent">
                SEC-Registered • FINRA Member • FDIC Insured
              </span>
            </motion.div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 sm:mb-8 leading-[1.1] tracking-tight">
              Institutional-Grade
              <br />
              <span className="text-accent">Asset Management</span>
              <br className="hidden sm:block" />
              <span className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-muted-foreground">
                Built for Serious Investors
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto mb-10 sm:mb-12 leading-relaxed">
              Invest in commercial trailer assets with{" "}
              <span className="text-foreground font-bold">bank-level security</span>,{" "}
              <span className="text-foreground font-bold">2% monthly returns</span>, and{" "}
              <span className="text-foreground font-bold">complete transparency</span>.
              <br className="hidden sm:block" />
              Backed by physical assets. Secured by institutional-grade infrastructure. Regulated by federal authorities.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12 sm:mb-16">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="h-13 sm:h-14 px-8 sm:px-10 text-base sm:text-lg font-bold bg-accent hover:bg-accent/90 shadow-xl hover:shadow-2xl transition-all w-full sm:w-auto group" 
                  data-testid="button-hero-register"
                >
                  Open Your Account
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-13 sm:h-14 px-8 sm:px-10 text-base sm:text-lg font-bold border-2 w-full sm:w-auto" 
                  data-testid="button-hero-login"
                >
                  Existing Client Login
                </Button>
              </Link>
            </div>

            {/* Certification Bar Enhanced */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 pt-8 sm:pt-10 border-t border-border"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                <span className="text-xs sm:text-sm font-bold">SEC Registered</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                <span className="text-xs sm:text-sm font-bold">FINRA Member</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                <span className="text-xs sm:text-sm font-bold">FDIC Insured</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileCheck className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                <span className="text-xs sm:text-sm font-bold">SOC 2 Type II</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Stats Grid - Investment Style */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-16 sm:mt-20"
          >
            {[
              { value: "$50M+", label: "Assets Under Management", icon: Landmark, sublabel: "Growing 45% YoY" },
              { value: "2,500+", label: "Active Trailer Assets", icon: Truck, sublabel: "Across North America" },
              { value: "99.9%", label: "Platform Uptime", icon: Zap, sublabel: "24/7 Operations" },
              { value: "5,000+", label: "Verified Investors", icon: Users, sublabel: "Institutional & Retail" }
            ].map((stat, index) => (
              <motion.div key={index} variants={item}>
                <Card className="border-2 border-border hover:border-accent/50 transition-all hover:shadow-xl bg-card">
                  <CardContent className="p-5 sm:p-6 text-center">
                    <stat.icon className="h-8 w-8 mx-auto mb-4 text-accent" />
                    <div className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-foreground font-bold mb-1">{stat.label}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">{stat.sublabel}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Security Architecture Section - Detailed */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <Badge variant="secondary" className="mb-4 text-xs sm:text-sm font-bold px-4 py-1.5">
              <Shield className="h-3.5 w-3.5 mr-1.5 inline" />
              Enterprise Security Infrastructure
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4 sm:mb-6">
              Bank-Level Security Architecture
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
              Your investments protected by institutional-grade security infrastructure,
              the same technology trusted by Fortune 500 financial institutions
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              <Badge variant="outline" className="text-xs font-semibold">
                <Lock className="h-3 w-3 mr-1" />
                AES-256 Encryption
              </Badge>
              <Badge variant="outline" className="text-xs font-semibold">
                <Server className="h-3 w-3 mr-1" />
                Multi-Region Redundancy
              </Badge>
              <Badge variant="outline" className="text-xs font-semibold">
                <Eye className="h-3 w-3 mr-1" />
                24/7 SOC Monitoring
              </Badge>
              <Badge variant="outline" className="text-xs font-semibold">
                <FileCheck className="h-3 w-3 mr-1" />
                Quarterly Audits
              </Badge>
            </div>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12"
          >
            {[
              {
                icon: ShieldCheck,
                title: "End-to-End Encryption",
                description: "Military-grade AES-256 encryption protects all data in transit and at rest. Zero-knowledge architecture ensures maximum privacy.",
                badge: "AES-256",
                features: ["Data in Transit", "Data at Rest", "Zero-Knowledge"]
              },
              {
                icon: Fingerprint,
                title: "Multi-Factor Authentication",
                description: "Biometric verification, hardware tokens, and SMS/email codes provide layered authentication security.",
                badge: "MFA/2FA",
                features: ["Biometric", "Hardware Tokens", "SMS/Email"]
              },
              {
                icon: Database,
                title: "Redundant Infrastructure",
                description: "Multi-region data centers with real-time replication ensure 99.9% uptime and instant disaster recovery.",
                badge: "99.9% SLA",
                features: ["Multi-Region", "Auto-Failover", "Real-time Backup"]
              },
              {
                icon: FileCheck,
                title: "Regulatory Compliance",
                description: "Fully compliant with SEC, FINRA, and federal regulations. Regular third-party audits and certifications.",
                badge: "SEC/FINRA",
                features: ["SEC Registered", "FINRA Member", "Federal Compliance"]
              },
              {
                icon: Eye,
                title: "Security Operations Center",
                description: "24/7 threat monitoring with AI-powered anomaly detection. Incident response team on standby.",
                badge: "24/7 SOC",
                features: ["AI Detection", "Real-time Alerts", "Rapid Response"]
              },
              {
                icon: Lock,
                title: "Insured Custody",
                description: "Assets held in FDIC-insured custody accounts with additional private insurance coverage up to $250M.",
                badge: "FDIC + $250M",
                features: ["FDIC Insurance", "Private Coverage", "Segregated Accounts"]
              }
            ].map((feature, index) => (
              <motion.div key={index} variants={item}>
                <Card className="h-full border-2 border-border hover:border-accent/50 transition-all hover:shadow-xl bg-card group">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <feature.icon className="h-6 w-6 text-accent" />
                      </div>
                      <Badge className="text-[10px] font-bold bg-accent/20 text-accent border-accent/30">
                        {feature.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg sm:text-xl font-bold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    <div className="space-y-1.5 pt-2 border-t border-border">
                      {feature.features.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <CheckCircle className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                          <span className="text-muted-foreground font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Security Timeline/Process */}
          <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-background">
            <CardContent className="p-6 sm:p-10">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-6 text-center">
                Multi-Layer Security Verification Process
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
                {[
                  { step: "1", title: "Identity Verification", desc: "KYC/AML compliance check" },
                  { step: "2", title: "Account Setup", desc: "MFA & biometric enrollment" },
                  { step: "3", title: "Deposit Verification", desc: "Bank account validation" },
                  { step: "4", title: "Trading Authorization", desc: "Final security clearance" }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center relative">
                    {i < 3 && (
                      <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-accent/30"></div>
                    )}
                    <div className="w-16 h-16 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-2xl font-black mb-3 relative z-10 shadow-lg">
                      {item.step}
                    </div>
                    <h4 className="font-bold text-foreground mb-1 text-sm sm:text-base">{item.title}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Investment Performance Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <Badge variant="secondary" className="mb-4 text-xs sm:text-sm font-bold px-4 py-1.5">
              <TrendingUp className="h-3.5 w-3.5 mr-1.5 inline" />
              Consistent Performance
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4 sm:mb-6">
              Predictable, Asset-Backed Returns
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Invest in tangible commercial trailer assets delivering 2% monthly returns
              with complete transparency and real-time tracking
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-12">
            {/* Performance Card */}
            <Card className="border-2 border-border hover:shadow-2xl transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                  <LineChart className="h-6 w-6 text-accent" />
                  Monthly Return Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 bg-accent/5 rounded-xl border border-accent/20">
                  <div className="text-5xl font-black text-accent mb-2">2.0%</div>
                  <div className="text-sm font-bold text-foreground mb-1">Monthly Return Rate</div>
                  <div className="text-xs text-muted-foreground">24% Annual ROI</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-foreground">$10K</div>
                    <div className="text-xs text-muted-foreground mt-1">Minimum Investment</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-foreground">$200</div>
                    <div className="text-xs text-muted-foreground mt-1">Monthly on $10K</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Backed by physical assets", icon: Truck },
                    { label: "Monthly distributions", icon: Calendar },
                    { label: "No hidden fees", icon: CheckCircle },
                    { label: "Withdraw anytime*", icon: Upload }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <item.icon className="h-4 w-4 text-accent" />
                      <span className="text-muted-foreground font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Asset Details Card */}
            <Card className="border-2 border-border hover:shadow-2xl transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                  <Truck className="h-6 w-6 text-accent" />
                  Asset Portfolio Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Total Assets", value: "$50M+", icon: DollarSign },
                    { label: "Active Trailers", value: "2,500+", icon: Truck },
                    { label: "Avg. Asset Value", value: "$20K", icon: Target },
                    { label: "Occupancy Rate", value: "98.5%", icon: Activity }
                  ].map((stat, i) => (
                    <div key={i} className="p-4 bg-muted rounded-lg">
                      <stat.icon className="h-5 w-5 text-accent mb-2" />
                      <div className="text-xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-sm text-foreground mb-1">Real-Time GPS Tracking</div>
                      <div className="text-xs text-muted-foreground">Monitor your asset locations 24/7 with live telemetry and movement history</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BarChart3 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-sm text-foreground mb-1">Complete Transparency</div>
                      <div className="text-xs text-muted-foreground">Access detailed financial reports, compliance docs, and performance analytics</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-sm text-foreground mb-1">Full Insurance Coverage</div>
                      <div className="text-xs text-muted-foreground">Every asset insured against theft, damage, and loss with comprehensive coverage</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Investment Process */}
          <Card className="border-2 border-accent/20 bg-gradient-to-br from-card to-muted/20">
            <CardContent className="p-6 sm:p-10">
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
                How It Works: From Registration to Returns
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
                {[
                  { icon: FileText, title: "Register & Verify", desc: "Complete KYC/AML verification in 10 minutes. Link your bank account securely." },
                  { icon: Target, title: "Select Assets", desc: "Browse available trailer assets. Review location, condition, and return projections." },
                  { icon: DollarSign, title: "Invest Capital", desc: "Fund your account and purchase shares. Minimum $10,000 initial investment." },
                  { icon: TrendingUp, title: "Earn Returns", desc: "Receive 2% monthly returns. Track performance in real-time dashboard." }
                ].map((step, i) => (
                  <div key={i} className="relative">
                    {i < 3 && (
                      <div className="hidden md:block absolute top-10 left-[65%] w-[70%] border-t-2 border-dashed border-accent/30"></div>
                    )}
                    <div className="flex flex-col items-center text-center relative z-10">
                      <div className="w-20 h-20 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center mb-4 shadow-xl">
                        <step.icon className="h-10 w-10" />
                      </div>
                      <h4 className="font-bold text-foreground mb-2">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Compliance & Regulation Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="mb-4 text-xs sm:text-sm font-bold px-4 py-1.5">
              <Landmark className="h-3.5 w-3.5 mr-1.5 inline" />
              Regulatory Compliance
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4">
              Fully Regulated & Compliant
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Operating under strict federal oversight with transparent reporting and investor protection
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              {
                icon: Shield,
                title: "SEC Registration",
                desc: "Registered investment platform under Securities and Exchange Commission oversight",
                details: ["Form RIA Filed", "Annual Audits", "Investor Protections"]
              },
              {
                icon: Building2,
                title: "FINRA Membership",
                desc: "Member of Financial Industry Regulatory Authority with broker-dealer compliance",
                details: ["Member Firm", "Arbitration Access", "Regulatory Oversight"]
              },
              {
                icon: Lock,
                title: "FDIC Insurance",
                desc: "Cash holdings insured up to $250,000 per depositor through FDIC member banks",
                details: ["$250K Coverage", "Member Banks", "Federal Guarantee"]
              }
            ].map((item, i) => (
              <Card key={i} className="border-2 border-border hover:border-accent/50 transition-all">
                <CardContent className="p-6">
                  <item.icon className="h-12 w-12 text-accent mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{item.desc}</p>
                  <div className="space-y-2">
                    {item.details.map((detail, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3.5 w-3.5 text-accent" />
                        <span className="text-muted-foreground font-medium">{detail}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-2 border-accent/30 bg-accent/5">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col md:flex-row items-start gap-4">
                <AlertTriangle className="h-8 w-8 text-accent flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-foreground mb-2">Investment Risk Disclosure</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    All investments involve risk. Past performance does not guarantee future results. 
                    Asset values may fluctuate. Monthly returns are not guaranteed and subject to asset performance. 
                    Please read our prospectus carefully before investing. Securities offered through Opus Rental Capital, 
                    Member FINRA/SIPC. Not FDIC insured beyond cash holdings. May lose value.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]"></div>
        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6">
              Start Building Wealth Today
            </h2>
            <p className="text-lg sm:text-xl text-primary-foreground/90 mb-10 max-w-3xl mx-auto leading-relaxed">
              Join thousands of investors earning consistent returns with institutional-grade security. 
              Open your account in minutes and start investing in asset-backed opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="h-14 sm:h-16 px-10 text-base sm:text-lg font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-2xl w-full sm:w-auto group" 
                  data-testid="button-cta-register"
                >
                  Open Your Account Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-14 sm:h-16 px-10 text-base sm:text-lg font-bold border-2 border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 w-full sm:w-auto backdrop-blur-sm" 
                  data-testid="button-cta-login"
                >
                  Client Login
                </Button>
              </Link>
            </div>

            {/* Trust Footer */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-12 border-t border-primary-foreground/20">
              {[
                { icon: Shield, text: "FDIC Insured" },
                { icon: Lock, text: "256-bit Encryption" },
                { icon: FileCheck, text: "SEC Registered" },
                { icon: Award, text: "SOC 2 Certified" }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <item.icon className="h-6 w-6 text-primary-foreground/80" />
                  <span className="text-xs sm:text-sm font-bold text-primary-foreground/90">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Comprehensive */}
      <footer className="border-t border-border bg-muted/30 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 sm:gap-12 mb-12">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-start gap-3 mb-4">
                <img 
                  src={logoPath} 
                  alt="Opus Rental Capital" 
                  className="h-14 w-14 rounded-xl shadow-md object-cover flex-shrink-0"
                />
                <div>
                  <div className="font-bold text-lg text-foreground mb-1">Opus Rental Capital</div>
                  <div className="text-xs text-muted-foreground font-semibold mb-2">Investment Grade Asset Management</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-md">
                SEC-registered investment platform providing institutional-grade asset management 
                services for commercial trailer investments in the North American market.
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 text-accent" />
                  <span className="font-semibold">1-800-OPUS-CAP (678-7227)</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 text-accent" />
                  <span className="font-semibold">invest@opusrentalcapital.com</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPinned className="h-4 w-4 text-accent" />
                  <span className="font-semibold">New York, NY • Los Angeles, CA</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <div className="font-bold text-foreground mb-4">Company</div>
              <div className="space-y-2.5 text-sm">
                {["About Us", "Leadership Team", "Careers", "Press & Media", "Investor Relations", "Contact Us"].map((item, i) => (
                  <div key={i} className="text-muted-foreground hover:text-accent cursor-pointer transition-colors font-medium">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <div className="font-bold text-foreground mb-4">Legal & Support</div>
              <div className="space-y-2.5 text-sm">
                {["Terms of Service", "Privacy Policy", "Risk Disclosure", "Prospectus", "Help Center", "Security"].map((item, i) => (
                  <div key={i} className="text-muted-foreground hover:text-accent cursor-pointer transition-colors font-medium">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
              <div className="text-sm text-muted-foreground text-center md:text-left">
                © 2025 Opus Rental Capital LLC. All rights reserved.
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground font-semibold">
                <span>Member FINRA</span>
                <span>•</span>
                <span>Member SIPC</span>
                <span>•</span>
                <span>FDIC Insured</span>
                <span>•</span>
                <span>SEC Registered</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-5xl mx-auto text-center">
              Securities and investment advisory services offered through Opus Rental Capital LLC, a registered broker-dealer and 
              investment adviser. Member FINRA/SIPC. Check the background of this firm on FINRA's BrokerCheck. 
              This is not an offer to sell securities. All investments involve risk. Past performance does not guarantee future results.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
