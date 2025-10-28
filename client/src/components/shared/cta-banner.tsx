import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, LucideIcon } from "lucide-react";
import { Link } from "wouter";

interface CTABannerProps {
  title: string;
  description?: string;
  buttonText: string;
  buttonHref: string;
  icon?: LucideIcon;
  gradient?: string;
  onButtonClick?: () => void;
}

export function CTABanner({
  title,
  description,
  buttonText,
  buttonHref,
  icon: Icon,
  gradient = "from-[hsl(210,70%,15%)] via-[hsl(210,60%,20%)] to-[hsl(210,50%,25%)]",
  onButtonClick,
}: CTABannerProps) {
  const ButtonContent = () => (
    <Button
      className="bg-accent hover:bg-accent/90 text-white font-semibold gap-2 h-11 px-6 shadow-lg hover:shadow-xl transition-all"
      data-testid="cta-button"
      onClick={onButtonClick}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {buttonText}
      <ArrowRight className="h-4 w-4" />
    </Button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${gradient} p-6 sm:p-8 lg:p-10 mb-6 shadow-2xl`}
      data-testid="cta-banner"
    >
      {/* Efeito de brilho/overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2" data-testid="cta-title">
            {title}
          </h2>
          {description && (
            <p className="text-sm sm:text-base text-white/80 max-w-2xl" data-testid="cta-description">
              {description}
            </p>
          )}
        </div>
        
        <div className="flex-shrink-0">
          {onButtonClick ? (
            <ButtonContent />
          ) : (
            <Link href={buttonHref}>
              <ButtonContent />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
