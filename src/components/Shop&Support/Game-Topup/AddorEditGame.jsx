import styles from "./AddorEditGame.module.css";
import { useState, useRef } from "react";
import AddCurrency from "./AddCurrency.jsx";

function AddorEditGame() {
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageFile, setImageFile] = useState(null); // Keep track of the actual file
  console.log(imageFile);
  const imageUploadRef = useRef(null); // Ref for drag/drop styling

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
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
    e.stopPropagation(); // Prevent default browser behavior
    if (imageUploadRef.current) {
      imageUploadRef.current.classList.add(styles.dragover);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent default browser behavior
    if (imageUploadRef.current) {
      imageUploadRef.current.classList.remove(styles.dragover);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent default browser behavior
    if (imageUploadRef.current) {
      imageUploadRef.current.classList.remove(styles.dragover);
    }

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      // Simulate input change event
      handleImageFileChange({ target: { files: [files[0]] } });
    }
  };

  // GIF SECTION
  const [gifPreviewUrl, setGifPreviewUrl] = useState("");
  const [gifFile, setGifFile] = useState(null);
  // Renamed ref for clarity: gifImageRef
  const gifImageRef = useRef(null);

  // --- HANDLERS FOR GIF SECTION ---
  const handleGifFileChange = (e) => {
    // Renamed from handleFileChange
    const file = e.target.files[0];
    if (file && file.type === "image/gif") {
      setGifFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setGifPreviewUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setGifFile(null);
      setGifPreviewUrl("");
      if (e.target) e.target.value = "";
      if (file && file.type !== "image/gif") {
        alert("Only GIF files are accepted.");
      }
    }
  };

  const handleGifDragOver = (e) => {
    // Renamed from handleDragOver
    e.preventDefault();
    e.stopPropagation();
    if (gifImageRef.current) {
      // Use the correct ref
      gifImageRef.current.classList.add(styles.dragover);
    }
  };

  const handleGifDragLeave = (e) => {
    // Renamed from handleDragLeave
    e.preventDefault();
    e.stopPropagation();
    if (gifImageRef.current) {
      // Use the correct ref
      gifImageRef.current.classList.remove(styles.dragover);
    }
  };

  const handleGifDrop = (e) => {
    // Renamed from handleDrop
    e.preventDefault();
    e.stopPropagation();
    if (gifImageRef.current) {
      // Use the correct ref
      gifImageRef.current.classList.remove(styles.dragover);
    }

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === "image/gif") {
      handleGifFileChange({ target: { files: [files[0]] } }); // Use the correct handler
    } else if (files.length > 0) {
      alert("Only GIF files are accepted.");
    }
  };

  console.log("Current GIF file:", gifFile);

  return (
    <div className={styles.container}>
      <div className={styles.backCard}>
        <div className={styles.firstFlex}>
          <p className={styles.gameName}>New Game</p>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Select Country</label>
            <select className={styles.countrySelect}>
              <option>Nigeria</option>
              <option>USA</option>
              <option>Ghana</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Country Status</label>
            <select className={styles.countrySelect}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>
        <div className={styles.mainInfo}>
          <div className={styles.initialFlex}>
            <label className={styles.formLabel}>Game Image</label>
            <div
              className={styles.imageUpload}
              ref={imageUploadRef}
              onClick={() => document.getElementById("gameImageInput").click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {!imagePreviewUrl ? (
                <div>
                  <div className={styles.uploadIcon}>
                    {/* Using a simple camera emoji for the icon */}
                    📷
                  </div>
                  <div className={styles.uploadText}>
                    <span className={styles.clickUpload}>Click to upload</span>{" "}
                    or drag and drop
                    <br />
                    PNG, JPG, GIF up to 10MB
                  </div>
                </div>
              ) : (
                <img
                  id="imagePreview"
                  className={styles.imagePreview}
                  src={imagePreviewUrl}
                  alt="Game Cover Preview"
                />
              )}
            </div>
            <input
              type="file"
              id="gameImageInput" // Unique ID for this input
              className={styles.hiddenInput}
              accept="image/*"
              onChange={handleImageFileChange}
            />
          </div>
          <div className={styles.firstD}>
            <div className={styles.inputLabel}>
              <label className={styles.labelName} htmlFor="gameName">
                Name
              </label>
              <input
                className={styles.inputTextarea}
                id="gameName"
                placeholder="Input game name"
                required
              ></input>
            </div>
            <div className={styles.inputLabel}>
              <label className={styles.labelName} htmlFor="gameName">
                Finding ID GIF
              </label>
              <div
                className={styles.imageUpload}
                // FIX: Use gifImageRef and gif handlers
                ref={gifImageRef}
                onClick={() => document.getElementById("gifFileInput").click()}
                onDragOver={handleGifDragOver}
                onDragLeave={handleGifDragLeave}
                onDrop={handleGifDrop}
              >
                {!gifPreviewUrl ? (
                  <>
                    <div className={styles.uploadIcon}>🎞️</div>
                    <div className={styles.uploadText}>
                      <span className={styles.clickUpload}>
                        Click to upload
                      </span>{" "}
                      or drag and drop
                      <br />
                      **Only GIF files** (up to 10MB)
                    </div>
                  </>
                ) : (
                  <img
                    id="gifPreview"
                    className={styles.imagePreview}
                    src={gifPreviewUrl}
                    alt="GIF Preview"
                  />
                )}
              </div>
              <input
                type="file"
                id="gifFileInput" // The hidden input for the GIF section
                className={styles.hiddenInput}
                accept="image/gif"
                onChange={handleGifFileChange} // Use the correct change handler
              />
            </div>
          </div>
        </div>
        <div className={styles.currencyType}>
          <AddCurrency />
        </div>
      </div>
    </div>
  );
}

export default AddorEditGame;
