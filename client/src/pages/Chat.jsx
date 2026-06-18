import { useEffect, useRef, useState } from "react";

import { Navigate } from "react-router-dom";

import { useSocket } from "../hooks/useSocket";

import {
  createPrivateConversation,
  getMessages,
} from "../services/chat.service";

import { clearAuthStorage } from "../services/authStorage";
import { getUsers } from "../services/user.service";

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("user");

    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

function Chat() {
  // State
  const socket = useSocket();
  const user = getStoredUser();
  const userId = user?.id;

  const [users, setUsers] = useState([]);

  const [selectedConversation, setSelectedConversation] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);

  const [messages, setMessages] = useState([]);

  const [onlineUsers, setOnlineUsers] = useState([]);

  const [message, setMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [loadingUsers, setLoadingUsers] = useState(true);

  const [loadingMessages, setLoadingMessages] = useState(false);

  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const isUserOnline = onlineUsers.includes(selectedUser?.id);

  // Effects
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);

        const data = await getUsers();

        setUsers(data.users);
      } catch {
        setError("Unable to load users. Please refresh.");
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (!userId) return;

    socket.connect();

    socket.on("connect", () => {
      socket.emit("register-user");
    });

    return () => {
      socket.off("connect");
    };
  }, [socket, userId]);

  useEffect(() => {
    if (!selectedConversation) return;

    socket.emit("join-conversation", selectedConversation.id);

    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);

        setError("");

        const data = await getMessages(selectedConversation.id);

        setMessages(data.messages || []);
      } catch {
        setError("Failed to load messages.");
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedConversation, socket]);

  useEffect(() => {
    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    socket.on("online-users", handleOnlineUsers);

    return () => {
      socket.off("online-users", handleOnlineUsers);
    };
  }, [socket]);

  useEffect(() => {
    const handleReceive = (newMessage) => {
      if (newMessage.conversationId !== selectedConversation?.id) {
        return;
      }

      setMessages((prev) => {
        const exists = prev.some((msg) => msg.id === newMessage.id);

        if (exists) {
          return prev;
        }

        return [...prev, newMessage];
      });
    };

    socket.on("receive-message", handleReceive);

    return () => {
      socket.off("receive-message", handleReceive);
    };
  }, [socket, selectedConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handlers
  const openChat = async (targetUser) => {
    try {
      if (selectedConversation) {
        socket.emit("leave-conversation", selectedConversation.id);
      }

      setLoadingMessages(true);
      setError("");

      const data = await createPrivateConversation(targetUser.id);

      const conversation = data.conversation;

      setSelectedConversation(conversation);

      setSelectedUser(targetUser);

      socket.emit("join-conversation", conversation.id);

      const result = await getMessages(conversation.id);

      setMessages(result.messages || []);
    } catch {
      setError("Unable to open chat.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !selectedConversation) {
      return;
    }

    try {
      socket.emit("send-message", {
        conversationId: selectedConversation.id,

        content: message,

        type: "TEXT",
      });

      setMessage("");
    } catch {
      setError("Message failed to send.");
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/40 to-emerald-50/40 text-slate-900">
      <div className="flex h-full p-3 gap-3">
        {/* Sidebar */}
        <div className="w-full md:w-[320px] shrink-0 rounded-[32px] border border-slate-200/70 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.06)] overflow-hidden">
          {/* Top Header */}
          <div className="px-6 pt-6 pb-5 border-b border-slate-100 bg-white/70 backdrop-blur-xl sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user?.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt={user.fullName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                    {user?.fullName?.charAt(0)?.toUpperCase()}
                  </div>
                )}

                <div>
                  <h1 className="text-[24px] font-semibold tracking-tight text-slate-900">
                    NexTalk
                  </h1>

                  <p className="text-slate-500 text-sm">{user?.fullName}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (selectedConversation) {
                    socket.emit("leave-conversation", selectedConversation.id);
                  }

                  socket.disconnect();
                  clearAuthStorage();
                  window.location.href = "/login";
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Logout
              </button>
            </div>
            {/* Search */}
            <div className="mt-4">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>
          {/* User List */}
          <div className="flex-1 overflow-y-auto">
            {loadingUsers ? (
              <div className="flex items-center justify-center py-10">
                <div className="text-sm text-slate-500">
                  Loading conversations...
                </div>
              </div>
            ) : (
              users
                .filter((u) =>
                  u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()),
                )
                .map((targetUser) => (
                  <div
                    key={targetUser.id}
                    onClick={() => openChat(targetUser)}
                    className={`mx-3 my-1.5 flex items-center gap-3 rounded-[24px] px-3 py-3 cursor-pointer transition-all duration-200 ${
                      selectedConversation?.members?.some(
                        (member) => member.userId === targetUser.id,
                      )
                        ? "bg-indigo-50 border border-indigo-100 shadow-sm ring-1 ring-indigo-100 border border-indigo-100 shadow-sm"
                        : "hover:bg-slate-100 hover:shadow-sm"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md flex items-center justify-center text-white font-bold text-lg">
                        {targetUser.fullName?.charAt(0)}
                      </div>
                      <div
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${onlineUsers.includes(targetUser.id) ? "bg-green-500" : "bg-slate-500"}`}
                      />
                    </div>
                    {/* User Info */}
                    <div className="flex-1 overflow-hidden">
                      <h2 className="font-semibold text-[15px] text-slate-900 truncate">
                        {targetUser.fullName}
                      </h2>
                      <p className="text-slate-500 text-sm truncate">
                        {targetUser.email}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
        {/* Chat Area */}
        <div className="flex-1 rounded-[32px] border border-white/50 bg-white/75 backdrop-blur-2xl shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden flex flex-col relative">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200/70 bg-white/80 backdrop-blur-xl px-6 py-5">
            {selectedUser ? (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-600 shadow-md flex items-center justify-center text-white font-semibold">
                    {selectedUser?.fullName?.charAt(0)}
                  </div>

                  <div
                    className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[3px] border-white ${
                      isUserOnline ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  />
                </div>

                <div>
                  <h2 className="text-[17px] font-semibold tracking-tight text-slate-900">
                    {selectedUser?.fullName}
                  </h2>

                  <p
                    className={`text-xs font-medium ${
                      isUserOnline ? "text-emerald-500" : "text-slate-500"
                    }`}
                  >
                    {isUserOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  NexTalk
                </h2>

                <p className="text-sm text-slate-500">
                  Real-Time Communication Platform
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mx-5 mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Messages */}
          {!selectedConversation ? (
            <div className="flex-1 rounded-[32px] border border-white/50 bg-white/75 backdrop-blur-2xl shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden flex flex-col relative">
              <div className="h-32 w-32 rounded-[32px] bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-6xl shadow-inner mb-8">
                💬
              </div>

              <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
                Welcome to NexTalk
              </h1>

              <p className="text-slate-500 text-lg mt-4 max-w-lg leading-relaxed">
                Start a conversation, share ideas, and stay connected in real
                time.
              </p>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 md:px-8 py-6 bg-gradient-to-b from-slate-50/60 to-white space-y-4">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-slate-500 text-sm">
                      Loading messages...
                    </div>
                  </div>
                ) : (
                  messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <div className="h-28 w-28 rounded-full bg-slate-800 flex items-center justify-center text-5xl mb-6 shadow-xl">
                        💬
                      </div>
                      <h2 className="text-[17px] font-semibold tracking-tight text-slate-900">
                        No Messages Yet
                      </h2>
                      <p className="text-slate-400 mt-2 max-w-sm">
                        Start chatting with your friends in real-time.
                      </p>
                    </div>
                  )
                )}

                {messages.map((msg, index) => {
                  const isMine = msg.senderId === user.id;

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex animate-fadeIn ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[82%] md:max-w-[70%] rounded-[28px] px-5 py-3 shadow-sm transition-all duration-200 ${
                          isMine
                            ? "bg-gradient-to-r bg-slate-900 text-white text-white rounded-br-md"
                            : "bg-white border border-slate-200 text-slate-800 rounded-bl-md"
                        }`}
                      >
                        <p className="text-[15px] leading-7">{msg.content}</p>

                        <div className="flex justify-end mt-1">
                          <span className=" opacity-70 text-[10px] opacity-60 tracking-wide">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            </>
          )}
          {/* Input */}
          <div className="border-t border-slate-100 bg-white/70 backdrop-blur-xl px-5 py-5">
            <div className="flex items-center gap-3 rounded-[28px] border border-slate-200 bg-slate-50 px-3 py-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  selectedConversation
                    ? "Type a message..."
                    : "Select a chat first"
                }
                disabled={!selectedConversation}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSend();
                  }
                }}
                className="flex-1 bg-transparent px-3 py-3 text-slate-900 placeholder:text-slate-400 outline-none"
              />

              <button
                onClick={handleSend}
                disabled={!selectedConversation}
                className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
