import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

interface ChatState {
  // Settings
  apiKey: string;
  setApiKey: (key: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;

  // Chats
  sessions: ChatSession[];
  activeSessionId: string | null;
  createSession: () => string;
  setActiveSession: (id: string) => void;
  deleteSession: (id: string) => void;
  addMessage: (sessionId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (sessionId: string, messageId: string, content: string) => void;
  clearChats: () => void;
}

export const useStore = create<ChatState>()(
  persist(
    (set, get) => ({
      apiKey: '',
      setApiKey: (key) => set({ apiKey: key }),
      selectedModel: 'google/gemini-pro', // default openrouter model
      setSelectedModel: (model) => set({ selectedModel: model }),
      systemPrompt: 'You are a helpful, brilliant, and concise AI assistant.',
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),

      sessions: [],
      activeSessionId: null,

      createSession: () => {
        const id = uuidv4();
        const newSession: ChatSession = {
          id,
          title: 'New Chat',
          messages: [],
          updatedAt: Date.now(),
        };
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: id,
        }));
        return id;
      },

      setActiveSession: (id) => set({ activeSessionId: id }),

      deleteSession: (id) =>
        set((state) => {
          const newSessions = state.sessions.filter((s) => s.id !== id);
          return {
            sessions: newSessions,
            activeSessionId: state.activeSessionId === id 
                ? (newSessions[0]?.id || null) 
                : state.activeSessionId,
          };
        }),

      addMessage: (sessionId, message) =>
        set((state) => {
          const sessions = state.sessions.map((s) => {
            if (s.id === sessionId) {
              const newMessage: Message = { ...message, id: uuidv4(), timestamp: Date.now() };
              // Generate title from first user message
              let title = s.title;
              if (s.messages.length === 0 && message.role === 'user') {
                title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
              }
              return {
                ...s,
                title,
                messages: [...s.messages, newMessage],
                updatedAt: Date.now(),
              };
            }
            return s;
          });
          // Sort so newest is first
          sessions.sort((a, b) => b.updatedAt - a.updatedAt);
          return { sessions };
        }),

      updateMessage: (sessionId, messageId, content) =>
        set((state) => {
          const sessions = state.sessions.map((s) => {
            if (s.id === sessionId) {
              return {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === messageId ? { ...m, content } : m
                ),
                updatedAt: Date.now(),
              };
            }
            return s;
          });
          sessions.sort((a, b) => b.updatedAt - a.updatedAt);
          return { sessions };
        }),

      clearChats: () => set({ sessions: [], activeSessionId: null }),
    }),
    {
      name: 'ai-chat-storage', // local storage key
    }
  )
);
