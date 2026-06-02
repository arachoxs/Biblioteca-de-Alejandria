"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare } from "lucide-react";
import ChatHeader from "./ChatHeader";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import { useChatModal } from "./useChatModal";
import { useChatState } from "./useChatState";
import { ChatModalProvider } from "./ChatModalContext";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, error, sendMessage, abort } = useChatState();

  const handleClose = useCallback(() => {
    setIsClosing(true);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsClosing(false);
  }, []);

  const { panelRef, inputRef } = useChatModal({
    isOpen,
    isClosing,
    onClose: handleClose,
  });

  useEffect(() => {
    if (!isClosing) return;
    const timer = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [isClosing]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const success = await sendMessage(input, messages);
      if (success) setInput("");
    },
    [input, messages, sendMessage],
  );

  useEffect(() => {
    return () => abort();
  }, [abort]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const panelClass = isClosing ? "chat-panel-out" : "chat-panel-in";
  const backdropClass = isClosing ? "chat-backdrop-out" : "chat-backdrop-in";

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-40 group flex items-center justify-center w-14 h-14 rounded-full bg-brand-primary text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 chat-fab-pulse"
        aria-label="Abrir chat">
        <MessageSquare className="w-6 h-6 transition-transform duration-200 group-hover:rotate-[-8deg]" />
      </button>

      {isOpen && (
        <div className="fixed z-50">
          <div
            className={`fixed inset-0 bg-brand-text/20 backdrop-blur-[2px] ${backdropClass}`}
            aria-hidden="true"
            onClick={handleClose}
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Asistente Virtual"
            onAnimationEnd={() => inputRef.current?.focus()}
            className={`fixed bottom-24 right-6 w-[calc(100vw-3rem)] max-w-md h-[70vh] sm:h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-brand-primary/10 ${panelClass}`}>
            <ChatModalProvider onClose={handleClose}>
              <ChatHeader onClose={handleClose} />
              <ChatMessageList
                messages={messages}
                isLoading={isLoading}
                error={error}
                messagesEndRef={messagesEndRef}
              />
              <ChatInput
                input={input}
                onInputChange={setInput}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                inputRef={inputRef}
              />
            </ChatModalProvider>
          </div>
        </div>
      )}
    </>
  );
}
