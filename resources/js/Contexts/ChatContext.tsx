import { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextType {
    open: boolean;
    openChat: () => void;
    closeChat: () => void;
}

const ChatContext = createContext<ChatContextType>({
    open: false,
    openChat: () => {},
    closeChat: () => {},
});

export function ChatProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);

    return (
        <ChatContext.Provider value={{ open, openChat: () => setOpen(true), closeChat: () => setOpen(false) }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    return useContext(ChatContext);
}
