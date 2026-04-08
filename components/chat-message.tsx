"use client";

import { Message } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Check, Copy, Download, Play, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

function generateZip(code: string, language: string) {
  const zip = new JSZip();
  let filename = `code.${language}`;
  if (language === 'html') {
    zip.file("index.html", code);
    filename = "index.html";
  } else if (language === 'css') {
    zip.file("style.css", code);
    filename = "style.css";
  } else if (language === 'javascript' || language === 'js') {
    zip.file("script.js", code);
    filename = "script.js";
  } else {
    zip.file(`snippet.${language}`, code);
  }
  
  zip.generateAsync({ type: "blob" }).then(function (content) {
    saveAs(content, "project-export.zip");
  });
}

function CodePreviewModal({ code, open, onClose }: { code: string; open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background p-4 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between mb-4">
         <h2 className="font-semibold text-lg">Live Real-Time Preview</h2>
         <button onClick={onClose} className="p-2 bg-black/5 dark:bg-white/5 rounded-full"><X className="w-5 h-5"/></button>
      </div>
      <div className="flex-1 rounded-xl bg-white border border-border shadow-inner overflow-hidden">
        <iframe
          title="preview"
          srcDoc={code}
          className="w-full h-full bg-white"
          sandbox="allow-scripts allow-modals"
        />
      </div>
    </div>
  );
}

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className={cn("flex w-full px-4 py-4 animate-fade-in", isUser ? "justify-end" : "justify-start")}>
      <CodePreviewModal code={previewCode || ""} open={!!previewCode} onClose={() => setPreviewCode(null)} />
      
      <div className={cn("flex max-w-[90%] sm:max-w-[85%] flex-col space-y-2 overflow-hidden", isUser ? "items-end" : "items-start")}>
        
        {message.image && (
          <div className="rounded-2xl overflow-hidden mb-1 border border-border shadow-sm w-48 sm:w-64">
            <img src={message.image} alt="attachment" className="w-full object-cover" />
          </div>
        )}

        <div className={cn("relative px-5 py-3.5 rounded-3xl text-[15px] sm:text-base leading-relaxed shadow-sm w-full break-words", 
          isUser ? "bg-primary text-white rounded-br-sm" : "bg-message-bot border border-border text-foreground rounded-bl-sm"
        )}>
          {isUser ? (
            <div className="whitespace-pre-wrap selection:bg-white/20">{message.content}</div>
          ) : (
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code(props) {
                    const { children, className, node, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || "");
                    const targetLang = match ? match[1] : "";
                    const codeString = String(children).replace(/\n$/, "");
                    
                    const isPreviewable = targetLang === 'html' || targetLang === 'xml' || codeString.includes('<html');

                    if (match) {
                      return (
                        <div className="relative overflow-hidden rounded-xl border border-border my-4 bg-[#1E1E1E]">
                          <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-white/5">
                            <span className="text-xs font-mono text-white/50">{targetLang}</span>
                            <div className="flex space-x-1">
                              {isPreviewable && (
                                <button
                                  onClick={() => setPreviewCode(codeString)}
                                  className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-md transition-colors"
                                >
                                  <Play className="w-3 h-3" /> Preview
                                </button>
                              )}
                              <button
                                onClick={() => generateZip(codeString, targetLang)}
                                className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
                              >
                                <Download className="w-3 h-3" /> ZIP
                              </button>
                              <button
                                onClick={() => handleCopy(codeString, codeString.substring(0,10))}
                                className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-white/60 hover:text-white/100 hover:bg-white/10 rounded-md transition-colors"
                              >
                                {copied === codeString.substring(0,10) ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copy
                              </button>
                            </div>
                          </div>
                          <SyntaxHighlighter
                            {...(rest as any)}
                            PreTag="div"
                            children={codeString}
                            language={targetLang}
                            style={vscDarkPlus}
                            customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                            codeTagProps={{ style: { fontSize: '13px', lineHeight: '1.6' } }}
                          />
                        </div>
                      )
                    }
                    return <code {...rest} className={cn("bg-black/10 dark:bg-white/10 rounded-md px-1.5 py-0.5 text-sm", className)}>{children}</code>;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && (
          <div className="flex items-center space-x-2 px-2 opacity-60">
            <button
              onClick={() => handleCopy(message.content, message.id)}
              className="flex items-center space-x-1 p-1.5 transition-colors hover:text-primary rounded-md text-xs"
            >
              {copied === message.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>Copy Full Reply</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
