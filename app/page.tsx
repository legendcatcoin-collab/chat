"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Sidebar } from "@/components/sidebar";
import { SettingsModal } from "@/components/settings-modal";
import { SplashScreen } from "@/components/splash-screen";
import { ChatMessage } from "@/components/chat-message";
import { Menu, SendHorizontal, StopCircle, ArrowDown } from "lucide-react";
import { freeModels } from "@/lib/openrouter-models";

export default function Home() {
  const [splashDone, setSplashDone] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    sessions,
    activeSessionId,
    createSession,
    addMessage,
    updateMessage,
    apiKey,
    selectedModel,
    systemPrompt,
  } = useStore();

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // Initialize session if none exists after splash
  useEffect(() => {
    if (splashDone && !activeSessionId) {
      createSession();
    }
  }, [splashDone, activeSessionId, createSession]);

  const scrollToBottom = (smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages.length]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollDown(!isAtBottom);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !activeSessionId) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message
    addMessage(activeSessionId, { role: "user", content: userMessage });
    
    setIsTyping(true);
    abortControllerRef.current = new AbortController();

    try {
      // Add a temporary empty bot message
      addMessage(activeSessionId, { role: "assistant", content: "" });
      const currentMessages = useStore.getState().sessions.find(s => s.id === activeSessionId)?.messages || [];
      const botMessageId = currentMessages[currentMessages.length - 1].id;

      // Ensure we send the full conversation history to the API
      const messagesToSend = currentMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
      
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesToSend,
          apiKey,
          model: selectedModel,
          systemPrompt,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedResponse = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((line) => line.trim() !== "");
          
          for (const line of lines) {
            if (line === "data: [DONE]") continue;
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.replace("data: ", ""));
                if (data.choices?.[0]?.delta?.content) {
                  accumulatedResponse += data.choices[0].delta.content;
                  updateMessage(activeSessionId, botMessageId, accumulatedResponse);
                  // Optional: debounce scroll on very fast streams, but we'll stick to basic
                  if(!showScrollDown) scrollToBottom(false);
                }
              } catch (e) {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Request aborted");
      } else {
        const currentMsgs = useStore.getState().sessions.find(s => s.id === activeSessionId)?.messages || [];
        if(currentMsgs.length > 0) {
            const badMsgId = currentMsgs[currentMsgs.length - 1].id;
             updateMessage(activeSessionId, badMsgId, `**Error:** ${error.message || "Something went wrong. Please check your API key or connection."}`);
        }
      }
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const activeModelName = freeModels.find(m => m.id === selectedModel)?.name || "AI Assistant";

  return (
    <main className="flex h-[100dvh] w-full flex-col bg-background overflow-hidden relative">
      {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}

      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between px-4 mt-[env(safe-area-inset-top)] border-b border-border z-30 bg-background/80 backdrop-blur-md">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-transform"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex flex-col items-center">
          <span className="font-semibold text-lg leading-tight tracking-tight">AI Chat</span>
          <span className="text-[10px] uppercase tracking-wider opacity-50 font-medium">{activeModelName}</span>
        </div>
        <div className="w-9" /> {/* spacer for center alignment */}
      </header>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto w-full no-scrollbar pt-4 pb-24 scroll-smooth"
      >
        {activeSession?.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-4">
            <div className="h-16 w-16 bg-primary/20 text-primary rounded-full flex items-center justify-center">
               <Menu className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium">How can I help you today?</p>
          </div>
        ) : (
          <div className="flex flex-col max-w-3xl mx-auto pb-4">
             {activeSession?.messages.map((message, i) => (
               <ChatMessage key={message.id} message={message} isLast={i === activeSession.messages.length - 1} />
             ))}
             {isTyping && (
               <div className="flex justify-start px-4 py-4 animate-fade-in">
                 <div className="bg-message-bot border border-border px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center space-x-1">
                   <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                   <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                   <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" />
                 </div>
               </div>
             )}
             <div ref={bottomRef} className="h-1" />
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollDown && (
        <button 
          onClick={() => scrollToBottom()}
          className="absolute bottom-24 right-4 z-40 bg-background border border-border shadow-md rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
        >
          <ArrowDown className="h-5 w-5 opacity-70" />
        </button>
      )}

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)] px-4 py-3">
        <form 
          onSubmit={handleSend}
          className="relative flex items-end w-full max-w-3xl mx-auto rounded-3xl border border-border bg-background shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all pr-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message AI..."
            rows={1}
            className="w-full bg-transparent px-4 py-3.5 pr-12 text-[15px] outline-none max-h-32 min-h-[44px] resize-none no-scrollbar rounded-3xl"
            style={{ 
              height: "auto", 
              // Basic auto-grow calculation can be added, for now keep simple max-height via CSS classes
            }}
          />
          <div className="absolute right-2 bottom-2 flex">
             {isTyping ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white shadow hover:opacity-90 active:scale-95 transition-all"
                >
                  <StopCircle className="h-5 w-5" />
                </button>
             ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow hover:opacity-90 disabled:bg-opacity-50 disabled:grayscale transition-all active:scale-95"
                >
                  <SendHorizontal className="h-4 w-4" />
                </button>
             )}
          </div>
        </form>
        <p className="text-center text-[10px] mt-2 opacity-40 font-medium">AI can make mistakes. Consider verifying important information.</p>
      </div>

      <Sidebar 
        open={sidebarOpen} 
        setOpen={setSidebarOpen} 
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <SettingsModal 
        open={settingsOpen} 
        setOpen={setSettingsOpen} 
      />
    </main>
  );
}
