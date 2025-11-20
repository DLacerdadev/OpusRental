import { useEffect, useState } from "react";

export function useTheme() {
  const [theme] = useState<"light">("light");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
    localStorage.setItem("theme", "light");
  }, []);

  return { 
    theme, 
    setTheme: () => {}, 
    toggleTheme: () => {} 
  };
}
