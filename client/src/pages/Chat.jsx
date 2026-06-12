import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { useSocket } from "../hooks/useSocket";

import {
  createPrivateConversation,
  getMessages,
} from "../services/chat.service";

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
  const socket = useSocket();

  const user = getStoredUser();
  const userId = user?.id;

  const [users, setUsers] = useState([]);

  const [selectedConversation, setSelectedConversation] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);

  const [messages, setMessages] = useState([]);

  const [onlineUsers, setOnlineUsers] = useState([]);

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
    if (!userId) return;

    socket.connect();

    socket.on("connect", () => {
      console.log("Socket Connected:", socket.id);

      socket.emit("register-user");
    });

    return () => {
      socket.off("connect");
    };
  }, [socket, userId]);

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

  // Online users
  useEffect(() => {
    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    socket.on("online-users", handleOnlineUsers);

    return () => {
      socket.off("online-users", handleOnlineUsers);
    };
  }, [socket]);

  // Receive real-time messages
  useEffect(() => {
    const handleReceive = (newMessage) => {
      if (newMessage.conversationId !== selectedConversation?.id) {
        return;
      }
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
      if (selectedConversation) {
        socket.emit("leave-conversation", selectedConversation.id);
      }
      const data = await createPrivateConversation(targetUser.id);

      const conversation = data.conversation;

      setSelectedConversation(conversation);

      setSelectedUser(targetUser);

      socket.emit("join-conversation", conversation.id);

      const result = await getMessages(conversation.id);

      setMessages(result.messages);
    } catch (error) {
      console.log(error);
    }
  };

  // Send message
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
    } catch (error) {
      console.log(error);
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen bg-slate-950 flex overflow-hidden">
      {/* Sidebar */}{" "}
      <div className="w-[360px] min-w-[320px] bg-slate-900 border-r border-slate-800 flex flex-col">
        {" "}
        {/* Top Header */}{" "}
        <div className="p-5 border-b border-slate-800 bg-slate-950 sticky top-0 z-10">
          {" "}
          <div className="flex items-center justify-between">
            {" "}
            <div>
              {" "}
              <h1 className="text-2xl font-bold text-white"> Messages </h1>{" "}
              <p className="text-slate-400 text-sm">
                {" "}
                Welcome, {user?.fullName}{" "}
              </p>{" "}
            </div>{" "}
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              {" "}
              {user?.fullName?.charAt(0)}{" "}
            </div>{" "}
          </div>{" "}
          {/* Search */}{" "}
          <div className="mt-4">
            {" "}
            <input
              type="text"
              placeholder="Search users..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />{" "}
          </div>{" "}
        </div>{" "}
        {/* User List */}{" "}
        <div className="flex-1 overflow-y-auto">
          {" "}
          {users.map((targetUser) => (
            <div
              key={targetUser.id}
              onClick={() => openChat(targetUser)}
              className={`flex items-center gap-4 p-4 border-b border-slate-800 cursor-pointer transition-all duration-200 ${selectedConversation?.members?.some((member) => member.userId === targetUser.id) ? "bg-slate-800" : "hover:bg-slate-800/70 hover:scale-[1.01]"}`}
            >
              {" "}
              {/* Avatar */}{" "}
              <div className="relative">
                {" "}
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {" "}
                  {targetUser.fullName?.charAt(0)}{" "}
                </div>{" "}
                <div
                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 ${onlineUsers.includes(targetUser.id) ? "bg-green-500" : "bg-slate-500"}`}
                />{" "}
              </div>{" "}
              {/* User Info */}{" "}
              <div className="flex-1 overflow-hidden">
                {" "}
                <h2 className="text-white font-semibold truncate">
                  {" "}
                  {targetUser.fullName}{" "}
                </h2>{" "}
                <p className="text-slate-400 text-sm truncate">
                  {" "}
                  {targetUser.email}{" "}
                </p>{" "}
              </div>{" "}
            </div>
          ))}{" "}
        </div>{" "}
      </div>
      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-950 relative">
        {/* Header */}
        <div className=" bg-slate-900/90 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10 shadow-sm ">
          {selectedUser ? (
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {selectedUser?.fullName?.charAt(0)}
                </div>

                <div
                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 ${onlineUsers.includes(selectedUser?.id) ? "bg-green-500" : "bg-slate-500"}`}
                />
              </div>

              <div>
                <h2 className="text-white text-lg font-semibold">
                  {selectedUser?.fullName}
                </h2>

                <p className="text-sm text-green-400">Online</p>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-white">
                Select a Chat
              </h2>

              <p className="text-slate-400 text-sm">
                Choose someone to start messaging
              </p>
            </div>
          )}
        </div>

        {/* Messages */}
        {!selectedConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="h-32 w-32 rounded-full bg-slate-800 flex items-center justify-center text-6xl shadow-2xl mb-8">
              💬
            </div>

            <h1 className="text-4xl font-bold text-white">
              Welcome to ChatApp
            </h1>

            <p className="text-slate-400 text-lg mt-4 max-w-lg leading-relaxed">
              Select a user from the sidebar and start a real-time secure
              conversation instantly.
            </p>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-8 py-8 bg-slate-950 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="h-28 w-28 rounded-full bg-slate-800 flex items-center justify-center text-5xl mb-6 shadow-xl">
                    💬
                  </div>

                  <h2 className="text-2xl font-bold text-white">
                    No Messages Yet
                  </h2>

                  <p className="text-slate-400 mt-2 max-w-sm">
                    Start chatting with your friends in real-time.
                  </p>
                </div>
              )}

              {messages.map((msg, index) => {
                const isMine = msg.senderId === user.id;

                return (
                  <div
                    key={index}
                    className={`flex animate-fadeIn ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] px-5 py-3 rounded-3xl shadow-lg hover:scale-[1.01] transition-all duration-200 break-words ${
                        isMine
                          ? "bg-blue-600 text-white rounded-br-md"
                          : "bg-slate-800 text-slate-100 rounded-bl-md"
                      }`}
                    >
                      <p className="text-[15px] leading-relaxed">
                        {msg.content}
                      </p>

                      <div className="flex justify-end mt-1">
                        <span className="text-[11px] opacity-70">
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
            </div>
          </>
        )}
        {/* Input */}
        <div className="bg-slate-900 border-t border-slate-800 px-6 py-4">
          <div className="flex items-center gap-4 bg-slate-800 rounded-2xl p-2">
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
              className="flex-1 bg-transparent px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
            />

            <button
              onClick={handleSend}
              disabled={!selectedConversation}
              className="bg-blue-600 hover:scale-105 active:scale-95 hover:bg-blue-700 transition px-6 py-3 rounded-xl text-white font-medium disabled:opacity-50"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
