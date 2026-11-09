import React, { useState, useEffect } from "react";
import styles from "./StrixPass.module.css";
import { secureFetch } from "../../../utils/api";

const vipRewards = [
  { value: "promotion-xp", label: "Promotion XP (500)" },
  { value: "premium-chest", label: "Premium Chest" },
  { value: "exclusive-skin", label: "Exclusive Skin" },
  { value: "vip-coins", label: "VIP Coins (1000)" },
  { value: "legendary-item", label: "Legendary Item" },
  { value: "double-xp", label: "Double XP Boost" },
];

const freeRewards = [
  { value: "amount-xp", label: "Amount XP (100)" },
  { value: "basic-coins", label: "Basic Coins (50)" },
  { value: "common-chest", label: "Common Chest" },
  { value: "energy-boost", label: "Energy Boost" },
  { value: "basic-item", label: "Basic Item" },
  { value: "small-gems", label: "Small Gems (10)" },
];

const StrixPass = () => {
  const [vipSelections, setVipSelections] = useState({});
  const [freeSelections, setFreeSelections] = useState({});
  const [activePassData, setActivePassData] = useState(null);
  const [activePassParsed, setActivePassParsed] = useState({ vippass: [], freepass: [] });
  const [activePassLevels, setActivePassLevels] = useState(10);
  const [passDurationDays, setPassDurationDays] = useState(24);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStrixPass();
  }, []);

  const getFriendlyName = (rawName) => {
    if (!rawName) return "";
    const map = {
      'strixgold': 'Strix Gold',
      'progressionxp': 'Prog XP',
      'commonchest': 'Common Chest',
      'legendarychest': 'Legend Chest',
      'gamecurrency': 'Currency'
    };
    return map[rawName.toLowerCase()] || rawName;
  };

  const fetchStrixPass = async () => {
    try {
      const response = await secureFetch("/strixpass");
      const data = await response.json();
      if (data.message === "success" && data.data.active_pass) {
        const pass = data.data.active_pass;
        setActivePassData(pass);
        
        // Calculate duration
        if (pass.created_at && pass.expiration_date) {
          const start = new Date(pass.created_at);
          const end = new Date(pass.expiration_date);
          const diffTime = Math.abs(end - start);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setPassDurationDays(diffDays);
        }
        
        // Calculate levels
        if (pass.manifest_file) {
          const manifest = JSON.parse(pass.manifest_file);
          if (manifest.data && manifest.data.vippass) {
            setActivePassLevels(manifest.data.vippass.length);
            setActivePassParsed(manifest.data);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch Strix Pass", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRewardChange = (e, tier, level) => {
    const { value, options, selectedIndex } = e.target;
    const label = options[selectedIndex].text;

    if (tier === "vip") {
      setVipSelections((prev) => ({
        ...prev,
        [`level${level}`]: value ? { value, label } : undefined,
      }));
    } else {
      setFreeSelections((prev) => ({
        ...prev,
        [`level${level}`]: value ? { value, label } : undefined,
      }));
    }
  };

  const saveConfiguration = () => {
    console.log("VIP Configuration:", vipSelections);
    console.log("FREE Configuration:", freeSelections);
    alert("STRIX Pass configuration saved successfully!");
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>STRIX Pass</h1>
        <p>Determine the progression pass for all STRIX players</p>
      </div>

      {/* Active STRIX Pass */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Active STRIX Pass</h2>
          <span className={styles.passDuration}>
            🕒 A pass only lasts {isLoading ? "..." : passDurationDays} days
          </span>
        </div>
        <div className={styles.cardContent}>
          <div className={styles.activePassGrid}>
            {[...Array(activePassLevels)].map((_, index) => {
              const level = index + 1;
              const vipItem = activePassParsed.vippass[index];
              const freeItem = activePassParsed.freepass[index];
              return (
                <div key={level} className={styles.passLevel}>
                  <div 
                    className={`${styles.passBox} ${styles[`level${level}`]}`}
                    style={{ height: 'auto', minHeight: '8rem', width: '7rem', flexDirection: 'column', padding: '0.75rem 0.5rem', gap: '0.5rem' }}
                  >
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '2px', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>Lvl {level}</div>

                    {/* VIP Reward */}
                    {vipItem && (
                      <div style={{ 
                        background: 'rgba(0, 0, 0, 0.45)', 
                        backdropFilter: 'blur(6px)', 
                        padding: '6px 4px', 
                        borderRadius: '8px', 
                        textAlign: 'center', 
                        color: 'white',
                        border: '1px solid rgba(255, 215, 0, 0.5)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        width: '100%'
                      }}>
                        <div style={{ fontSize: "0.55rem", fontWeight: "800", color: '#fbbf24', textTransform: 'uppercase', marginBottom: '2px' }}>VIP</div>
                        <div style={{ fontSize: "0.6rem", fontWeight: "700", wordWrap: 'break-word', lineHeight: '1.2' }}>
                          {getFriendlyName(vipItem.item_name)}
                        </div>
                        <div style={{ fontSize: "0.8rem", fontWeight: "bold" }}>
                          +{vipItem.item_quantity}
                        </div>
                      </div>
                    )}

                    {/* FREE Reward */}
                    {freeItem && (
                      <div style={{ 
                        background: 'rgba(0, 0, 0, 0.3)', 
                        backdropFilter: 'blur(6px)', 
                        padding: '6px 4px', 
                        borderRadius: '8px', 
                        textAlign: 'center', 
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        width: '100%'
                      }}>
                        <div style={{ fontSize: "0.55rem", fontWeight: "800", color: '#e5e7eb', textTransform: 'uppercase', marginBottom: '2px' }}>FREE</div>
                        <div style={{ fontSize: "0.6rem", fontWeight: "700", wordWrap: 'break-word', lineHeight: '1.2' }}>
                          {getFriendlyName(freeItem.item_name)}
                        </div>
                        <div style={{ fontSize: "0.8rem", fontWeight: "bold" }}>
                          +{freeItem.item_quantity}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Next STRIX Pass */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Next STRIX Pass</h2>
          <p className={styles.subText}>
            Configure rewards for the upcoming pass (becomes active when current
            pass ends)
          </p>
        </div>
        <div className={styles.cardContent}>
          <div className={styles.nextPassGrid}>
            {/* VIP Column */}
            <div className={`${styles.passColumn} ${styles.vip}`}>
              <div className={styles.columnHeader}>
                <h3 className={`${styles.columnTitle} ${styles.vip}`}>VIP</h3>
                <p className={styles.exampleText}>
                  Choose ITEM (e.g. Promotion XP ✓)
                </p>
              </div>
              <div id="vipLevels">
                {[...Array(10)].map((_, i) => {
                  const level = i + 1;
                  const isSelected = !!vipSelections[`level${level}`];
                  return (
                    <div key={`vip-${level}`} className={styles.levelConfig}>
                      <div className={styles.levelHeader}>Level {level}</div>
                      <div className={styles.itemSelector}>
                        <div className={styles.selectWrapper}>
                          <select
                            className={styles.select}
                            onChange={(e) =>
                              handleRewardChange(e, "vip", level)
                            }
                            value={vipSelections[`level${level}`]?.value || ""}
                          >
                            <option value="">Choose Item</option>
                            {vipRewards.map((reward) => (
                              <option key={reward.value} value={reward.value}>
                                {reward.label}
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
                        {isSelected && (
                          <span className={styles.checkmark}>✓</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FREE Column */}
            <div className={`${styles.passColumn} ${styles.free}`}>
              <div className={styles.columnHeader}>
                <h3 className={`${styles.columnTitle} ${styles.free}`}>FREE</h3>
                <p className={styles.exampleText}>
                  Choose ITEM (e.g. Amount XP ✓)
                </p>
              </div>
              <div id="freeLevels">
                {[...Array(10)].map((_, i) => {
                  const level = i + 1;
                  const isSelected = !!freeSelections[`level${level}`];
                  return (
                    <div key={`free-${level}`} className={styles.levelConfig}>
                      <div className={styles.levelHeader}>Level {level}</div>
                      <div className={styles.itemSelector}>
                        <div className={styles.selectWrapper}>
                          <select
                            className={styles.select}
                            onChange={(e) =>
                              handleRewardChange(e, "free", level)
                            }
                            value={freeSelections[`level${level}`]?.value || ""}
                          >
                            <option value="">Choose Item</option>
                            {freeRewards.map((reward) => (
                              <option key={reward.value} value={reward.value}>
                                {reward.label}
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
                        {isSelected && (
                          <span className={styles.checkmark}>✓</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Section */}
      <div className={styles.saveSection}>
        <button className={styles.saveBtn} onClick={saveConfiguration}>
          SAVE
        </button>
      </div>
    </div>
  );
};

export default StrixPass;
