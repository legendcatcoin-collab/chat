"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Moon, Sun, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { useTheme } from "next-themes";

export function SettingsModal({ open, setOpen }: { open: boolean; setOpen: (o: boolean) => void }) {
  const { apiKey, setApiKey, selectedModel, setSelectedModel, systemPrompt, setSystemPrompt } = useStore();
  const { theme, setTheme } = useTheme();
  
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [modelTestStatus, setModelTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [modelInput, setModelInput] = useState(selectedModel);

  const handleTestKey = async () => {
    if (!apiKey) return setTestStatus('error');
    setTestStatus('testing');
    try {
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      setTestStatus(res.ok ? 'success' : 'error');
    } catch {
      setTestStatus('error');
    }
    setTimeout(() => { if(testStatus !== 'testing') setTestStatus('idle'); }, 3000);
  };

  const handleTestModel = async () => {
    if (!apiKey || !modelInput) return setModelTestStatus('error');
    setModelTestStatus('testing');
    setSelectedModel(modelInput);
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: "POST",
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://aichat.app',
          'X-Title': 'Mobile AI Chat'
        },
        body: JSON.stringify({
          model: modelInput,
          messages: [{role: "user", content: "Hi"}]
        })
      });
      setModelTestStatus(res.ok ? 'success' : 'error');
    } catch {
      setModelTestStatus('error');
    }
    setTimeout(() => { if(modelTestStatus !== 'testing') setModelTestStatus('idle'); }, 3000);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pt-[env(safe-area-inset-top)]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative flex h-[90vh] sm:h-[80vh] w-full sm:max-w-md flex-col overflow-hidden bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-border bg-background z-10 sticky top-0">
              <h2 className="text-xl font-semibold">Settings</h2>
              <button onClick={() => setOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-[calc(20px+env(safe-area-inset-bottom))]">
              
              <div className="space-y-3">
                <label className="text-sm font-medium opacity-80">1. OpenRouter API Key</label>
                <div className="flex space-x-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="flex-1 rounded-xl border border-border bg-transparent px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                  />
                  <button
                    onClick={handleTestKey}
                    disabled={testStatus === 'testing' || !apiKey}
                    className="rounded-xl bg-primary text-white px-4 py-3 font-medium hover:opacity-90 disabled:opacity-50 text-sm"
                  >
                    {testStatus === 'testing' ? '...' : 'Test'}
                  </button>
                </div>
                {testStatus === 'success' && <p className="text-xs text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Valid Key</p>}
                {testStatus === 'error' && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Invalid Key</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium opacity-80 flex items-center gap-2">
                  2. Select & Test Model <Zap className="w-3 h-3 text-primary" />
                </label>
                <p className="text-xs opacity-50 -mt-1">Input any openrouter model ID manually.</p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="e.g. google/gemini-2.5-flash"
                    value={modelInput}
                    onChange={(e) => setModelInput(e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-transparent px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                  />
                  <button
                    onClick={handleTestModel}
                    disabled={modelTestStatus === 'testing' || !modelInput || !apiKey}
                    className="rounded-xl bg-black text-white dark:bg-white dark:text-black px-4 py-3 font-medium hover:opacity-90 disabled:opacity-50 text-sm"
                  >
                    {modelTestStatus === 'testing' ? '...' : 'Verify'}
                  </button>
                </div>
                {modelTestStatus === 'success' && <p className="text-xs text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Model Ready for Real-Time Chat</p>}
                {modelTestStatus === 'error' && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Model Request Failed</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium opacity-80">Default System Prompt</label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-transparent px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none text-sm"
                  placeholder="You are a helpful assistant..."
                />
              </div>

              <div className="flex items-center justify-between py-2 border-t border-border mt-4 pt-6">
                <span className="font-medium text-sm">Dark Mode</span>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
