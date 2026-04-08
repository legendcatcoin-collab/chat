"use client";

import 'regenerator-runtime/runtime';
import { useEffect, useRef, useState } from "react";
import { useStore, AppMode } from "@/lib/store";
import { Sidebar } from "@/components/sidebar";
import { SettingsModal } from "@/components/settings-modal";
import { SplashScreen } from "@/components/splash-screen";
import { ChatMessage } from "@/components/chat-message";
import { Menu, SendHorizontal, StopCircle, ArrowDown, Mic, Image as ImageIcon, Code2, MessageSquare, MoonStar, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

const modes: { id: AppMode; label: string; icon: React.ReactNode }[] = [
  { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'code', label: 'Code', icon: <Code2 className="w-4 h-4" /> },
  { id: 'image', label: 'Image', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'islamic', label: 'Islamic', icon: <MoonStar className="w-4 h-4" /> },
];

export default function Home() {
  const [splashDone, setSplashDone] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [imageAttachment, setImageAttachment] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    mode,
    setMode
  } = useStore();

  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  // Handle Speech updates
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

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
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageAttachment(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const finalInput = input.trim();
    if (!finalInput || !activeSessionId) return;

    if (listening) {
      SpeechRecognition.stopListening();
    }

    setInput("");
    const attachedImage = imageAttachment;
    setImageAttachment(null);
    resetTranscript();

    addMessage(activeSessionId, { role: "user", content: finalInput, image: attachedImage || undefined });
    
    setIsTyping(true);
    abortControllerRef.current = new AbortController();

    try {
      addMessage(activeSessionId, { role: "assistant", content: "" });
      const currentMessages = useStore.getState().sessions.find(s => s.id === activeSessionId)?.messages || [];
      const botMessageId = currentMessages[currentMessages.length - 1].id;

      const messagesToSend = currentMessages.slice(0, -1).map(m => ({ 
        role: m.role, 
        content: m.content,
        image: m.image
      }));
      
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesToSend,
          apiKey,
          model: selectedModel,
          systemPrompt,
          mode
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) throw new Error(await res.text());
      if (!res.body) throw new Error("No response");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedResponse = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter(Boolean);
          
          for (const line of lines) {
            if (line === "data: [DONE]") continue;
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.replace("data: ", ""));
                if (data.choices?.[0]?.delta?.content) {
                  accumulatedResponse += data.choices[0].delta.content;
                  updateMessage(activeSessionId, botMessageId, accumulatedResponse);
                  if(!showScrollDown) scrollToBottom(false);
                }
              } catch { } // ignore incomplete chunks
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        const currentMsgs = useStore.getState().sessions.find(s => s.id === activeSessionId)?.messages || [];
        if(currentMsgs.length > 0) {
            const badMsgId = currentMsgs[currentMsgs.length - 1].id;
             updateMessage(activeSessionId, badMsgId, `**Error:** ${error.message}`);
        }
      }
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const toggleListen = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      setInput("");
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  return (
    <main className="flex h-[100dvh] w-full flex-col bg-background overflow-hidden relative font-sans text-foreground">
      {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}

      <header className="flex h-16 shrink-0 items-center justify-between px-4 mt-[env(safe-area-inset-top)] bg-background/90 backdrop-blur-xl z-30 border-b border-border shadow-sm">
        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all">
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg leading-tight tracking-tight">@sumon_xe</span>
          <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold">{selectedModel?.split('/').pop() || 'Waiting'}</span>
        </div>
        <div className="w-10" />
      </header>

      {/* Mode Selector */}
      <div className="z-20 w-full overflow-x-auto no-scrollbar bg-background/80 backdrop-blur-md border-b border-border py-2 px-4 shadow-sm">
        <div className="flex space-x-2 w-max mx-auto">
          {modes.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                mode === m.id ? 'bg-primary text-white shadow-md scale-105' : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 opacity-70'
              }`}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {listening && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-40">
           <div className="bg-primary text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center space-x-3 animate-pulse">
              <Mic className="w-4 h-4 animate-bounce" />
              <span className="text-sm font-semibold tracking-wide">Listening...</span>
           </div>
        </div>
      )}

      {/* Chat Area */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto w-full no-scrollbar pt-2 pb-32 scroll-smooth">
        {activeSession?.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-40 space-y-4">
            <MessageSquare className="h-12 w-12 text-primary" />
            <p className="text-sm font-medium tracking-wide">Ready to assist you</p>
          </div>
        ) : (
          <div className="flex flex-col max-w-3xl mx-auto pb-4">
             {activeSession?.messages.map((message, i) => (
               <ChatMessage key={message.id} message={message} />
             ))}
             {isTyping && (
               <div className="flex justify-start px-4 py-4 animate-fade-in">
                 <div className="bg-message-bot border border-border px-5 py-3.5 rounded-3xl rounded-bl-sm shadow-sm flex items-center space-x-3">
                   <div className="flex space-x-1">
                     <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                     <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                     <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
                   </div>
                   <span className="text-xs font-medium opacity-50 tracking-wider">THINKING</span>
                 </div>
               </div>
             )}
             <div ref={bottomRef} className="h-4" />
          </div>
        )}
      </div>

      {showScrollDown && (
        <button onClick={() => scrollToBottom()} className="absolute bottom-28 right-4 z-40 bg-background border border-border shadow-lg rounded-full p-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-all">
          <ArrowDown className="h-5 w-5 opacity-70" />
        </button>
      )}

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-background/90 backdrop-blur-xl border-t border-border pb-[calc(10px+env(safe-area-inset-bottom))] px-4 pt-3">
        {imageAttachment && (
          <div className="relative w-16 h-16 mb-2 rounded-xl border border-border shadow-sm overflow-hidden bg-white">
            <img src={imageAttachment} alt="attach" className="w-full h-full object-cover" />
            <button onClick={() => setImageAttachment(null)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 backdrop-blur-sm"><X className="w-3 h-3"/></button>
          </div>
        )}
        <form onSubmit={handleSend} className="relative flex items-end w-full max-w-3xl mx-auto rounded-3xl border border-border bg-background shadow-md focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all pr-2 pl-1">
          
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 ml-1 mt-auto mb-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 opacity-60 hover:opacity-100 transition-colors">
            <ImageIcon className="w-5 h-5" />
          </button>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={listening ? "Listening to your voice..." : `Send a message in ${mode} mode...`}
            className="w-full bg-transparent px-2 py-4 pr-24 text-[15px] outline-none max-h-32 min-h-[44px] resize-none no-scrollbar self-center"
            rows={1}
          />

          <div className="absolute right-2 bottom-2 flex space-x-1.5 items-center">
            {listening ? (
              <button type="button" onClick={toggleListen} className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10 text-red-500 animate-pulse transition-all">
                <StopCircle className="h-5 w-5" />
              </button>
            ) : (
              <button type="button" onClick={toggleListen} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 opacity-60 hover:opacity-100 transition-all">
                <Mic className="h-5 w-5" />
              </button>
            )}

            {isTyping ? (
              <button type="button" onClick={() => abortControllerRef.current?.abort()} className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white shadow-md active:scale-95 transition-all">
                <StopCircle className="h-4 w-4" />
              </button>
            ) : (
              <button type="submit" disabled={!input.trim() && !imageAttachment} className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-md disabled:opacity-50 disabled:grayscale active:scale-95 transition-all">
                <SendHorizontal className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsModal open={settingsOpen} setOpen={setSettingsOpen} />
    </main>
  );
}
