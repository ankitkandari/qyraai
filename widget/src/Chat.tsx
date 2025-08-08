import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    MessageCircle
} from 'lucide-react';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

interface ChatProps {
    config: {
        clientId: string;
        theme?: {
            primary_color: string;
            background_color: string;
            text_color: string;
        };
        welcome_message?: string;
    };
    onConfigUpdate: (config: any) => void;
}

export default function Chat({ config, onConfigUpdate }: ChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId] = useState(() => Math.random().toString(36).substring(7));
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const API_URL = import.meta.env.VITE_API_URL;

    const theme = config.theme || {
        primary_color: '#007bff',
        background_color: '#ffffff',
        text_color: '#333333',
    };

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    id: '1',
                    text: config.welcome_message || 'Hello! How can I help you today?',
                    isUser: false,
                    timestamp: new Date(),
                },
            ]);
        }
    }, [isOpen, config.welcome_message]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputValue,
            isUser: true,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: inputValue,
                    client_id: config.clientId,
                    session_id: sessionId,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: data.response,
                isUser: false,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error('Failed to send message:', error);

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Sorry, I encountered an error. Please try again.',
                isUser: false,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const renderMessageContent = (text: string, isUser: boolean) => {
        if (isUser) {
            return text;
        }
        return (
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    a: ({ node, ...props }) => (
                        <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: theme.primary_color }}
                        />
                    ),
                    code: ({ node, ...props }) => (
                        <code
                            {...props}
                            style={{
                                backgroundColor: 'rgba(0,0,0,0.1)',
                                padding: '2px 4px',
                                borderRadius: '3px',
                                fontFamily: 'monospace',
                            }}
                        />
                    ),
                    pre: ({ node, ...props }) => (
                        <pre
                            {...props}
                            style={{
                                backgroundColor: 'rgba(0,0,0,0.1)',
                                padding: '10px',
                                borderRadius: '5px',
                                overflowX: 'auto',
                            }}
                        />
                    ),
                }}
            >
                {text}
            </ReactMarkdown>
        );
    };

    return (
        <div className="chatbot-widget">
            {/* Chat Button */}
            {!isOpen && (
                <button
                    onClick={toggleChat}
                    className="chat-toggle-button"
                    style={{ backgroundColor: theme.primary_color }}
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M20 2H4C2.9 2 2.01 2.9 2.01 4L2 22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM6 9H18V11H6V9ZM14 14H6V12H14V14ZM18 8H6V6H18V8Z"
                            fill="white"
                        />
                    </svg>
                </button>
            )}


            {isOpen && (
                <div
                    className="chat-window"
                    style={{ backgroundColor: theme.background_color }}
                >

                    <div
                        className="chat-header chatbot-gradient"
                        style={{ background: theme.primary_color }}
                    >
                        <h3 className="chat-title">Chat Support</h3>
                        <button onClick={toggleChat} className="chat-close-button">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M15 5L5 15M5 5L15 15"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </div>


                    <div className="chat-messages">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`message ${message.isUser ? 'user-message' : 'bot-message'}`}
                            >
                                <div
                                    className="message-bubble"
                                    style={{
                                        backgroundColor: message.isUser
                                            ? theme.primary_color
                                            : '#f1f1f1',
                                        color: message.isUser ? 'white' : theme.text_color,
                                    }}
                                >
                                    {renderMessageContent(message.text, message.isUser)}
                                </div>
                                <div className="message-time">
                                    {message.timestamp.toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="message bot-message">
                                <div
                                    className="message-bubble typing-indicator"
                                    style={{ backgroundColor: '#f1f1f1' }}
                                >
                                    <div className="typing-dots">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>


                    <div className="chat-input-container">
                        <div className="chat-input-wrapper">
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                className="chat-input"
                                style={{ color: theme.text_color }}
                                rows={1}
                                disabled={isLoading}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!inputValue.trim() || isLoading}
                                className="send-button"
                                style={{ backgroundColor: theme.primary_color }}
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M2 10L18 2L14 10L18 18L2 10Z" fill="white" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <a className='chat-footer' href="https://qyraai.vercel.app" target="_blank">
                        <p>Powered by </p>
                        <span className='chatbot-gradient'>
                            <MessageCircle  />
                        </span>
                        <p> Qyra AI</p>
                    </a>
                </div>
            )}
        </div>
    );
}