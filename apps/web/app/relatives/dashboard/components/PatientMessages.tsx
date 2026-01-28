// PatientMessages.tsx - COMPLETE FIX
import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, MessageCircle, Loader2, AlertCircle } from 'lucide-react';

interface Relative {
    _id: string;
    fullName: string;
    email: string;
    relationshipToPatient: string;
    accessLevel: string;
    isEmergencyContact: boolean;
}

interface Message {
    _id: string;
    senderId: string | { _id: string; fullName: string };
    receiverId: string | { _id: string; fullName: string };
    content: string;
    createdAt: string;
    read: boolean;
}

export default function PatientMessages() {
    const [relative, setRelative] = useState<Relative | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingRelative, setIsLoadingRelative] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true); // Only show spinner on first load
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // Extract current user ID from token
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const tokenParts = token.split('.');
                if (tokenParts.length === 3) {
                    const base64 = tokenParts[1];
                    if (base64) {
                        const payload = JSON.parse(atob(base64));
                        const userId = payload?.userId || payload?.id || null;
                        setCurrentUserId(userId);
                        console.log('👤 Current patient user ID:', userId);
                    }
                }
            } catch (error) {
                console.error('Error decoding token:', error);
            }
        }
    }, []);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fetch the patient's relative/emergency contact
    const fetchRelative = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('You must be logged in');
            setIsLoadingRelative(false);
            return;
        }

        try {
            setIsLoadingRelative(true);
            setError(null);


            // Use the correct endpoint for relative-patient messages
            const response = await fetch(`${API_URL}/api/relative-messages/patient-relatives`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });


            if (!response.ok) {
                throw new Error(`Failed to fetch relatives: ${response.status}`);
            }

            const data = await response.json();
            console.log('📋 Relatives response:', data);

            if (data.success && data.data && data.data.length > 0) {
                const selectedRelative = data.data[0];
                setRelative(selectedRelative);
            } else {
                setError('No family members or emergency contacts found. You can set one up in your profile settings.');
                console.log('ℹ️ No relatives found for this patient');
            }
        } catch (err: any) {
            console.error('❌ Error fetching relative:', err);
            setError(err.message || 'Failed to load your emergency contact');
        } finally {
            setIsLoadingRelative(false);
        }
    };

    // Fetch messages with the relative
    const fetchMessages = async (showSpinner = false) => {
        if (!relative || !currentUserId) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            if (showSpinner && isInitialLoad) {
                setIsInitialLoad(true);
            }

            // Use the correct endpoint with otherUserId for relative-patient messaging
            const endpoint = `${API_URL}/api/relative-messages/conversation?otherUserId=${relative._id}`;


            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            });


            if (!response.ok) {
                const errorText = await response.text();
                return;
            }

            const data = await response.json();


            if (data.success && Array.isArray(data.data)) {
                // Only update if data changed
                if (JSON.stringify(data.data) !== JSON.stringify(messages)) {
                    setMessages(data.data);

                }
            }
        } catch (err) {
            console.error('❌ Error fetching messages:', err);
        } finally {
            if (isInitialLoad) {
                setIsInitialLoad(false);
            }
        }
    };

    // Send message to relative
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim() || !relative || !currentUserId) return;

        const token = localStorage.getItem('token');
        if (!token) {
            setError('You must be logged in to send messages');
            return;
        }

        try {
            setError(null);

            const payload = {
                receiverId: relative._id,
                content: newMessage.trim(),
                type: 'text'
            };


            // Use the relative-messages endpoint
            const response = await fetch(`${API_URL}/api/relative-messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });


            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to send message: ${response.status}`);
            }

            const data = await response.json();


            if (data.success) {
                setNewMessage('');

                // Refresh messages after a short delay
                setTimeout(() => fetchMessages(false), 500);
            } else {
                setError(data.message || 'Failed to send message');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to send message');
        }
    };

    // Handle key press for sending
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e as any);
        }
    };

    // Initial fetch of relative
    useEffect(() => {
        fetchRelative();
    }, []);

    // Fetch messages when relative AND currentUserId are loaded
    useEffect(() => {
        if (relative && currentUserId) {
            fetchMessages(true);
        }
    }, [relative, currentUserId]);

    // Set up polling for new messages (every 5 seconds)
    useEffect(() => {
        if (!relative || !currentUserId) return;

        console.log('⏰ Setting up message polling');
        const interval = setInterval(() => {
            fetchMessages(false);
        }, 5000);

        return () => {
            clearInterval(interval);
        };
    }, [relative, currentUserId]);

    // Determine if message is from current user (patient)
    const isFromCurrentUser = (msg: Message) => {
        if (!currentUserId) return false;

        const senderId = typeof msg.senderId === 'object'
            ? (msg.senderId as any)._id
            : msg.senderId;

        return String(senderId) === String(currentUserId);
    };

    // Loading state
    if (isLoadingRelative) {
        return (
            <div className="flex h-[600px] bg-white rounded-xl shadow-lg items-center justify-center border border-gray-100">
                <div className="flex flex-col items-center space-y-3">
                    <Loader2 className="animate-spin text-blue-500" size={40} />
                    <p className="text-sm text-gray-600">Loading your emergency contact...</p>
                </div>
            </div>
        );
    }

    // Error state - no relative found
    if (!relative && !isLoadingRelative) {
        return (
            <div className="flex h-[600px] bg-white rounded-xl shadow-lg items-center justify-center border border-gray-100">
                <div className="flex flex-col items-center space-y-4 p-8 text-center max-w-md">
                    <AlertCircle className="text-yellow-500" size={48} />
                    <h3 className="text-lg font-semibold text-gray-800">No Emergency Contact Found</h3>
                    <p className="text-sm text-gray-600">
                        {error || 'You haven\'t set up an emergency contact yet. Visit your profile settings to add a family member or caregiver.'}
                    </p>
                    <button
                        onClick={fetchRelative}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[600px] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            {/* Main Chat Window */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600">
                            <UserIcon size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">{relative?.fullName}</h3>
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-blue-100">
                                    {relative?.relationshipToPatient || 'Family Member'}
                                </p>
                                {relative?.isEmergencyContact && (
                                    <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">
                                        Emergency Contact
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-blue-100">Access Level</p>
                        <p className="text-xs text-white font-medium capitalize">
                            {relative?.accessLevel?.replace('_', ' ')}
                        </p>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 px-4 py-3 mx-4 mt-4">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {isInitialLoad ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                            <p className="text-gray-500 text-sm">Loading messages...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm italic">
                                Start your conversation with {relative?.fullName}
                            </p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isFromMe = isFromCurrentUser(msg);
                            return (
                                <div
                                    key={msg._id}
                                    className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[75%] p-3 rounded-2xl shadow-sm text-sm ${isFromMe
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                                            }`}
                                    >
                                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                        <p
                                            className={`text-xs mt-1 ${isFromMe ? 'text-blue-100' : 'text-gray-500'
                                                }`}
                                        >
                                            {new Date(msg.createdAt).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex gap-2">
                    <input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={`Message ${relative?.fullName || 'your contact'}...`}
                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        disabled={!relative}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || !relative}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={20} />
                    </button>
                </form>
                <p className="text-xs text-gray-500 px-4 pb-2 text-center">
                    Press Enter to send • Messages sync every 5 seconds
                </p>
            </div>
        </div>
    );
}