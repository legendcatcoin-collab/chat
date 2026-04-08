"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Moon, Sun, CheckCircle2, AlertCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { freeModels } from "@/lib/openrouter-models";

export function SettingsModal({ open, setOpen }: { open: boolean; setOpen: (o: boolean) => void }) {
  const { apiKey, setApiKey, selectedModel, setSelectedModel, systemPrompt, setSystemPrompt } = useStore();
  const { theme, setTheme } = useTheme();
  
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [search, setSearch] = useState("");

  const filteredModels = freeModels.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  const handleTestKey = async () => {
    if (!apiKey) {
      setTestStatus('error');
      return;
    }
    setTestStatus('testing');
    try {
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (res.ok) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
      }
    } catch {
      setTestStatus('error');
    }
    setTimeout(() => {
     if(testStatus !== 'testing') setTestStatus('idle'); // clear after a while
    }, 3000);
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
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-xl font-semibold">Settings</h2>
              <button onClick={() => setOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-[calc(20px+env(safe-area-inset-bottom))]">
              
              <div className="space-y-3">
                <label className="text-sm font-medium opacity-80">OpenRouter API Key (Optional)</label>
                <div className="flex space-x-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="flex-1 rounded-xl border border-border bg-transparent px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                  <button
                    onClick={handleTestKey}
                    disabled={testStatus === 'testing' || !apiKey}
                    className="rounded-xl bg-black/5 dark:bg-white/10 px-4 py-3 font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    Test
                  </button>
                </div>
                {testStatus === 'success' && <p className="text-sm text-green-500 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> API Key is valid</p>}
                {testStatus === 'error' && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Invalid API Key</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium opacity-80">AI Model</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 h-4 w-4 opacity-50" />
                  <input
                    type="text"
                    placeholder="Search models..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-border bg-transparent pl-9 pr-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div className="max-h-52 overflow-y-auto space-y-2 rounded-xl border border-border p-2 bg-black/5 dark:bg-white/5">
                  {filteredModels.map(m => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedModel(m.id)}
                      className={`cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors ${
                        selectedModel === m.id ? "bg-primary text-white" : "hover:bg-black/10 dark:hover:bg-white/10"
                      }`}
                    >
                      {m.name}
                    </div>
                  ))}
                  {filteredModels.length === 0 && <p className="text-center text-sm opacity-50 py-4">No models found</p>}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium opacity-80">System Prompt</label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-transparent px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                  placeholder="You are a helpful assistant..."
                />
              </div>

              <div className="flex items-center justify-between py-2 border-t border-border mt-4 pt-6">
                <span className="font-medium">Appearance</span>
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
