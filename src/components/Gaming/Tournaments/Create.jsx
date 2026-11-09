// Create.jsx

import React, { useState, useCallback } from "react";
import styles from "./Create.module.css";

// SVG Icon for Upload (Simplified to a functional component)
const UploadIcon = () => (
  <svg
    className={styles.uploadIcon}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

// SVG Icon for Back Button
const BackIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

const Create = () => {
  // State to hold all form data
  const [formData, setFormData] = useState({
    gameImagePreview: null,
    title: "",
    description: "",
    game: "",
    bracketType: "team-related",
    numberOfTeams: 8,
    playersPerTeam: 4,
    reviewMode: false, // Changed from regionMode
    startDate: "2025-02-08",
    entryFee: "",
  });

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNumberChange = (id, delta) => {
    setFormData((prevData) => {
      const currentValue = prevData[id];
      const newValue = Math.max(
        id === "playersPerTeam" ? 1 : 2,
        currentValue + delta
      );
      return {
        ...prevData,
        [id]: newValue,
      };
    });
  };

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prevData) => ({
          ...prevData,
          gameImagePreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        gameImagePreview: null,
      }));
    }
  }, []);

  const toggleReviewMode = () => {
    setFormData((prevData) => ({
      ...prevData,
      reviewMode: !prevData.reviewMode,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the data to an API
    console.log("Tournament Data:", formData);
    alert("Tournament created successfully!");
  };

  // Function to handle the back button click (simulating window.history.back())
  const handleBackClick = () => {
    console.log("Navigating back...");
    // In a real React app, you would use a router (e.g., useNavigate from react-router-dom)
    // For this example, we'll just log an action.
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={handleBackClick}>
          <BackIcon />
        </button>
        <h1>Create Tournament</h1>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit}>
          {/* Game Image Upload */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Select Image</label>
            <label htmlFor="gameImage" className={styles.uploadArea}>
              <input
                type="file"
                id="gameImage"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }} // Keep input hidden
              />
              {formData.gameImagePreview ? (
                <img
                  src={formData.gameImagePreview}
                  alt="Game Preview"
                  className={styles.uploadPreview}
                />
              ) : (
                <div className={styles.uploadContent}>
                  <UploadIcon />
                  <span className={styles.uploadText}>Select Image</span>
                </div>
              )}
            </label>
          </div>

          {/* Title */}
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.formLabel}>
              Title
            </label>
            <input
              type="text"
              id="title"
              className={styles.formInput}
              placeholder="All joined 0.25 for grabs"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          {/* Description */}
          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.formLabel}>
              Description
            </label>
            <textarea
              id="description"
              className={styles.formTextarea}
              rows="4"
              placeholder="Tournament description"
              value={formData.description}
              onChange={handleChange}
            ></textarea>
          </div>

          {/* Game Selection */}
          <div className={styles.formGroup}>
            <label htmlFor="game" className={styles.formLabel}>
              Game
            </label>
            <select
              id="game"
              className={styles.formSelect}
              value={formData.game}
              onChange={handleChange}
            >
              <option value="">Select a game</option>
              <option value="prestine">Prestine</option>
              <option value="warzone">Warzone Mobile</option>
              <option value="pubg">PUBG</option>
              <option value="codm">CODM</option>
            </select>
          </div>

          {/* Bracket Type */}
          <div className={styles.formGroup}>
            <label htmlFor="bracketType" className={styles.formLabel}>
              Bracket Type
            </label>
            <select
              id="bracketType"
              className={styles.formSelect}
              value={formData.bracketType}
              onChange={handleChange}
            >
              <option value="team-related">Team Related</option>
              <option value="single-elimination">Single Elimination</option>
              <option value="double-elimination">Double Elimination</option>
              <option value="round-robin">Round Robin</option>
            </select>
          </div>

          {/* Number of Teams */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Number of Teams</label>
            <div className={styles.numberInputGroup}>
              <button
                type="button"
                className={styles.numberBtn}
                onClick={() => handleNumberChange("numberOfTeams", -1)}
              >
                -
              </button>
              <input
                type="number"
                id="numberOfTeams"
                className={`${styles.formInput} ${styles.numberInput}`}
                value={formData.numberOfTeams}
                min="2"
                onChange={handleChange}
              />
              <button
                type="button"
                className={styles.numberBtn}
                onClick={() => handleNumberChange("numberOfTeams", 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Players per Team */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Players per Team</label>
            <div className={styles.numberInputGroup}>
              <button
                type="button"
                className={styles.numberBtn}
                onClick={() => handleNumberChange("playersPerTeam", -1)}
              >
                -
              </button>
              <input
                type="number"
                id="playersPerTeam"
                className={`${styles.formInput} ${styles.numberInput}`}
                value={formData.playersPerTeam}
                min="1"
                onChange={handleChange}
              />
              <button
                type="button"
                className={styles.numberBtn}
                onClick={() => handleNumberChange("playersPerTeam", 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Review Mode Toggle (was Region Mode) */}
          <div className={styles.formGroup}>
            <div className={styles.toggleGroup}>
              <label className={styles.formLabel} style={{ marginBottom: 0 }}>
                Review Mode
              </label>
              <div className={styles.toggleWrapper}>
                <span className={styles.toggleLabel}>
                  {formData.reviewMode ? "ON" : "OFF"}
                </span>
                <div
                  className={`${styles.toggleSwitch} ${
                    formData.reviewMode ? styles.active : ""
                  }`}
                  onClick={toggleReviewMode}
                >
                  <div className={styles.toggleSlider}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Start Date */}
          <div className={styles.formGroup}>
            <label htmlFor="startDate" className={styles.formLabel}>
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              className={styles.formInput}
              value={formData.startDate}
              onChange={handleChange}
            />
          </div>

          {/* Entry Fee */}
          <div className={styles.formGroup}>
            <label htmlFor="entryFee" className={styles.formLabel}>
              Entry Fee
            </label>
            <input
              type="text"
              id="entryFee"
              className={styles.formInput}
              placeholder="Players entry fee to win gold"
              value={formData.entryFee}
              onChange={handleChange}
            />
          </div>

          {/* Create Button */}
          <button type="submit" className={styles.createButton}>
            Create
          </button>
        </form>
      </div>
    </div>
  );
};

export default Create;
