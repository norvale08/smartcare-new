"use client";

import { useEffect, useState } from "react";
import { MessageSquare, User } from "lucide-react";
import { fetchMessages, sendMessage } from "../lib/api/messages";

type MessagesProps = {
  show: boolean;
  toggle: () => void;
  token: string;
  patientId: string;
};

type ChatMessage = {
  _id: string;
  fromId: { _id: string; name: string };
  toId: { _id: string; name: string };
  fromType: "doctor" | "patient";
  toType: "doctor" | "patient";
  message: string;
  createdAt: string;
};

const Messages: React.FC<MessagesProps> = ({ show, toggle, token, patientId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch messages when panel opens
  useEffect(() => {
    if (show && token && patientId) {
      setLoading(true);
      fetchMessages(token, patientId)
        .then(setMessages)
        .catch((err) => console.error("Error fetching messages:", err))
        .finally(() => setLoading(false));
    }
  }, [show, token, patientId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const sent = await sendMessage(token, patientId, "patient", newMessage);
      setMessages((prev) => [sent, ...prev]); // prepend new message
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative"
      >
        <MessageSquare className="w-5 h-5" />
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {messages.length}
          </span>
        )}
      </button>

      {show && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50 flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Messages</h3>
          </div>

          {/* Messages list */}
          <div className="flex-1 max-h-64 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-sm text-gray-500">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No messages yet.</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`p-3 border-b flex items-start space-x-3 ${
                    msg.fromType === "doctor" ? "bg-blue-50" : "bg-gray-50"
                  }`}
                >
                  <User className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {msg.fromId?.name || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-700">{msg.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input box */}
          <div className="p-3 border-t flex items-center space-x-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;