import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Shield, 
  Lock,
  FileCheck,
  Radar,
  Building2,
  TrendingUp,
  MapPin,
  BarChart3,
  Truck,
  DollarSign,
  CheckCircle2,
  Fingerprint,
  ShieldCheck,
  Database,
  Globe2,
  Award,
  Bell,
  Users,
  Clock,
  Zap,
  Eye,
  Landmark
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import logoPath from "@assets/image_1759506183779.png";

export default function Landing() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const securityFeatures = [
    {
      icon: ShieldCheck,
      title: "Criptografia Bancária",
      description: "Dados protegidos com criptografia AES-256, o mesmo padrão usado por instituições financeiras globais",
      badge: "Nível Bancário"
    },
    {
      icon: Fingerprint,
      title: "Autenticação Multi-Fator",
      description: "Verificação biométrica e autenticação em duas etapas para máxima proteção da sua conta",
      badge: "2FA"
    },
    {
      icon: Database,
      title: "Backup Redundante",
      description: "Infraestrutura distribuída com backup em tempo real e recuperação de desastres garantida",
      badge: "99.9% SLA"
    },
    {
      icon: FileCheck,
      title: "Compliance Regulatório",
      description: "Totalmente conforme com SEC, FINRA e regulamentações norte-americanas de valores mobiliários",
      badge: "SEC Compliant"
    },
    {
      icon: Eye,
      title: "Auditoria Contínua",
      description: "Monitoramento 24/7 com logs de auditoria imutáveis e rastreabilidade completa de transações",
      badge: "SOC 2 Type II"
    },
    {
      icon: Lock,
      title: "Custódia Segura",
      description: "Ativos sob custódia de instituições financeiras registradas com seguro FDIC e cobertura total",
      badge: "FDIC Insured"
    }
  ];

  const investmentFeatures = [
    {
      icon: TrendingUp,
      title: "Retornos Consistentes",
      description: "2% de rendimento mensal previsível com histórico comprovado de performance",
      metric: "2% a.m."
    },
    {
      icon: Truck,
      title: "Ativos Tangíveis",
      description: "Cada cota representa propriedade real de trailers comerciais registrados",
      metric: "$50M+"
    },
    {
      icon: MapPin,
      title: "Rastreamento GPS",
      description: "Localização em tempo real de todos os ativos com telemetria avançada",
      metric: "24/7"
    },
    {
      icon: BarChart3,
      title: "Transparência Total",
      description: "Relatórios financeiros detalhados, compliance e documentação completa",
      metric: "100%"
    }
  ];

  const stats = [
    { value: "$50M+", label: "Ativos Sob Gestão", icon: Landmark, color: "from-blue-600 to-blue-400" },
    { value: "2,500+", label: "Trailers Ativos", icon: Truck, color: "from-green-600 to-green-400" },
    { value: "99.9%", label: "Uptime Garantido", icon: Zap, color: "from-purple-600 to-purple-400" },
    { value: "5,000+", label: "Investidores", icon: Users, color: "from-orange-600 to-orange-400" }
  ];

  const certifications = [
    { name: "SEC Registered", icon: Shield },
    { name: "FINRA Member", icon: Award },
    { name: "FDIC Insured", icon: Lock },
    { name: "SOC 2 Type II", icon: FileCheck }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Premium Navigation Bar */}
      <nav className="fixed top-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Bar - Trust Signals */}
          <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-4 sm:gap-6 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Shield className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">SEC Registered</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Lock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Bank-Level Security</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Award className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">FDIC Insured</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-7 w-7 p-0"
                data-testid="button-toggle-theme"
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => i18n.changeLanguage(i18n.language === "en" ? "pt" : "en")}
                className="h-7 px-2 text-xs font-medium"
                data-testid="button-toggle-language"
              >
                {i18n.language === "en" ? "PT" : "EN"}
              </Button>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-3 sm:gap-4">
              <img 
                src={logoPath} 
                alt="Opus Rental Capital" 
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shadow-md object-cover"
              />
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Opus Rental Capital
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium hidden sm:block">
                  Investment Grade Asset Management
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/login">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 sm:h-10 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white" 
                  data-testid="button-login"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button 
                  size="sm" 
                  className="h-9 sm:h-10 px-4 sm:px-6 text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/25" 
                  data-testid="button-get-started"
                >
                  Get Started
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Investment Bank Style */}
      <section className="pt-32 sm:pt-40 pb-20 sm:pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center"
          >
            {/* Trust Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 mb-6 sm:mb-8"
            >
              <Landmark className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300">
                SEC-Registered Investment Platform
              </span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white mb-6 sm:mb-8 leading-tight tracking-tight">
              Institutional-Grade
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-clip-text text-transparent">
                Asset Management
              </span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto mb-10 sm:mb-14 leading-relaxed font-medium">
              Invest in commercial trailer assets with{" "}
              <span className="text-slate-900 dark:text-white font-semibold">bank-level security</span>,{" "}
              <span className="text-slate-900 dark:text-white font-semibold">2% monthly returns</span>, and{" "}
              <span className="text-slate-900 dark:text-white font-semibold">complete transparency</span>.
              <br className="hidden sm:block" />
              Built for serious investors who demand institutional standards.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 sm:mb-16">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="h-14 sm:h-16 px-8 sm:px-10 text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/40 transition-all w-full sm:w-auto group" 
                  data-testid="button-hero-register"
                >
                  Open Account
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-14 sm:h-16 px-8 sm:px-10 text-base sm:text-lg font-semibold border-2 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 w-full sm:w-auto" 
                  data-testid="button-hero-login"
                >
                  Client Login
                </Button>
              </Link>
            </div>

            {/* Certifications Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 pt-8 border-t border-slate-200 dark:border-slate-800"
            >
              {certifications.map((cert, index) => (
                <div key={index} className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <cert.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm font-semibold">{cert.name}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-16 sm:mt-24"
          >
            {stats.map((stat, index) => (
              <motion.div key={index} variants={item}>
                <Card className="border-2 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-2xl bg-white dark:bg-slate-900/50 backdrop-blur-sm">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <div className={`w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} p-0.5`}>
                      <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center">
                        <stat.icon className={`h-6 w-6 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} style={{ WebkitTextFillColor: 'transparent' }} />
                      </div>
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Security Section - Bank-Level Trust */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-100 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 mb-6">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300">
                Enterprise Security
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Bank-Level Security Standards
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Your investments protected by the same security infrastructure used by Fortune 500 financial institutions
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {securityFeatures.map((feature, index) => (
              <motion.div key={index} variants={item}>
                <Card className="h-full border-2 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-2xl bg-white dark:bg-slate-900/50 backdrop-blur-sm group">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/25">
                        <feature.icon className="h-7 w-7 text-white" />
                      </div>
                      <Badge variant="secondary" className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                        {feature.badge}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Investment Features */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 mb-6">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-xs sm:text-sm font-semibold text-green-700 dark:text-green-300">
                Investment Performance
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Predictable, Transparent Returns
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Asset-backed investments delivering consistent monthly returns with complete visibility
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {investmentFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-2 border-slate-200 dark:border-slate-800 hover:border-green-300 dark:hover:border-green-700 transition-all hover:shadow-2xl bg-white dark:bg-slate-900/50 backdrop-blur-sm group">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-600 to-green-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-green-500/25">
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-3">{feature.metric}</div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Ready to Start Investing?
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Join thousands of investors who trust Opus Rental Capital for secure, 
              transparent, and profitable asset-backed investments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="h-14 sm:h-16 px-8 sm:px-10 text-base sm:text-lg font-bold bg-white text-blue-600 hover:bg-blue-50 shadow-2xl hover:shadow-white/20 transition-all w-full sm:w-auto group" 
                  data-testid="button-cta-register"
                >
                  Open Your Account
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-14 sm:h-16 px-8 sm:px-10 text-base sm:text-lg font-semibold border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 w-full sm:w-auto" 
                  data-testid="button-cta-login"
                >
                  Existing Client Login
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10 mt-12 pt-12 border-t border-white/20">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-200" />
                <span className="text-sm font-medium text-blue-100">FDIC Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-200" />
                <span className="text-sm font-medium text-blue-100">256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-blue-200" />
                <span className="text-sm font-medium text-blue-100">SEC Registered</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-200" />
                <span className="text-sm font-medium text-blue-100">SOC 2 Certified</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
            <div className="flex items-start gap-4 max-w-md">
              <img 
                src={logoPath} 
                alt="Opus Rental Capital" 
                className="h-12 w-12 rounded-xl shadow-md object-cover flex-shrink-0"
              />
              <div>
                <div className="font-bold text-lg text-slate-900 dark:text-white mb-2">Opus Rental Capital</div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  SEC-registered investment platform providing institutional-grade asset management 
                  services for commercial trailer investments in the North American market.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white mb-3">Legal</div>
                <div className="space-y-2 text-slate-600 dark:text-slate-400">
                  <div>Terms of Service</div>
                  <div>Privacy Policy</div>
                  <div>Risk Disclosure</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white mb-3">Company</div>
                <div className="space-y-2 text-slate-600 dark:text-slate-400">
                  <div>About Us</div>
                  <div>Careers</div>
                  <div>Contact</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white mb-3">Support</div>
                <div className="space-y-2 text-slate-600 dark:text-slate-400">
                  <div>Help Center</div>
                  <div>Documentation</div>
                  <div>Security</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div>© 2025 Opus Rental Capital. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <span>Member FINRA/SIPC</span>
              <span>•</span>
              <span>FDIC Insured</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
