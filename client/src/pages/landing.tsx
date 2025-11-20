import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, Lock, Eye, TrendingUp, MapPin, DollarSign, 
  CheckCircle, ArrowRight, Award, FileText, BarChart3,
  Users, Clock, Briefcase, Target, PieChart, Zap
} from "lucide-react";
import { useTranslation } from "react-i18next";
import logoPath from "@assets/image_1759264185138.png";

export default function Landing() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-[#0B1120]">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 w-full bg-[#0B1120]/98 backdrop-blur-sm border-b border-gray-700 z-50">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <img src={logoPath} alt="Opus" className="h-12 w-12 rounded-lg shadow-lg" />
              <div>
                <h1 className="text-lg font-bold text-white">Opus Rental Capital</h1>
                <p className="text-xs text-gray-300">{t('landing.nav.tagline', 'Investment Management')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => {
                const newLang = i18n.language.startsWith("en") ? "pt-BR" : "en-US";
                i18n.changeLanguage(newLang);
                localStorage.setItem('language', newLang);
              }} className="text-white hover:text-white hover:bg-white/10 font-medium">
                {i18n.language.startsWith("en") ? "PT" : "EN"}
              </Button>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-white/10 font-semibold">
                  {t('landing.nav.login', 'Client Access')}
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-lg">
                  {t('landing.nav.getStarted', 'Open Account')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div>
              <Badge className="mb-6 bg-blue-600/20 text-blue-300 border-blue-500 px-4 py-2 text-sm font-bold">
                <Shield className="h-4 w-4 mr-2" />
                {t('landing.hero.badge', 'SEC Registered • FINRA Member • SIPC Protected')}
              </Badge>
              
              <h1 className="text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                {t('landing.hero.title', 'Institutional-Grade')}
                <br />
                <span className="text-blue-400">{t('landing.hero.subtitle', 'Asset Management')}</span>
              </h1>
              
              <p className="text-xl text-gray-200 mb-8 leading-relaxed font-medium">
                {t('landing.hero.description', 'Fixed-income investments backed by GPS-tracked commercial trailers. Transparent reporting, guaranteed returns, institutional oversight.')}
              </p>

              {/* Security Badges */}
              <div className="flex flex-wrap gap-4 mb-10">
                {[
                  { icon: Lock, text: '256-bit Encryption' },
                  { icon: Shield, text: 'SOC 2 Certified' },
                  { icon: Award, text: 'Independently Audited' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white/10 border-2 border-gray-600 rounded-lg px-4 py-2.5">
                    <item.icon className="h-5 w-5 text-blue-400" />
                    <span className="text-sm text-white font-bold">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-black px-10 h-16 text-lg shadow-xl">
                    {t('landing.cta.start', 'Start Investing')}
                    <ArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="border-3 border-gray-400 text-white hover:bg-white/10 font-black px-10 h-16 text-lg">
                    {t('landing.cta.portal', 'Client Portal')}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Metrics Grid */}
            <div className="grid grid-cols-2 gap-6">
              {[
                { 
                  value: "24%", 
                  label: "Annual Return", 
                  sublabel: "Fixed Rate",
                  icon: TrendingUp,
                  bg: "bg-green-600/20",
                  border: "border-green-500"
                },
                { 
                  value: "$28K", 
                  label: "Per Share", 
                  sublabel: "1 Trailer",
                  icon: DollarSign,
                  bg: "bg-blue-600/20",
                  border: "border-blue-500"
                },
                { 
                  value: "100%", 
                  label: "Asset Backed", 
                  sublabel: "Physical Assets",
                  icon: Shield,
                  bg: "bg-purple-600/20",
                  border: "border-purple-500"
                },
                { 
                  value: "24/7", 
                  label: "GPS Tracking", 
                  sublabel: "Real-Time",
                  icon: MapPin,
                  bg: "bg-orange-600/20",
                  border: "border-orange-500"
                }
              ].map((stat, i) => (
                <div key={i} className={`${stat.bg} border-3 ${stat.border} rounded-2xl p-8`}>
                  <stat.icon className="h-10 w-10 text-white mb-4" />
                  <div className="text-5xl font-black text-white mb-2">{stat.value}</div>
                  <div className="text-sm font-bold text-white">{stat.label}</div>
                  <div className="text-xs text-gray-200 mt-1">{stat.sublabel}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 px-8 border-y border-gray-700 bg-white/5">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "$42M", label: "Assets Under Management" },
              { value: "2,847", label: "Active Trailers" },
              { value: "2,500+", label: "Active Investors" },
              { value: "100%", label: "On-Time Payments (48mo)" }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-black text-white mb-2">{item.value}</div>
                <div className="text-sm text-gray-200 font-semibold">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section - PRIMARY */}
      <section className="py-24 px-8 bg-gradient-to-b from-[#0B1120] to-[#162339]">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-600/30 text-white border-blue-400 px-6 py-2 text-base font-bold">
              {t('landing.security.badge', 'Security & Compliance')}
            </Badge>
            <h2 className="text-5xl lg:text-6xl font-black text-white mb-4">
              {t('landing.security.title', 'Bank-Level Security Standards')}
            </h2>
            <p className="text-2xl text-gray-200 max-w-3xl mx-auto font-medium">
              {t('landing.security.subtitle', 'Your investments protected by enterprise-grade infrastructure')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Data Protection */}
            <Card className="bg-gradient-to-br from-blue-900/40 to-blue-800/30 border-3 border-blue-500">
              <CardContent className="p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-16 w-16 rounded-xl bg-blue-600 flex items-center justify-center">
                    <Lock className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white">{t('landing.security.data', 'Data Protection')}</h3>
                    <p className="text-base text-gray-200 font-semibold">{t('landing.security.dataDesc', 'Military-grade encryption')}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { title: "256-bit SSL/TLS Encryption", desc: "All data encrypted in transit and at rest" },
                    { title: "SOC 2 Type II Certified", desc: "Independently audited security controls" },
                    { title: "Multi-Factor Authentication", desc: "Additional account protection layer" },
                    { title: "Regular Security Audits", desc: "Quarterly penetration testing" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-5 bg-white/10 rounded-lg border-2 border-white/20">
                      <CheckCircle className="h-6 w-6 text-blue-300 flex-shrink-0 mt-1" />
                      <div>
                        <div className="text-base font-bold text-white mb-1">{item.title}</div>
                        <div className="text-sm text-gray-200">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Regulatory Compliance */}
            <Card className="bg-gradient-to-br from-green-900/40 to-green-800/30 border-3 border-green-500">
              <CardContent className="p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-16 w-16 rounded-xl bg-green-600 flex items-center justify-center">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white">{t('landing.security.compliance', 'Regulatory Compliance')}</h3>
                    <p className="text-base text-gray-200 font-semibold">{t('landing.security.complianceDesc', 'Full transparency')}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { title: "Independent Asset Audits", desc: "Third-party trailer verification" },
                    { title: "Legal Documentation", desc: "Attorney-reviewed contracts" },
                    { title: "Financial Reporting", desc: "Monthly and annual reports" },
                    { title: "Regulatory Filings", desc: "Securities compliance" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-5 bg-white/10 rounded-lg border-2 border-white/20">
                      <CheckCircle className="h-6 w-6 text-green-300 flex-shrink-0 mt-1" />
                      <div>
                        <div className="text-base font-bold text-white mb-1">{item.title}</div>
                        <div className="text-sm text-gray-200">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Investment Structure */}
      <section className="py-24 px-8 bg-[#0B1120]">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-600/30 text-white border-blue-400 px-6 py-2 text-base font-bold">
              {t('landing.structure.badge', 'Investment Structure')}
            </Badge>
            <h2 className="text-5xl lg:text-6xl font-black text-white mb-4">
              {t('landing.structure.title', 'Transparent & Simple')}
            </h2>
            <p className="text-2xl text-gray-200 max-w-3xl mx-auto font-medium">
              {t('landing.structure.subtitle', 'Every dollar backed by physical assets')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: DollarSign,
                title: "$28,000",
                subtitle: "Investment Per Share",
                points: [
                  "1 share = 1 commercial trailer",
                  "$560 monthly return guaranteed",
                  "2% fixed monthly rate (24% annual)",
                  "Direct ownership certificate"
                ]
              },
              {
                icon: BarChart3,
                title: "$1,500",
                subtitle: "Monthly Rental Revenue",
                points: [
                  "Leased to verified carriers",
                  "3-12 month contracts",
                  "Insurance-backed operations",
                  "Professional fleet management"
                ]
              },
              {
                icon: MapPin,
                title: "24/7",
                subtitle: "Real-Time GPS Tracking",
                points: [
                  "Live location monitoring",
                  "Movement alerts & history",
                  "Asset health tracking",
                  "Depreciation monitoring"
                ]
              }
            ].map((item, i) => (
              <Card key={i} className="bg-white/5 border-3 border-gray-600 hover:border-blue-500 transition-all">
                <CardContent className="p-10">
                  <div className="h-16 w-16 rounded-xl bg-blue-600 flex items-center justify-center mb-8">
                    <item.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-4xl font-black text-white mb-2">{item.title}</div>
                  <div className="text-base text-gray-200 mb-8 font-semibold">{item.subtitle}</div>
                  <div className="space-y-3">
                    {item.points.map((point, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-1" />
                        <span className="text-base text-white font-medium">{point}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Timeline */}
      <section className="py-24 px-8 bg-gradient-to-b from-[#162339] to-[#0B1120]">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-600/30 text-white border-blue-400 px-6 py-2 text-base font-bold">
              {t('landing.process.badge', 'Investment Process')}
            </Badge>
            <h2 className="text-5xl lg:text-6xl font-black text-white mb-4">
              {t('landing.process.title', 'Get Started in 4 Steps')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { num: "01", icon: FileText, title: "Register Account", desc: "5-minute KYC verification" },
              { num: "02", icon: Target, title: "Select Assets", desc: "Browse available trailers" },
              { num: "03", icon: DollarSign, title: "Fund Investment", desc: "Secure payment transfer" },
              { num: "04", icon: TrendingUp, title: "Earn Monthly", desc: "Automated returns" }
            ].map((step, i) => (
              <div key={i} className="bg-white/5 border-3 border-gray-600 hover:border-blue-500 rounded-2xl p-8 transition-all">
                <div className="text-6xl font-black text-white/20 mb-4">{step.num}</div>
                <div className="h-14 w-14 rounded-lg bg-blue-600 flex items-center justify-center mb-6">
                  <step.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-black text-white mb-3">{step.title}</h3>
                <p className="text-base text-gray-200 font-medium">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-8 bg-gradient-to-r from-blue-900 to-blue-800 border-y border-blue-600">
        <div className="max-w-[1000px] mx-auto text-center">
          <h2 className="text-5xl lg:text-6xl font-black text-white mb-6">
            {t('landing.final.title', 'Ready to Start Investing?')}
          </h2>
          <p className="text-2xl text-gray-100 mb-10 font-semibold">
            {t('landing.final.subtitle', 'Join thousands of investors earning guaranteed returns')}
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white hover:bg-gray-100 text-blue-900 font-black px-12 h-20 text-xl shadow-2xl">
                {t('landing.final.cta', 'Open Your Account')}
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="border-3 border-white text-white hover:bg-white/10 font-black px-12 h-20 text-xl">
                {t('landing.final.portal', 'Access Client Portal')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-8 border-t border-gray-700 bg-[#0B1120]">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src={logoPath} alt="Opus" className="h-10 w-10 rounded-lg" />
                <div>
                  <div className="font-black text-white text-lg">Opus Rental Capital</div>
                  <div className="text-sm text-gray-300">{t('landing.footer.tagline', 'Investment Management')}</div>
                </div>
              </div>
              <p className="text-base text-gray-200 leading-relaxed font-medium">
                {t('landing.footer.description', 'Professional asset management platform delivering guaranteed returns since 2020.')}
              </p>
            </div>

            {[
              { title: "Company", links: ["About", "Careers", "Press"] },
              { title: "Legal", links: ["Terms", "Privacy", "Compliance"] }
            ].map((section, i) => (
              <div key={i}>
                <h3 className="font-black text-white mb-4">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-base text-gray-200 hover:text-white transition-colors font-medium">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-base text-gray-200 font-semibold">
              {t('landing.footer.copyright', '© 2025 Opus Rental Capital. All rights reserved.')}
            </p>
            <p className="text-sm text-gray-300">
              {t('landing.footer.disclaimer', 'Investments carry risk. Past performance does not guarantee future results.')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
