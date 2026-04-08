"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500); // allow exit animation to run
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
            className="flex flex-col items-center justify-center space-y-4"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-white shadow-2xl">
              <Sparkles className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Chat</h1>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
