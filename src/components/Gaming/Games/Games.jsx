import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchGamesList, setCurrentPage, createGame, updateGame } from "../../../store/gamesListSlice";
import { secureFetch } from "../../../utils/api";
import styles from "./Games.module.css";

function GameFormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  submitButtonText,
  initialData,
  genres,
  platforms,
}) {
  const [genre, setGenre] = useState(initialData?.system_game_genre_id || "");
  const [platform, setPlatform] = useState(initialData?.system_game_platform_id || "");
  const [gameTitle, setGameTitle] = useState(initialData?.name || "");
  const [status, setStatus] = useState(initialData?.status || "active");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const imageUploadRef = useRef(null);

  // Effect to reset form when modal opens with new initial data
  useEffect(() => {
    if (isOpen) {
      setGenre(initialData?.system_game_genre_id || "");
      setPlatform(initialData?.system_game_platform_id || "");
      setGameTitle(initialData?.name || "");
      setStatus(initialData?.status || "active");
      setImageFile(null); // Reset image file
      setImagePreviewUrl(""); // Reset image preview
      if (document.getElementById("imageInput")) {
        document.getElementById("imageInput").value = "";
      }
    }
  }, [isOpen, initialData]);

  // Effect for handling body overflow and escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "auto";
        document.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isOpen, onClose]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    if (id === "genre") setGenre(value);
    else if (id === "title") setGameTitle(value);
    else if (id === "platform") setPlatform(value);
    else if (id === "status") setStatus(value);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreviewUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreviewUrl("");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (imageUploadRef.current) {
      imageUploadRef.current.classList.add(styles.dragover);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (imageUploadRef.current) {
      imageUploadRef.current.classList.remove(styles.dragover);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (imageUploadRef.current) {
      imageUploadRef.current.classList.remove(styles.dragover);
    }

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      handleImageFileChange({ target: { files: [files[0]] } });
    }
  };

  const handleSubmitInternal = (e) => {
    e.preventDefault();
    
    // If it's a completely NEW game (!initialData), the image is absolutely required!
    // If it's an EDIT (initialData), the image is optional (they might keep the old one).
    if (!genre || !platform || !gameTitle || (!imageFile && !initialData)) {
      alert("Please select a Genre, Platform, Game Title, and Game Image before submitting!");
      return;
    }
    
    const formData = {
      id: initialData?.id, // Ensure we pass the ID up during edits!
      system_game_genre_id: genre,
      system_game_platform_id: platform,
      name: gameTitle,
      status: status,
      image: imageFile,
    };
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.addGameModal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmitInternal}>
          {/* Genre Dropdown */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="genre">
              Genre
            </label>
            <select
              className={styles.formSelect}
              id="genre"
              value={genre}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a genre</option>
              {genres && genres.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="title">
              Game Title
            </label>
            <input
              type="text"
              className={styles.formInput}
              id="title"
              placeholder="Enter game title"
              value={gameTitle}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Platform Dropdown */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="platform">
              Platform
            </label>
            <select
              className={styles.formSelect}
              id="platform"
              value={platform}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a platform</option>
              {platforms && platforms.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="status">
              Status
            </label>
            <select
              className={styles.formSelect}
              id="status"
              value={status}
              onChange={handleInputChange}
              required
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Image Upload */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Game Image</label>
            <div
              className={styles.imageUpload}
              ref={imageUploadRef}
              onClick={() => document.getElementById("imageInput").click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className={styles.uploadIcon}>📷</div>
              <div className={styles.uploadText}>
                <strong>Click to upload</strong> or drag and drop
                <br />
                PNG, JPG, GIF up to 10MB
              </div>
              {imagePreviewUrl && (
                <img
                  id="imagePreview"
                  className={styles.imagePreview}
                  src={imagePreviewUrl}
                  alt="Preview"
                />
              )}
            </div>
            <input
              type="file"
              id="imageInput"
              className={styles.hiddenInput}
              accept="image/*"
              onChange={handleImageFileChange}
            />
          </div>

          {/* Buttons */}
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              {submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Games Component
function Games() {
  const dispatch = useDispatch();
  const { games, loading, totalPages, currentPage } = useSelector((state) => state.gamesList);
  const [allGenres, setAllGenres] = useState([]);
  const [platforms, setPlatforms] = useState([]);

  useEffect(() => {
    secureFetch("/platforms")
      .then((res) => { if (res.ok) return res.json(); })
      .then((data) => {
        if (data && data.data) {
          setPlatforms(data.data);
        }
      })
      .catch((err) => console.error("Could not load platforms:", err));

    secureFetch("/genres?limit=100")
      .then((res) => { if (res.ok) return res.json(); })
      .then((data) => {
        if (data && data.data) {
          setAllGenres(data.data);
        }
      })
      .catch((err) => console.error("Could not load genres:", err));
  }, []);

  useEffect(() => {
    dispatch(fetchGamesList({ page: currentPage, limit: 12 }));
  }, [currentPage, dispatch]);

  const gradientClasses = [
    styles.gradient1,
    styles.gradient2,
    styles.gradient3,
    styles.gradient4,
    styles.gradient5,
    styles.gradient6,
    styles.gradient7,
    styles.gradient8,
    styles.gradient9,
    styles.gradient10,
    styles.gradient11,
    styles.gradient12,
  ];

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [gameToEdit, setGameToEdit] = useState(null); // State to hold the game being edited

  const handleAddGame = async (formData) => {
    try {
      await dispatch(createGame(formData)).unwrap();
    } catch (err) {
      alert("Error adding game: " + (err.message || err));
    }
  };

  const handleEditGame = async (formData) => {
    try {
      await dispatch(updateGame(formData)).unwrap();
    } catch (err) {
      alert("Error updating game: " + (err.message || err));
    }
  };

  const openEditModalWithGame = (game) => {
    setGameToEdit(game);
    setIsEditModalOpen(true);
  };

  return (
    <div className={styles.bodyReset}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <button
            className={styles.addGameBtn}
            onClick={() => setIsAddModalOpen(true)}
          >
            <span>+</span>
            Add Game
          </button>
        </div>

        <div className={styles.gamesGrid}>
          {loading ? (
             <p style={{ color: 'black', textAlign: 'center', gridColumn: '1 / -1' }}>Loading games...</p>
          ) : games.length > 0 ? (
            games.map((game, index) => {
              const imageGradientClass =
                gradientClasses[index % gradientClasses.length];

              return (
                <div key={game.id} className={styles.gameCard}>
                  <div
                    className={`${styles.gameCardImage} ${game.cover_image ? '' : imageGradientClass}`}
                    style={game.cover_image ? { backgroundImage: `url(${game.cover_image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  >
                    <div className={styles.genreLabel}>
                      {game.genre?.name || "Unknown Genre"}
                    </div>
                  </div>
                  <div className={styles.gameCardContent}>
                    <div className={styles.gameInfo}>
                      <div className={styles.gameName}>{game.name}</div>
                      <div className={styles.gameDescription}>
                        Game Platform: {game.platform?.name || "Unknown"}
                      </div>
                    </div>
                    <div className={styles.gameActions}>
                      <button
                        className={`${styles.actionBtn} ${styles.editBtn}`}
                        onClick={() => openEditModalWithGame(game)}
                        style={{ width: '100%', padding: '10px 0', margin: '5px 0' }}
                      >
                        Edit Game
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎮</div>
              <h2 className={styles.emptyTitle}>No Games Found</h2>
              <p className={styles.emptyDescription}>
                It looks like you haven't added any games yet. Click "Add Game"
                to get started!
              </p>
            </div>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '30px', alignItems: 'center' }}>
             <button 
                disabled={currentPage === 1} 
                onClick={() => dispatch(setCurrentPage(currentPage - 1))} 
                style={{ padding: '8px 16px', borderRadius: '5px', background: currentPage === 1 ? '#222' : '#f87171', color: 'white', border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
             >
                Prev
             </button>
             <span style={{ color: 'white', fontWeight: 'bold' }}>Page {currentPage} of {totalPages}</span>
             <button 
                disabled={currentPage === totalPages} 
                onClick={() => dispatch(setCurrentPage(currentPage + 1))} 
                style={{ padding: '8px 16px', borderRadius: '5px', background: currentPage === totalPages ? '#222' : '#f87171', color: 'white', border: 'none', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
             >
                Next
             </button>
          </div>
        )}

        <GameFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddGame}
          title="Add New Game"
          submitButtonText="Add Game"
          initialData={null}
          genres={allGenres}
          platforms={platforms}
        />

        <GameFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEditGame}
          title="Edit Game"
          submitButtonText="Edit Game"
          initialData={gameToEdit}
          genres={allGenres}
          platforms={platforms}
        />
      </div>
    </div>
  );
}

export default Games;
