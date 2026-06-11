import api from "./api";

export const getConversations = async () => {
  const { data } = await api.get("/chat/conversations");

  return data;
};

export const getMessages = async (conversationId) => {
  const { data } = await api.get(`/chat/messages/${conversationId}`);

  return data;
};

export const createConversation = async (memberIds) => {
  const { data } = await api.post("/chat/conversation", {
    memberIds,
  });

  return data;
};

export const createPrivateConversation = async (targetUserId) => {
  const { data } = await api.post("/chat/conversation/private", {
    targetUserId,
  });

  return data;
};
