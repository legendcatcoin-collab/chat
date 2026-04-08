"use client";

import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { X, MessageSquare, Plus, Trash2, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Sidebar({ 
  open, 
  setOpen, 
  onOpenSettings 
}: { 
  open: boolean; 
  setOpen: (o: boolean) => void;
  onOpenSettings: () => void;
}) {
  const { sessions, activeSessionId, createSession, setActiveSession, deleteSession } = useStore();

  const handleNewChat = () => {
    createSession();
    setOpen(false);
  };

  const handleSelectChat = (id: string) => {
    setActiveSession(id);
    setOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSession(id);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar border-r border-border shadow-xl will-change-transform"
          >
            <div className="flex h-14 items-center justify-between px-4 mt-[env(safe-area-inset-top)]">
              <span className="font-semibold text-lg">Chats</span>
              <button onClick={() => setOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3">
              <button
                onClick={handleNewChat}
                className="flex w-full items-center space-x-2 rounded-xl bg-primary text-white px-4 py-3 font-medium shadow-sm transition-transform active:scale-[0.98]"
              >
                <Plus className="h-5 w-5" />
                <span>New Chat</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 no-scrollbar">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSelectChat(s.id)}
                  className={cn(
                    "group flex w-full cursor-pointer items-center justify-between space-x-2 rounded-xl px-3 py-3 transition-colors",
                    activeSessionId === s.id 
                      ? "bg-black/10 dark:bg-white/10" 
                      : "hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center space-x-3 overflow-hidden flex-1">
                    <MessageSquare className="h-4 w-4 opacity-70 shrink-0" />
                    <span className="truncate text-[15px] font-medium leading-none">{s.title || 'New Chat'}</span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, s.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 flex-shrink-0 text-red-500 hover:bg-red-500/20 rounded-md transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="text-center text-sm opacity-50 py-10">
                  No previous chats
                </div>
              )}
            </div>

            <div className="p-3 border-t border-border pb-[calc(12px+env(safe-area-inset-bottom))]">
              <button
                onClick={() => {
                  setOpen(false);
                  onOpenSettings();
                }}
                className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              >
                <Settings className="h-5 w-5 opacity-70" />
                <span className="font-medium text-[15px]">Settings</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
