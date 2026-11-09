import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDailyRewards, createDailyRewards } from "../../../store/dailyRewardsSlice";
import styles from "./DailyRewards.module.css";

// Reward options for item_name (Strictly synced with Backend Enums)
const rewardOptions = [
  { value: "strixgold", label: "Strix Gold" },
  { value: "progressionxp", label: "Progression XP" },
  { value: "commonchest", label: "Common Chest" },
  { value: "legendarychest", label: "Legendary Chest" },
  { value: "gamecurrency", label: "Game Currency" },
];

const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function DailyRewards() {
  const dispatch = useDispatch();
  const { activeReward, nextWeekReward, loading } = useSelector((state) => state.dailyRewards);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    dispatch(fetchDailyRewards());
  }, [dispatch]);

  // Next week configuration state
  const [nextWeekConfig, setNextWeekConfig] = useState(() => {
    return Array.from({ length: 7 }, (_, i) => ({
      day: String(i + 1),
      item_name: "strixgold",
      item_quantity: "100",
    }));
  });

  const handleRewardChange = (index, field, value) => {
    setNextWeekConfig((prevConfig) => {
      const newConfig = [...prevConfig];
      newConfig[index] = {
        ...newConfig[index],
        [field]: value,
      };
      return newConfig;
    });
  };

  const handleSaveConfig = async () => {
    const payload = {
      name: "Week Daily Rewards Manifest",
      data: nextWeekConfig
    };
    
    try {
      await dispatch(createDailyRewards(payload)).unwrap();
      setToastMessage("Next week rewards saved successfully!");
      setTimeout(() => setToastMessage(""), 3000);
    } catch (err) {
      setToastMessage("Failed to save rewards: " + err);
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  // Helper to parse the JSON manifest file from the backend safely
  const parseManifest = (manifestString) => {
    if (!manifestString) return [];
    try {
      return JSON.parse(manifestString).data || [];
    } catch (e) {
      return [];
    }
  };

  const activeRewardsData = activeReward ? parseManifest(activeReward.manifest_file) : [];

  const getFriendlyName = (rawName) => {
    const map = {
      'strixgold': 'Strix Gold',
      'progressionxp': 'Prog XP',
      'commonchest': 'Common Chest',
      'legendarychest': 'Legend Chest',
      'gamecurrency': 'Currency'
    };
    return map[rawName.toLowerCase()] || rawName;
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <svg
              className={styles.icon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
              ></path>
            </svg>
            This Week's Rewards
          </h2>
        </div>
        <div className={styles.cardContent}>
          <div className={styles.rewardsGrid}>
            {loading ? <p>Loading rewards...</p> : activeRewardsData.length > 0 ? (
              activeRewardsData.map((item, i) => (
                <div key={i} className={styles.rewardItem}>
                  <div className={`${styles.rewardBox} ${styles[`gradient-${i + 1}`]}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ 
                      background: 'rgba(0, 0, 0, 0.45)', 
                      backdropFilter: 'blur(6px)', 
                      padding: '8px 10px', 
                      borderRadius: '12px', 
                      textAlign: 'center', 
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                      width: '85%'
                    }}>
                      <div style={{ fontSize: "0.6rem", fontWeight: "700", letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--primary-color, #fbc02d)', marginBottom: '4px', wordWrap: 'break-word' }}>
                        {getFriendlyName(item.item_name)}
                      </div>
                      <div style={{ fontSize: "0.95rem", fontWeight: "bold", textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                        +{item.item_quantity}
                      </div>
                    </div>
                  </div>
                  <div className={styles.rewardLabel}>
                    <div className={styles.rewardDay}>Day {item.day}</div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "gray" }}>No active rewards for this week.</p>
            )}
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <svg
              className={styles.icon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              ></path>
            </svg>
            Next Week Rewards
          </h2>
          <p className={styles.cardDescription}>
            Configure rewards for the upcoming week
          </p>
        </div>
        <div className={styles.cardContent}>
          <div>
            {weekDays.map((day, index) => (
              <div key={index} className={styles.dayRow}>
                <div className={styles.dayInfo}>
                  <div className={styles.dayNumber}>{index + 1}</div>
                  <div className={styles.dayDetails}>
                    <h3>{day}</h3>
                    <p>Day {index + 1} of next week</p>
                  </div>
                </div>
                <div className={styles.selectWrapper} style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <select
                      className={styles.select}
                      value={nextWeekConfig[index].item_name}
                      onChange={(e) => handleRewardChange(index, "item_name", e.target.value)}
                    >
                      {rewardOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <svg
                      className={styles.selectArrow}
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
                    </svg>
                  </div>
                  <input 
                    type="number"
                    className={styles.select} // Re-using styling class for consistency
                    style={{ WebkitAppearance: "none", paddingRight: "15px" }}
                    placeholder="Quantity"
                    value={nextWeekConfig[index].item_quantity}
                    onChange={(e) => handleRewardChange(index, "item_quantity", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleSaveConfig}
              disabled={loading}
             className={styles.saveBtn}
            >
              {loading ? "Saving..." : "Save Next Week's Rewards"}
            </button>
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={styles.toastNotification}>
          <div className={styles.toastIcon}>✨</div>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default DailyRewards;
