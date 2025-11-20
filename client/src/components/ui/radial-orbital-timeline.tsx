"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useState } from "react";

interface TimelineItem {
  id: number;
  title: string;
  content: string;
  icon: LucideIcon;
  status: "completed" | "in-progress" | "pending";
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
}

export default function RadialOrbitalTimeline({
  timelineData,
}: RadialOrbitalTimelineProps) {
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const centerX = 50;
  const centerY = 50;
  const radius = 35;

  const getOrbitPosition = (index: number, total: number) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  return (
    <div className="relative w-full aspect-square max-w-2xl mx-auto">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {/* Círculo orbital */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="rgba(33, 150, 243, 0.2)"
          strokeWidth="0.2"
          strokeDasharray="2 2"
        />

        {/* Linhas de conexão */}
        {timelineData.map((item, index) => {
          const pos = getOrbitPosition(index, timelineData.length);
          return (
            <motion.line
              key={`line-${item.id}`}
              x1={centerX}
              y1={centerY}
              x2={pos.x}
              y2={pos.y}
              stroke={
                selectedItem === item.id
                  ? "rgba(33, 150, 243, 0.6)"
                  : "rgba(255, 255, 255, 0.1)"
              }
              strokeWidth="0.15"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: index * 0.1 }}
            />
          );
        })}

        {/* Centro */}
        <motion.circle
          cx={centerX}
          cy={centerY}
          r="8"
          fill="url(#centerGradient)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        <defs>
          <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2196F3" />
            <stop offset="100%" stopColor="#0D2847" />
          </linearGradient>
        </defs>
      </svg>

      {/* Nós orbitais */}
      <div className="absolute inset-0">
        {timelineData.map((item, index) => {
          const pos = getOrbitPosition(index, timelineData.length);
          const Icon = item.icon;
          const isSelected = selectedItem === item.id;

          return (
            <motion.div
              key={item.id}
              className="absolute"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <motion.button
                className={`relative group ${
                  isSelected ? "z-20" : "z-10"
                }`}
                onClick={() =>
                  setSelectedItem(isSelected ? null : item.id)
                }
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-full blur-lg"
                  style={{
                    background:
                      item.status === "completed"
                        ? "rgba(33, 150, 243, 0.4)"
                        : item.status === "in-progress"
                        ? "rgba(33, 150, 243, 0.3)"
                        : "rgba(255, 255, 255, 0.1)",
                  }}
                  animate={{
                    scale: isSelected ? [1, 1.3, 1] : 1,
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />

                {/* Ícone */}
                <div
                  className={`relative w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isSelected
                      ? "bg-accent border-accent shadow-lg shadow-accent/50"
                      : "bg-white/5 border-white/20 hover:border-accent/50"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 transition-colors ${
                      isSelected ? "text-white" : "text-accent"
                    }`}
                  />
                </div>

                {/* Label */}
                <motion.div
                  className="absolute top-full mt-3 left-1/2 -translate-x-1/2 whitespace-nowrap"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 + 0.3 }}
                >
                  <div className="text-xs font-semibold text-white/80 text-center">
                    {item.title}
                  </div>
                </motion.div>

                {/* Tooltip expandido */}
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute top-full mt-12 left-1/2 -translate-x-1/2 w-64 z-30"
                  >
                    <div className="bg-gradient-to-br from-[#0D2847] to-[#0a1f38] border border-accent/30 rounded-xl p-4 shadow-2xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-accent" />
                        </div>
                        <h4 className="font-bold text-white">{item.title}</h4>
                      </div>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
