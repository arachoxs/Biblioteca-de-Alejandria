"use client";

import { createContext, useContext } from "react";

interface ChatModalContextValue {
  closeChat: () => void;
}

const ChatModalContext = createContext<ChatModalContextValue>({
  closeChat: () => {},
});

export function useChatModalClose() {
  return useContext(ChatModalContext);
}

export function ChatModalProvider({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <ChatModalContext.Provider value={{ closeChat: onClose }}>
      {children}
    </ChatModalContext.Provider>
  );
}
