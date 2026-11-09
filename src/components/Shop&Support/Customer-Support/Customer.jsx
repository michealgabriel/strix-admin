import React, { useState } from "react";
import styles from "./Customer.module.css";
import { FaArrowLeft, FaPaperPlane, FaUser } from "react-icons/fa";
import { MdDoneAll } from "react-icons/md";

function Customer() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewAll, setViewAll] = useState(false);

  // Dummy Data for Support Tickets
  const initialSupportUsers = [
    {
      id: 1,
      name: "RealJoey42",
      adminJoined: "0/1",
      chatPreview: "So, I thought the game was supposed to...",
      status: "pending",
      messages: [
        { id: 1, text: "Hello, I have an issue with my last game.", sender: "user" },
        { id: 2, text: "Hello, RealJoey! How can I help you today?", sender: "admin" },
        { id: 3, text: "Nevermind, I forgot what it was.", sender: "user" },
        { id: 4, text: "Glad to serve you, I will be closing the chat now.", sender: "admin" },
      ],
    },
    {
      id: 2,
      name: "MaxMike47",
      adminJoined: "1/1",
      chatPreview: "When will I get my rewards from the tournament?",
      status: "resolved",
      messages: [
        { id: 1, text: "When will I get my rewards from the tournament?", sender: "user" },
      ],
    },
    {
      id: 3,
      name: "ProGamer_X",
      adminJoined: "0/1",
      chatPreview: "My account seems to be locked.",
      status: "pending",
      messages: [],
    },
    {
      id: 4,
      name: "Sara_Joy",
      adminJoined: "1/1",
      chatPreview: "Can I change my username?",
      status: "resolved",
      messages: [],
    },
    {
      id: 5,
      name: "KingKish",
      adminJoined: "0/1",
      chatPreview: "Payment failed but money was deducted.",
      status: "pending",
      messages: [],
    },
    {
      id: 6,
      name: "Shadow99",
      adminJoined: "1/1",
      chatPreview: "Lag issues on the main server.",
      status: "pending",
      messages: [],
    },
  ];

  const handleEnterChat = (user) => {
    setSelectedUser(user);
  };

  const handleBack = () => {
    setSelectedUser(null);
  };

  const handleEndChat = () => {
    alert(`Chat with ${selectedUser.name} ended and marked as resolved.`);
    setSelectedUser(null);
  };

  const displayUsers = viewAll ? initialSupportUsers : initialSupportUsers.slice(0, 5);

  return (
    <div className={styles.container}>
      {!selectedUser ? (
        <>
          <div className={styles.header}>
            <h1 className={styles.title}>Customer Support</h1>
          </div>
          <div className={styles.supportListContainer}>
            <div className={styles.tableHeader}>
              <span>S/N</span>
              <span>Player</span>
              <span>Admin Joined</span>
              <span>Chat Preview</span>
              <span>Action</span>
            </div>
            {displayUsers.map((user, index) => (
              <div key={user.id} className={styles.tableRow}>
                <span className={styles.sn}>{index + 1}</span>
                <span>{user.name}</span>
                <span>{user.adminJoined}</span>
                <span className={styles.chatPreview}>{user.chatPreview}</span>
                <span>
                  {user.status === "pending" ? (
                    <button
                      className={styles.enterChatBtn}
                      onClick={() => handleEnterChat(user)}
                    >
                      ENTER CHAT
                    </button>
                  ) : (
                    <button className={styles.naBtn} disabled>
                      N/A
                    </button>
                  )}
                </span>
              </div>
            ))}
            {!viewAll && initialSupportUsers.length > 5 && (
              <div className={styles.viewAllContainer}>
                <button 
                  className={styles.viewAllBtn}
                  onClick={() => setViewAll(true)}
                >
                  View All
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <ChatView 
          user={selectedUser} 
          onBack={handleBack} 
          onEndChat={handleEndChat} 
        />
      )}
    </div>
  );
}

function ChatView({ user, onBack, onEndChat }) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      alert(`Message sent to ${user.name}: ${message}`);
      setMessage("");
    }
  };

  return (
    <div className={styles.chatViewContainer}>
      <div className={styles.chatHeader}>
        <div className={styles.userInfo}>
          <button className={styles.backBtn} onClick={onBack}>
            <FaArrowLeft size={20} />
          </button>
          <div className={styles.avatar}>
            {user.name.charAt(0)}
          </div>
          <div>
            <h3 style={{ margin: 0 }}>{user.name}</h3>
            <span style={{ fontSize: "12px", color: "#64748b" }}>Online</span>
          </div>
        </div>
        <button className={styles.endChatBtn} onClick={onEndChat}>
          <MdDoneAll size={18} />
          END CHAT
        </button>
      </div>

      <div className={styles.messagesArea}>
        {user.messages.length > 0 ? (
          user.messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.bubble} ${
                msg.sender === "user" ? styles.userBubble : styles.adminBubble
              }`}
            >
              {msg.text}
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", color: "#94a3b8", marginTop: "2rem" }}>
            Start the conversation...
          </p>
        )}
      </div>

      <div className={styles.inputArea}>
        <input
          type="text"
          placeholder="Enter Message..."
          className={styles.messageInput}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
        />
        <button className={styles.sendBtn} onClick={handleSend}>
          <FaPaperPlane size={18} />
        </button>
      </div>
    </div>
  );
}

export default Customer;
