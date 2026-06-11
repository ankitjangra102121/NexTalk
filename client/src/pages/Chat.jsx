import { useEffect, useState } from "react";

import { useSocket } from "../hooks/useSocket";

import {
  createPrivateConversation,
  getMessages,
} from "../services/chat.service";

import { getUsers } from "../services/user.service";

function Chat() {
  const socket = useSocket();

  const user = JSON.parse(localStorage.getItem("user"));

  const [users, setUsers] = useState([]);

  const [selectedConversation, setSelectedConversation] = useState(null);

  const [messages, setMessages] = useState([]);

  const [message, setMessage] = useState("");

  // Load conversations

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();

        setUsers(data.users);
      } catch (error) {
        console.log(error);
      }
    };

    fetchUsers();
  }, []);

  // Socket connection
  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log("Socket Connected:", socket.id);

      socket.emit("register-user", user.id);
    });

    return () => {
      socket.off("connect");
    };
  }, [socket, user.id]);

  // Join selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    socket.emit("join-conversation", selectedConversation.id);

    const fetchMessages = async () => {
      try {
        const data = await getMessages(selectedConversation.id);

        setMessages(data.messages || []);
      } catch (error) {
        console.log(error);
      }
    };

    fetchMessages();
  }, [selectedConversation, socket]);

  // Receive real-time messages
  useEffect(() => {
    const handleReceive = (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    };

    socket.on("receive-message", handleReceive);

    return () => {
      socket.off("receive-message", handleReceive);
    };
  }, [socket]);

  const openChat = async (targetUser) => {
    console.log("Clicked user:", targetUser);
    try {
      const data = await createPrivateConversation(targetUser.id);

      const conversation = data.conversation;

      setSelectedConversation(conversation);

      socket.emit("join-conversation", conversation.id);

      const result = await getMessages(conversation.id);

      setMessages(result.messages);
    } catch (error) {
      console.log(error);
    }
  };

  // Send message
  const handleSend = () => {
    if (!message.trim() || !selectedConversation) {
      return;
    }

    socket.emit("send-message", {
      conversationId: selectedConversation.id,

      content: message,

      type: "TEXT",
    });

    setMessage("");
  };

  return (
    <div className="h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <div className="w-[320px] bg-slate-900 border-r border-slate-800">
        <div className="p-5 border-b border-slate-800">
          <h1 className="text-white text-2xl font-bold">Chats</h1>
        </div>

        <div className="overflow-y-auto">
          {users.map((targetUser) => (
            <div
              key={targetUser.id}
              onClick={() => openChat(targetUser)}
              className="p-4 border-b border-slate-800 hover:bg-slate-800 cursor-pointer"
            >
              <h2 className="text-white">{targetUser.fullName}</h2>

              <p className="text-slate-400 text-sm">{targetUser.email}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 p-5 border-b border-slate-800">
          <h2 className="text-white text-xl">
            {selectedConversation?.name || "Select Chat"}
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.senderId === user.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-5 py-3 rounded-2xl text-white max-w-sm ${
                  msg.senderId === user.id ? "bg-blue-600" : "bg-slate-800"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-5 border-t border-slate-800 flex gap-4 bg-slate-900">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            type="text"
            placeholder={
              selectedConversation
                ? "Type a message..."
                : "Select a conversation first"
            }
            disabled={!selectedConversation}
            className="flex-1 bg-slate-800 text-white px-4 py-3 rounded-xl outline-none"
          />

          <button
            onClick={handleSend}
            disabled={!selectedConversation}
            className="bg-blue-600 hover:bg-blue-700 px-8 rounded-xl text-white disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
