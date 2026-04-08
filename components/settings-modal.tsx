"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { X, Moon, Sun, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { useTheme } from "next-themes";

export function SettingsModal({ open, setOpen }: { open: boolean; setOpen: (o: boolean) => void }) {
  const {
    apiKey, setApiKey,
    selectedModel, setSelectedModel,
    systemPrompt, setSystemPrompt,
    textSize, setTextSize,
    accentColor, setAccentColor,
    fontFamily, setFontFamily,
  } = useStore();
  const { theme, setTheme } = useTheme();

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [modelTestStatus, setModelTestStatus] = useState<string>('idle');
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
    setTimeout(() => setTestStatus('idle'), 3500);
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
          messages: [{ role: "user", content: "Hi" }]
        })
      });
      if (!res.ok) {
        const text = await res.text();
        setModelTestStatus(text);
      } else {
        setModelTestStatus('success');
        setTimeout(() => setModelTestStatus('idle'), 3500);
      }
    } catch (err: any) {
      setModelTestStatus(err.message);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
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
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-background z-10 sticky top-0">
              <h2 className="text-xl font-semibold">Settings</h2>
              <button onClick={() => setOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-10">

              {/* API Key */}
              <div className="space-y-3">
                <label className="text-sm font-semibold opacity-80">1. OpenRouter API Key</label>
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
                {testStatus === 'success' && (
                  <p className="text-xs text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Valid Key</p>
                )}
                {testStatus === 'error' && (
                  <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Invalid Key</p>
                )}
              </div>

              {/* Model */}
              <div className="space-y-3">
                <label className="text-sm font-semibold opacity-80 flex items-center gap-2">
                  2. Select & Test Model <Zap className="w-3 h-3 text-primary" />
                </label>
                <p className="text-xs opacity-50">Enter any OpenRouter model ID (e.g. google/gemini-2.5-flash)</p>
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
                {modelTestStatus === 'success' && (
                  <p className="text-xs text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Model Ready</p>
                )}
                {modelTestStatus !== 'idle' && modelTestStatus !== 'testing' && modelTestStatus !== 'success' && modelTestStatus !== 'error' && (
                  <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 break-words flex items-start gap-1">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="flex-1">{modelTestStatus}</span>
                  </div>
                )}
                {modelTestStatus === 'error' && (
                  <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Model Request Failed</p>
                )}
              </div>

              {/* System Prompt */}
              <div className="space-y-3">
                <label className="text-sm font-semibold opacity-80">Default System Prompt</label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-transparent px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none text-sm"
                  placeholder="You are a helpful assistant..."
                />
              </div>

              {/* Appearance */}
              <div className="pt-4 border-t border-border space-y-5">
                <span className="font-bold text-base block">Appearance</span>

                {/* Text Size */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Text Size</span>
                  <select
                    value={textSize}
                    onChange={(e) => setTextSize(e.target.value as any)}
                    className="rounded-lg border border-border bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="small">Small</option>
                    <option value="normal">Normal</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                {/* Font Family */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Font Family</span>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="rounded-lg border border-border bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="sans-serif">System Sans</option>
                    <option value="serif">System Serif</option>
                    <option value="monospace">Monospace</option>
                    <option value="'Courier New', Courier, monospace">Courier New</option>
                    <option value="'Times New Roman', Times, serif">Times New Roman</option>
                  </select>
                </div>

                {/* Accent Color */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Accent Color</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-9 w-9 rounded-lg cursor-pointer border border-border bg-transparent p-0.5"
                    />
                    <span className="text-xs opacity-50 uppercase font-mono">{accentColor}</span>
                  </div>
                </div>

                {/* Dark Mode */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Dark Mode</span>
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  >
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
