import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, X, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

export function CookieConsent() {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setTimeout(() => setShowBanner(true), 1500);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShowBanner(false);
  };

  const rejectCookies = () => {
    localStorage.setItem("cookie-consent", "rejected");
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-[100] w-[420px] max-w-[calc(100vw-3rem)]"
        >
          <div className="relative bg-gradient-to-br from-[#0D2847] to-[#0a1f38] rounded-2xl shadow-2xl shadow-[#2196F3]/30 border border-[#2196F3]/20 overflow-hidden">
            {/* Borda animada no topo */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#2196F3] to-transparent" />
            
            {/* Background pattern sutil */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, #2196F3 1px, transparent 1px), radial-gradient(circle at 80% 80%, #2196F3 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
              }} />
            </div>

            <div className="relative p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#2196F3]/30 to-[#2196F3]/10 border border-[#2196F3]/30 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-[#2196F3]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {t('cookies.title')}
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Conforme LGPD e GDPR
                    </p>
                  </div>
                </div>
                <button
                  onClick={rejectCookies}
                  className="text-white/30 hover:text-white/80 transition-colors p-1"
                  data-testid="button-close-cookies"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Descrição */}
              <p className="text-sm text-white/70 leading-relaxed mb-4">
                {t('cookies.description')}
              </p>

              {/* Features com checkmarks */}
              <div className="space-y-2 mb-5">
                {[
                  t('cookies.feature1'),
                  t('cookies.feature2'),
                  t('cookies.feature3')
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-4 h-4 rounded-full bg-[#2196F3]/20 border border-[#2196F3]/40 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-[#2196F3]" />
                      </div>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      {feature}
                    </p>
                  </div>
                ))}
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <Button
                  onClick={acceptCookies}
                  className="flex-1 bg-[#2196F3] hover:bg-[#2196F3]/90 text-white font-semibold h-11 shadow-lg shadow-[#2196F3]/40 border border-[#2196F3]/50"
                  data-testid="button-accept-cookies"
                >
                  {t('cookies.accept')}
                </Button>
                <Button
                  onClick={rejectCookies}
                  variant="outline"
                  className="flex-1 border-white/20 text-white/90 hover:bg-white/10 h-11 font-medium"
                  data-testid="button-reject-cookies"
                >
                  {t('cookies.reject')}
                </Button>
              </div>
            </div>

            {/* Glow effect no bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#2196F3]/30 to-transparent" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
