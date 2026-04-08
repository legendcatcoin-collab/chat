"use client"

import { useStore } from "@/lib/store";
import { useEffect } from "react";

export function Customizer() {
  const { textSize, accentColor, fontFamily } = useStore();

  const sizeMap = {
    small: '14px',
    normal: '16px',
    large: '18px'
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', accentColor);
    document.documentElement.style.fontSize = sizeMap[textSize];
    document.body.style.fontFamily = fontFamily;
  }, [textSize, accentColor, fontFamily]);

  return null;
}
