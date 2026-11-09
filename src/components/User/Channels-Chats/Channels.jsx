import { X, Send, ArrowLeft } from "lucide-react";
import { useState } from "react";
import styles from "./Channels.module.css"; // Import the CSS module

// Data definitions using plain JS objects. JSDoc is used for editor hints only.
/**
 * @typedef {object} Channel
 * @property {string} id
 * @property {string} name
 * @property {number} userCount
 * @property {string} image
 * @property {string} bgColor
 */

/**
 * @typedef {object} Message
 * @property {string} id
 * @property {string} username
 * @property {string} avatar
 * @property {string} content
 * @property {string} timestamp
 * @property {boolean} [hasImage]
 */

/** @type {Channel[]} */
const DUMMY_CHANNELS = [
  {
    id: "1",
    name: "Fortnite",
    userCount: 8124,
    image: "🎮",
    bgColor: "channel-fortnite",
  },
  {
    id: "2",
    name: "Apexlegends",
    userCount: 8171,
    image: "⚔️",
    bgColor: "channel-alexlegends",
  },
  {
    id: "3",
    name: "Overwatch",
    userCount: 8271,
    image: "👾",
    bgColor: "channel-overwatch",
  },
  {
    id: "4",
    name: "Valorant",
    userCount: 7642,
    image: "🔫",
    bgColor: "channel-valorant",
  },
  {
    id: "5",
    name: "League of Legends",
    userCount: 9234,
    image: "👑",
    bgColor: "channel-lol",
  },
  {
    id: "6",
    name: "CSGO",
    userCount: 7891,
    image: "💥",
    bgColor: "channel-csgo",
  },
];

/** @type {{ [key: string]: Message[] }} */
const DUMMY_MESSAGES = {
  1: [
    {
      id: "1",
      username: "PHANTOM",
      avatar: "🎮",
      content: "Yes it will give you 200 coupons when you login the first time",
      timestamp: "02/28/2025 4:06 AM",
    },
    {
      id: "2",
      username: "G6hoy472",
      avatar: "👤",
      content: "Interesting, must be a bug then, I haven't received anything",
      timestamp: "Yesterday at 1:25 PM",
    },
    {
      id: "3",
      username: "G6hoy472",
      avatar: "👤",
      content: "Have a look",
      timestamp: "Yesterday at 1:45 PM",
    },
    {
      id: "4",
      username: "G6hoy472",
      avatar: "👤",
      content: "This is an image message",
      timestamp: "Yesterday at 2:15 PM",
      hasImage: true,
    },
    {
      id: "5",
      username: "XeLUFFY",
      avatar: "👤",
      content: "Yup 😂 I got mine last night. Had a blast at the game!",
      timestamp: "March 1, 3:05",
    },
    {
      id: "6",
      username: "PHANTOM",
      avatar: "🎮",
      content:
        "Hmm...that's strange. I'll have the team look into this issue 🚀",
      timestamp: "Today at 12:34 PM",
    },
  ],
  2: [
    {
      id: "1",
      username: "Legend_Pro",
      avatar: "⚔️",
      content: "Amazing gameplay everyone!",
      timestamp: "Today at 10:20 AM",
    },
    {
      id: "2",
      username: "SkyWalker88",
      avatar: "👤",
      content: "Can't wait for the next tournament",
      timestamp: "Today at 11:45 AM",
    },
  ],
  3: [
    {
      id: "1",
      username: "StormRider",
      avatar: "👾",
      content: "Who's ready for competitive season?",
      timestamp: "Today at 9:30 AM",
    },
    {
      id: "2",
      username: "NeonGhost",
      avatar: "👤",
      content: "Always ready! Let's go! 🔥",
      timestamp: "Today at 9:35 AM",
    },
  ],
};

export default function Channels() {
  // state initialization without type annotations
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const handleChannelSelect = (channel) => {
    setSelectedChannel(channel);
    setMessages(DUMMY_MESSAGES[channel.id] || []);
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedChannel) {
      const message = {
        id: String(messages.length + 1),
        username: "You",
        avatar: "👤",
        content: newMessage,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages([...messages, message]);
      setNewMessage("");
    }
  };

  const handleCloseChat = () => {
    setSelectedChannel(null);
    setMessages([]);
  };

  // Helper to dynamically get CSS class name
  const getChannelBgClass = (channel) => {
    return styles[channel.bgColor] || styles["channel-default"];
  };

  return (
    <div className={styles["channels-container"]}>
      {/* Main Content */}
      <div className={styles["main-content"]}>
        <div className={styles["content-wrapper"]}>
          {/* Header */}
          <div className={styles["header"]}>
            <div>
              <h1 className={styles["header-title"]}>
                VIEW/Manage STRIX Admin Channels
              </h1>
            </div>
            <button className={styles["create-button"]}>
              + Create Channel
            </button>
          </div>

          {/* Channels Grid */}
          <div className={styles["channels-grid"]}>
            {DUMMY_CHANNELS.map((channel) => (
              <div // Channel Card
                key={channel.id}
                onClick={() => handleChannelSelect(channel)}
                className={styles["channel-card"]}
              >
                <div
                  className={`${
                    styles["channel-image-area"]
                  } ${getChannelBgClass(channel)}`}
                >
                  <div className={styles["overlay"]}></div>

                  {/* Player Count Badge */}
                  <div className={styles["user-count-badge"]}>
                    <span className={styles["badge-icon"]}>👥</span>
                    <span className={styles["badge-count"]}>
                      {(channel.userCount / 1000).toFixed(1)}K
                    </span>
                  </div>

                  {/* Game Icon */}
                  <span className={styles["game-icon"]}>{channel.image}</span>
                </div>

                {/* Channel Name */}
                <div className={styles["channel-name-area"]}>
                  <h3 className={styles["channel-name"]}>{channel.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedChannel && (
        <div
          className={styles["chat-modal-backdrop"]}
          onClick={handleCloseChat}
        >
          <div // Chat Modal
            className={styles["chat-modal"]}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Chat Header */}
            <div className={styles["chat-header"]}>
              <div className={styles["chat-header-info"]}>
                <button
                  onClick={handleCloseChat}
                  className={styles["back-button"]}
                >
                  <ArrowLeft className={styles["back-icon"]} />
                </button>
                <div>
                  <h2 className={styles["chat-title"]}>
                    {selectedChannel.name}
                  </h2>
                </div>
              </div>
              <button
                onClick={handleCloseChat}
                className={styles["close-button"]}
              >
                <X className={styles["close-icon"]} />
              </button>
            </div>

            {/* Messages Area */}
            <div className={styles["messages-area"]}>
              {messages.map((message) => (
                <div key={message.id} className={styles["message-item"]}>
                  {/* Avatar */}
                  <div className={styles["message-avatar"]}>
                    {message.avatar || "👤"}
                  </div>

                  {/* Message Content */}
                  <div className={styles["message-content"]}>
                    <div className={styles["message-meta"]}>
                      <span className={styles["message-username"]}>
                        {message.username}
                      </span>
                      <span className={styles["message-timestamp"]}>
                        {message.timestamp}
                      </span>
                    </div>

                    {message.hasImage ? (
                      <div className={styles["image-placeholder"]}>
                        <span className={styles["image-text"]}>
                          Image Content
                        </span>
                      </div>
                    ) : (
                      <p className={styles["message-text"]}>
                        {message.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className={styles["message-input-area"]}>
              <div className={styles["message-input-wrapper"]}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Message"
                  className={styles["message-input"]}
                />
                <button
                  onClick={handleSendMessage}
                  className={styles["send-button"]}
                >
                  <Send className={styles["send-icon"]} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
