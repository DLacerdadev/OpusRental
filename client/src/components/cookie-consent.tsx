import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

export function CookieConsent() {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setTimeout(() => setShowBanner(true), 1000);
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
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-[100]"
        >
          <div className="bg-[#0D2847]/95 backdrop-blur-xl border border-[#2196F3]/30 rounded-xl shadow-2xl shadow-[#2196F3]/20 overflow-hidden">
            {/* Barra superior com gradiente */}
            <div className="h-1 bg-gradient-to-r from-[#2196F3] via-[#0D2847] to-[#2196F3]" />
            
            <div className="p-6">
              {/* Header compacto */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#2196F3]/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-[#2196F3]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {t('cookies.title')}
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Conforme LGPD e GDPR
                    </p>
                  </div>
                </div>
                <button
                  onClick={rejectCookies}
                  className="text-white/40 hover:text-white/80 transition-colors"
                  data-testid="button-close-cookies"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Descrição compacta */}
              <p className="text-white/70 text-sm leading-relaxed mb-5">
                {t('cookies.description')}
              </p>

              {/* Botões lado a lado */}
              <div className="flex gap-3">
                <Button
                  onClick={acceptCookies}
                  className="flex-1 bg-[#2196F3] hover:bg-[#2196F3]/90 text-white font-semibold h-10 shadow-lg shadow-[#2196F3]/30"
                  data-testid="button-accept-cookies"
                >
                  {t('cookies.accept')}
                </Button>
                <Button
                  onClick={rejectCookies}
                  variant="outline"
                  className="flex-1 border-white/20 text-white/90 hover:bg-white/10 h-10"
                  data-testid="button-reject-cookies"
                >
                  {t('cookies.reject')}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
