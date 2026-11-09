import React, { useState } from "react";
import styles from "./Missions.module.css";

// Sample data for existing Power Missions
const initialPowerMissions = [
  { id: 1, objective: "Create a gaming channel", reward: 195, color: "green" },
  { id: 2, objective: "Stream for 5 hours", reward: 350, color: "orange" },
  { id: 3, objective: "Win 10 ranked matches", reward: 275, color: "purple" },
  { id: 4, objective: "Follow 20 channels", reward: 150, color: "pink" },
  { id: 5, objective: "Party with 5 teammates", reward: 225, color: "blue" },
  { id: 6, objective: "Like 50 posts", reward: 125, color: "red" },
];

// Options for the Action dropdown
const actionOptions = [
  { value: "", label: "Select action" },
  { value: "create_channel", label: "Create Channel" },
  { value: "like_post", label: "Like Post" },
  { value: "follow_channel", label: "Follow Channel" },
  { value: "party_teammate", label: "Party with Teammate" },
  { value: "stream_hours", label: "Stream Hours" },
  { value: "win_matches", label: "Win Matches" },
  { value: "upload_video", label: "Upload Video" },
];

function Missions() {
  // State to manage the dynamic form fields for "Next Power Mission"
  const [nextPowerMissions, setNextPowerMissions] = useState([
    { id: 1, title: "", action: "", number: "", reward: "" }, // Initial mission form field
  ]);
  const [errorMessage, setErrorMessage] = useState("");

  // Handles changes in any input field for the dynamic missions form
  const handleMissionInputChange = (id, field, value) => {
    setNextPowerMissions((prevMissions) =>
      prevMissions.map((mission) =>
        mission.id === id ? { ...mission, [field]: value } : mission
      )
    );
  };

  // Adds a new empty mission form set
  const handleAddUIField = () => {
    const newId =
      nextPowerMissions.length > 0
        ? Math.max(...nextPowerMissions.map((m) => m.id)) + 1
        : 1;
    setNextPowerMissions((prevMissions) => [
      ...prevMissions,
      { id: newId, title: "", action: "", number: "", reward: "" },
    ]);
    setErrorMessage(""); // Clear error message when adding a new field
  };

  // Deletes a mission form set by its ID
  const handleDeleteField = (idToDelete) => {
    setNextPowerMissions((prevMissions) =>
      prevMissions.filter((mission) => mission.id !== idToDelete)
    );
    setErrorMessage(""); // Clear error message when deleting a field
  };

  // Handles saving the power missions form
  const handleSavePowerMission = () => {
    let isValid = true;
    const emptyFields = [];

    nextPowerMissions.forEach((mission, index) => {
      const missionNumber = index + 1;
      if (!mission.title.trim()) {
        emptyFields.push(`Mission #${missionNumber} - Title/Desc`);
        isValid = false;
      }
      if (!mission.action) {
        emptyFields.push(`Mission #${missionNumber} - Action`);
        isValid = false;
      }
      if (!mission.number || mission.number <= 0) {
        emptyFields.push(`Mission #${missionNumber} - Number of Actions`);
        isValid = false;
      }
      if (!mission.reward || mission.reward <= 0) {
        emptyFields.push(`Mission #${missionNumber} - Reward Amount`);
        isValid = false;
      }
    });

    if (!isValid) {
      setErrorMessage(
        `Please complete the following fields: ${emptyFields.join(", ")}`
      );
      return;
    }

    setErrorMessage("");
    console.log("Power missions to save:", nextPowerMissions);
    // In a real application, you would send nextPowerMissions to your backend here
    // For now, we'll use a simple alert (replace with a custom modal in production)
    // alert("Power missions saved successfully! (Backend integration pending)");
    // Optional: Reset form after successful save
    // setNextPowerMissions([{ id: 1, title: '', action: '', number: '', reward: '' }]);
  };

  return (
    <div className={styles.container}>
      {/* Daily Mission Component */}
      <div className={styles.dailyMission}>
        <h2>Daily Mission</h2>
        <p>System decides the best missions for players</p>
      </div>

      {/* Power Missions Section */}
      <div className={styles.powerMissions}>
        <h2>Power Missions (Week Based)</h2>
        <div className={styles.missionsGrid}>
          {initialPowerMissions.map((mission) => (
            <div
              key={mission.id}
              className={`${styles.missionCard} ${styles[mission.color]}`}
            >
              <div className={styles.missionObjective}>{mission.objective}</div>
              <div className={styles.missionReward}>
                <svg
                  className={styles.starIcon}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {mission.reward} stars
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Power Mission Form */}
      <div className={styles.nextMissionForm}>
        <h2 className={styles.formTitle}>Next Power Mission</h2>

        <div className={styles.missionFormContainer}>
          {nextPowerMissions.map((mission, index) => (
            <div
              key={mission.id}
              className={styles.formSet}
              data-mission-id={mission.id}
            >
              <div className={styles.formSetNumber}>Mission #{index + 1}</div>
              {nextPowerMissions.length > 1 && ( // Only show delete button if more than one mission
                <button
                  className={styles.deleteFieldBtn}
                  onClick={() => handleDeleteField(mission.id)}
                  title="Delete this mission"
                >
                  &times;
                </button>
              )}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor={`title-${mission.id}`}>Title/Desc</label>
                  <input
                    type="text"
                    id={`title-${mission.id}`}
                    name={`title-${mission.id}`}
                    placeholder="Enter mission title"
                    value={mission.title}
                    onChange={(e) =>
                      handleMissionInputChange(
                        mission.id,
                        "title",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor={`action-${mission.id}`}>Action</label>
                  <select
                    id={`action-${mission.id}`}
                    name={`action-${mission.id}`}
                    value={mission.action}
                    onChange={(e) =>
                      handleMissionInputChange(
                        mission.id,
                        "action",
                        e.target.value
                      )
                    }
                  >
                    {actionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor={`number-${mission.id}`}>
                    Number of Actions
                  </label>
                  <input
                    type="number"
                    id={`number-${mission.id}`}
                    name={`number-${mission.id}`}
                    min="1"
                    placeholder="Enter number"
                    value={mission.number}
                    onChange={(e) =>
                      handleMissionInputChange(
                        mission.id,
                        "number",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor={`reward-${mission.id}`}>
                    Player Progression Reward Amount
                  </label>
                  <div className={styles.rewardInput}>
                    <input
                      type="number"
                      id={`reward-${mission.id}`}
                      name={`reward-${mission.id}`}
                      min="1"
                      placeholder="Enter stars"
                      value={mission.reward}
                      onChange={(e) =>
                        handleMissionInputChange(
                          mission.id,
                          "reward",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.buttonContainer}>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={handleAddUIField}
          >
            Add UI Field
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleSavePowerMission}
          >
            Save Power Mission
          </button>
        </div>

        {errorMessage && (
          <div className={styles.errorMessage}>{errorMessage}</div>
        )}
      </div>
    </div>
  );
}

export default Missions;
