"use client";

import { Message } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Bot, User, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";

export function ChatMessage({ message, isLast }: { message: Message; isLast?: boolean }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "flex w-full px-4 py-4 animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "flex max-w-[85%] flex-col space-y-2 overflow-hidden",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "relative px-4 py-3 rounded-2xl text-[15px] sm:text-base leading-relaxed shadow-sm",
            isUser
              ? "bg-message-user text-foreground rounded-br-sm"
              : "bg-message-bot border border-border text-foreground rounded-bl-sm"
          )}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code(props) {
                    const { children, className, node, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || "");
                    return match ? (
                      <div className="relative overflow-hidden rounded-md my-2">
                        <SyntaxHighlighter
                          {...(rest as any)}
                          PreTag="div"
                          children={String(children).replace(/\n$/, "")}
                          language={match[1]}
                          style={vscDarkPlus}
                          className="!m-0 !rounded-md text-sm"
                        />
                      </div>
                    ) : (
                      <code {...rest} className={cn("bg-black/10 dark:bg-white/10 rounded px-1 py-0.5", className)}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && (
          <div className="flex items-center space-x-2 px-1 opacity-70">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5 rounded-md"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
