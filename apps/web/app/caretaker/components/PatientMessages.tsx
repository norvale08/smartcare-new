"use client";
import React, { useEffect, useState, useRef } from "react";

interface Message {
  _id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt?: string;
  read?: boolean;
}

interface PatientMessagesProps {
  selectedPatient: {
    id: string;
    userId?: string;
    fullName: string;
  };
}

const PatientMessages: React.FC<PatientMessagesProps> = ({ selectedPatient }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Extract current user ID from token
  useEffect(() => {
    if (token) {
      try {
        const tokenParts = token.split(".");
        if (tokenParts.length === 3) {
          const base64 = tokenParts[1];
          if (base64) {
            const payload = JSON.parse(atob(base64));
            setCurrentUserId(payload?.userId || payload?.id || null);
          }
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, [token]);

  // Debug selected patient
  useEffect(() => {
    console.log("🩺 Selected patient for messaging:", selectedPatient);
    console.log("➡️ Patient ID:", selectedPatient?.id);
    console.log("➡️ User ID:", selectedPatient?.userId);
    console.log("➡️ Current User ID:", currentUserId);
  }, [selectedPatient, currentUserId]);

  // Get the receiver ID - try userId first, then fall back to patient id
  const getReceiverId = () => {
    return selectedPatient?.userId || selectedPatient?.id;
  };

  const fetchConversation = async () => {
    console.log("🔄 fetchConversation triggered");
    
    const receiverId = getReceiverId();
    if (!receiverId || !token) {
      console.warn("⚠️ Missing receiver ID or token", {
        receiverId,
        token: !!token,
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Try multiple endpoints for conversation
      const endpoints = [
        `${API_URL}/api/messages/conversation?otherUserId=${receiverId}`,
        `${API_URL}/api/messages/conversation?patientId=${selectedPatient.id}`,
        `${API_URL}/api/messages?patientId=${selectedPatient.id}`,
      ];

      let success = false;
      
      for (const endpoint of endpoints) {
        try {
          console.log("🌐 Trying endpoint:", endpoint);
          const res = await fetch(endpoint, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (res.ok) {
            const data = await res.json();
            console.log("💬 Conversation data:", data);
            
            if (data.success && Array.isArray(data.data)) {
              setMessages(data.data);
              success = true;
              break;
            } else if (Array.isArray(data)) {
              setMessages(data);
              success = true;
              break;
            }
          }
        } catch (err) {
          console.log(`❌ Endpoint ${endpoint} failed:`, err);
          continue;
        }
      }

      if (!success) {
        setMessages([]);
      }
    } catch (err) {
      console.error("❌ Error fetching messages:", err);
      setError("Failed to load messages");
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const receiverId = getReceiverId();
    if (!receiverId) {
      setError("Cannot send message: Patient user ID not available");
      return;
    }
    
    if (!token) {
      setError("You must be logged in to send messages");
      return;
    }

    try {
      setError(null);
      const res = await fetch(`${API_URL}/api/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: receiverId,
          patientId: selectedPatient.id,
          content: newMessage.trim(),
        }),
      });

      console.log("📬 Message send response:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to send message: ${errorText}`);
      }

      setNewMessage("");
      // Refresh messages after sending
      fetchConversation();
    } catch (err: any) {
      console.error("❌ Error sending message:", err);
      setError(err.message || "Failed to send message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Fetch messages when patient changes
  useEffect(() => {
    if (selectedPatient?.id) {
      fetchConversation();
    }
  }, [selectedPatient?.id]);

  // Set up polling for new messages (every 5 seconds)
  useEffect(() => {
    if (!selectedPatient?.id) return;

    const interval = setInterval(() => {
      fetchConversation();
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedPatient?.id]);

  const receiverId = getReceiverId();

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
        {isLoading ? (
          <p className="text-gray-500 text-center">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-gray-500 text-center">No messages yet. Start a conversation!</p>
        ) : (
          messages.map((msg) => {
            // Check if message is from current user (doctor) or from patient
            // Handle both string IDs and populated objects
            let senderIdString: string | null = null;
            if (typeof msg.senderId === 'string') {
              senderIdString = msg.senderId;
            } else if (typeof msg.senderId === 'object' && msg.senderId !== null) {
              senderIdString = (msg.senderId as any)?._id || (msg.senderId as any)?.id || null;
            }
            
            const isFromCurrentUser = senderIdString === currentUserId;
            
            return (
              <div
                key={msg._id}
                className={`p-3 rounded-lg mb-3 max-w-[80%] ${
                  isFromCurrentUser
                    ? "ml-auto bg-blue-100 text-blue-900 border border-blue-200"
                    : "mr-auto bg-white text-gray-700 border border-gray-200"
                }`}
              >
                <div className="text-sm">{msg.content}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex space-x-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!receiverId}
        />
        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || !receiverId}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
      
      {!receiverId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-700 text-sm">
            Messaging unavailable: This patient is not linked to a user account.
          </p>
        </div>
      )}
      
     
      
    </div>
  );
};

export default PatientMessages;