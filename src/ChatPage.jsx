import React, { useState, useEffect, useRef } from "react";
import { createClient } from "graphql-ws";
import { nhost } from "./nhost";
import "./chat.css"; // Make sure chat.css reflects the new improved styles

export default function ChatPage({ user }) {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [newChatName, setNewChatName] = useState("");
  const messagesEndRef = useRef(null);

  // Use the same admin secret everywhere!
  const ADMIN_SECRET = "t(8@-$7'rDfM_Zu$,stdbcoX*ucEnfRI";

  const wsClient = createClient({
    url: "wss://mxqijdqmvyumzvrcbwxo.hasura.ap-south-1.nhost.run/v1/graphql",
    connectionParams: {
      headers: { "x-hasura-admin-secret": ADMIN_SECRET },
    },
  });

  async function fetchHasura(query, variables) {
    const res = await fetch(
      "https://mxqijdqmvyumzvrcbwxo.hasura.ap-south-1.nhost.run/v1/graphql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": ADMIN_SECRET,
        },
        body: JSON.stringify({ query, variables }),
      }
    );
    const data = await res.json();
    if (data.errors) {
      throw new Error(
        data.errors.map((e) => e.message).join(" | ") || "GraphQL error"
      );
    }
    return data;
  }

  // Fetch chats for the user
  const fetchChats = async () => {
    try {
      const res = await fetchHasura(
        `query GetChats($user_id: uuid!) {
          chats(where: {user_id: {_eq: $user_id}}) { id name }
        }`,
        { user_id: user.id }
      );
      setChats(res.data.chats);
      if (!activeChat && res.data.chats.length) setActiveChat(res.data.chats[0]);
    } catch (err) {
      alert("Failed to load chats: " + err.message);
    }
  };

  // Fetch messages for a chat — note: using user_id as sender instead of sender
  const fetchMessages = async (chat_id) => {
    if (!chat_id) return;
    try {
      const res = await fetchHasura(
        `query GetMessages($chat_id: uuid!) {
          messages(where: {chat_id: {_eq: $chat_id}}) {
            id content user_id created_at
          }
        }`,
        { chat_id }
      );
      setMessages(res.data.messages || []);
    } catch (err) {
      alert("Failed to load messages: " + err.message);
    }
  };

  useEffect(() => {
    fetchChats();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeChat]);

  // Subscribe to messages in active chat
  useEffect(() => {
    if (!activeChat || !activeChat.id) return;
    const subscribe = wsClient.subscribe(
      {
        query: `subscription Messages($chat_id: uuid!) {
          messages(where: {chat_id: {_eq: $chat_id}}) {
            id content user_id created_at
          }
        }`,
        variables: { chat_id: activeChat.id },
      },
      {
        next: (data) => data.data && setMessages(data.data.messages),
        error: (err) => console.error(err),
      }
    );
    return () => subscribe.unsubscribe();
  }, [activeChat]);

  const safeSelectChat = (chat) => {
    if (chat && chat.id) {
      setActiveChat(chat);
      fetchMessages(chat.id);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeChat) return;
    try {
      // Send message with user_id as sender
      await fetchHasura(
        `mutation SendMessage($chat_id: uuid!, $content: String!, $user_id: uuid!) {
          insert_messages_one(object: {chat_id: $chat_id, content: $content, user_id: $user_id}) { id }
        }`,
        { chat_id: activeChat.id, content: input, user_id: user.id }
      );
      setInput("");
      // Call bot or backend after user message sent
      await fetchHasura(
        `mutation CallBot($chat_id: uuid!, $user_id: uuid!) {
          sendMessage(chat_id: $chat_id, user_id: $user_id) { id }
        }`,
        { chat_id: activeChat.id, user_id: user.id }
      );
    } catch (err) {
      alert("Failed to send message: " + err.message);
    }
  };

  const logout = async () => {
    await nhost.auth.signOut();
    window.location.reload();
  };

  const createChat = async () => {
    if (!newChatName.trim()) return;
    try {
      const res = await fetchHasura(
        `mutation CreateChat($name: String!, $user_id: uuid!) {
          insert_chats_one(object: {name: $name, user_id: $user_id}) { id name }
        }`,
        { name: newChatName, user_id: user.id }
      );
      if (!res.data || !res.data.insert_chats_one) {
        alert("Failed to create chat. Please try again.");
        return;
      }
      setChats([...chats, res.data.insert_chats_one]);
      setNewChatName("");
    } catch (err) {
      alert("Chat creation error: " + err.message);
    }
  };

  const deleteChat = async (chat_id) => {
    try {
      await fetchHasura(
        `mutation DeleteChat($id: uuid!) { delete_chats_by_pk(id: $id) { id } }`,
        { id: chat_id }
      );
      setChats(chats.filter((c) => c.id !== chat_id));
      if (activeChat?.id === chat_id) setActiveChat(null);
    } catch (err) {
      alert("Failed to delete chat: " + err.message);
    }
  };

  const editChat = async (chat_id, name) => {
    const newName = prompt("Enter new chat name:", name);
    if (!newName) return;
    try {
      await fetchHasura(
        `mutation UpdateChat($id: uuid!, $name: String!) {
          update_chats_by_pk(pk_columns: {id: $id}, _set: {name: $name}) { id name }
        }`,
        { id: chat_id, name: newName }
      );
      setChats(
        chats.map((c) => (c.id === chat_id ? { ...c, name: newName } : c))
      );
    } catch (err) {
      alert("Failed to edit chat: " + err.message);
    }
  };

  return (
    <div className="chat-app">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="user-info">
            <img
              src="chat_botimg.jpg"
              alt="avatar"
              className="sidebar-avatar"
            />
            <span>{user.email}</span>
          </div>
        </div>
        <div className="new-chat">
          <label htmlFor="new-chat-name" className="visually-hidden">
            New chat name
          </label>
          <input
            type="text"
            id="new-chat-name"
            name="newChatName"
            placeholder="New chat name..."
            value={newChatName}
            onChange={(e) => setNewChatName(e.target.value)}
          />
          <button onClick={createChat}>+</button>
        </div>
        <div className="chat-list">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${
                activeChat?.id === chat.id ? "active" : ""
              }`}
              onClick={(e) => {
                if (e.target.tagName !== "BUTTON") {
                  safeSelectChat(chat);
                }
              }}
            >
              <span className="chat-name">{chat.name || "Unnamed Chat"}</span>
              <div className="chat-actions">
                <button
                  type="button"
                  title="Edit chat"
                  className="edit-btn"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    editChat(chat.id, chat.name);
                  }}
                >
                  ✏️
                </button>
                <button
                  type="button"
                  title="Delete chat"
                  className="delete-btn"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
      <div className="chat-panel">
        {activeChat ? (
          <>
            <div className="chat-header">{activeChat?.name || "Chat"}</div>
            <div className="messages">
              {messages.map((msg) => (
                <div
                  key={msg.id || Math.random()}
                  className={`message ${
                    msg.user_id === user.id ? "sent" : "received"
                  }`}
                >
                  {msg?.content || ""}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-input">
              <label htmlFor="chat-message" className="visually-hidden">
                Type your message
              </label>
              <input
                type="text"
                id="chat-message"
                name="chatMessage"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div className="no-chat">Select or create a chat to start messaging</div>
        )}
      </div>
    </div>
  );
}
