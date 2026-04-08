import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type Role = 'user' | 'assistant' | 'system';
export type AppMode = 'chat' | 'code' | 'image' | 'islamic';

export interface Message {
  id: string;
  role: Role;
  content: string;
  image?: string; // base64
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
  
  // Customization
  textSize: 'small' | 'normal' | 'large';
  setTextSize: (s: 'small' | 'normal' | 'large') => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
  fontFamily: string;
  setFontFamily: (f: string) => void;
  
  // App Mode
  mode: AppMode;
  setMode: (mode: AppMode) => void;

  // Chats
  sessions: ChatSession[];
  activeSessionId: string | null;
  createSession: () => string;
  setActiveSession: (id: string) => void;
  deleteSession: (id: string) => void;
  addMessage: (sessionId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (sessionId: string, messageId: string, content: string, overrides?: Partial<Message>) => void;
  clearChats: () => void;
}

export const useStore = create<ChatState>()(
  persist(
    (set) => ({
      apiKey: '',
      setApiKey: (key) => set({ apiKey: key }),
      selectedModel: 'google/gemini-2.5-flash:free', 
      setSelectedModel: (model) => set({ selectedModel: model }),
      systemPrompt: 'You are a helpful, brilliant, and concise AI assistant.',
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
      
      textSize: 'normal',
      setTextSize: (s) => set({ textSize: s }),
      accentColor: '#d97757',
      setAccentColor: (c) => set({ accentColor: c }),
      fontFamily: 'sans-serif',
      setFontFamily: (f) => set({ fontFamily: f }),

      mode: 'chat',
      setMode: (mode) => set({ mode }),

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
          sessions.sort((a, b) => b.updatedAt - a.updatedAt);
          return { sessions };
        }),

      updateMessage: (sessionId, messageId, content, overrides) =>
        set((state) => {
          const sessions = state.sessions.map((s) => {
            if (s.id === sessionId) {
              return {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === messageId ? { ...m, content, ...overrides } : m
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
      name: 'ai-chat-storage', 
    }
  )
);
