"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import styles from "./AddCurrency.module.css";

// ==================== IMAGE UPLOAD COMPONENT ====================
function ImageUpload({ id, label, value, onChange }) {
  const [preview, setPreview] = useState(value || "");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        setPreview(result);
        onChange(file, result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={styles.fieldGroup}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.inputWrapper}>
        <input
          id={id}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
        {preview && (
          <div className={styles.previewContainer}>
            <img
              src={preview || "/placeholder.svg"}
              alt="Preview"
              className={styles.previewImage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== CURRENCY FIELD COMPONENT ====================
export function Game({ onSave }) {
  const [currencyTypes, setCurrencyTypes] = useState([
    {
      id: "1",
      title: "",
      currencyCover: "",
      priceRows: [
        {
          id: "row-1",
          quantity: "",
          price: "",
        },
      ],
    },
  ]);

  const handleInputChange = (id, field, value) => {
    setCurrencyTypes(
      currencyTypes.map((ct) => (ct.id === id ? { ...ct, [field]: value } : ct))
    );
  };

  const handlePriceRowChange = (currencyId, rowId, field, value) => {
    setCurrencyTypes(
      currencyTypes.map((ct) =>
        ct.id === currencyId
          ? {
              ...ct,
              priceRows: ct.priceRows.map((row) =>
                row.id === rowId ? { ...row, [field]: value } : row
              ),
            }
          : ct
      )
    );
  };

  const handleAddPriceRow = (currencyId) => {
    setCurrencyTypes(
      currencyTypes.map((ct) =>
        ct.id === currencyId
          ? {
              ...ct,
              priceRows: [
                ...ct.priceRows,
                {
                  id: `row-${Date.now()}`,
                  quantity: "",
                  price: "",
                },
              ],
            }
          : ct
      )
    );
  };

  const handleRemovePriceRow = (currencyId, rowId) => {
    setCurrencyTypes(
      currencyTypes.map((ct) =>
        ct.id === currencyId
          ? {
              ...ct,
              priceRows: ct.priceRows.filter((row) => row.id !== rowId),
            }
          : ct
      )
    );
  };

  const handleAddCurrencyType = () => {
    const newId = String(
      Math.max(...currencyTypes.map((ct) => Number.parseInt(ct.id)), 0) + 1
    );
    setCurrencyTypes([
      ...currencyTypes,
      {
        id: newId,
        title: "",
        currencyCover: "",
        priceRows: [
          {
            id: "row-1",
            quantity: "",
            price: "",
          },
        ],
      },
    ]);
  };

  const handleRemoveCurrencyType = (id) => {
    if (currencyTypes.length > 1) {
      setCurrencyTypes(currencyTypes.filter((ct) => ct.id !== id));
    }
  };

  const handleImageUpload = (currencyId, file, preview) => {
    handleInputChange(currencyId, "currencyCover", preview);
  };

  const handleSave = () => {
    onSave?.(currencyTypes);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {currencyTypes.map((currencyType, index) => (
          <div key={currencyType.id} className={styles.currencySection}>
            {/* Currency Type Header */}
            <div className={styles.headerRow}>
              <h3 className={styles.title}>Currency Type {index + 1}</h3>
              {currencyTypes.length > 1 && (
                <button
                  onClick={() => handleRemoveCurrencyType(currencyType.id)}
                  className={styles.deleteBtn}
                  title="Delete currency type"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Two Column Grid */}
            <div className={styles.grid}>
              {/* Left Column */}
              <div className={styles.column}>
                {/* Title Field */}
                <div className={styles.fieldGroup}>
                  <label
                    htmlFor={`title-${currencyType.id}`}
                    className={styles.label}
                  >
                    Title
                  </label>
                  <input
                    id={`title-${currencyType.id}`}
                    type="text"
                    placeholder="Enter title (e.g., Battle Pass)"
                    value={currencyType.title}
                    onChange={(e) =>
                      handleInputChange(
                        currencyType.id,
                        "title",
                        e.target.value
                      )
                    }
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className={styles.column}>
                <ImageUpload
                  id={`cover-${currencyType.id}`}
                  label="Currency Cover"
                  value={currencyType.currencyCover}
                  onChange={(file, preview) =>
                    handleImageUpload(currencyType.id, file, preview)
                  }
                />
              </div>
            </div>

            {/* Price Rows Section */}
            <div className={styles.priceSection}>
              <p className={styles.sectionLabel}>Quantity & Price</p>
              {currencyType.priceRows.map((row) => (
                <div key={row.id} className={styles.priceGrid}>
                  {/* Quantity Field */}
                  <input
                    type="number"
                    placeholder="Quantity (TQT)"
                    value={row.quantity}
                    onChange={(e) =>
                      handlePriceRowChange(
                        currencyType.id,
                        row.id,
                        "quantity",
                        e.target.value
                      )
                    }
                    className={styles.input}
                  />

                  {/* Price Field with Delete */}
                  <div className={styles.priceInputRow}>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Price (NAIRA)"
                      value={row.price}
                      onChange={(e) =>
                        handlePriceRowChange(
                          currencyType.id,
                          row.id,
                          "price",
                          e.target.value
                        )
                      }
                      className={styles.inputFlex}
                    />
                    {currencyType.priceRows.length > 1 && (
                      <button
                        onClick={() =>
                          handleRemovePriceRow(currencyType.id, row.id)
                        }
                        className={styles.deleteBtn}
                        title="Delete price row"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                onClick={() => handleAddPriceRow(currencyType.id)}
                className={styles.addMoreBtn}
              >
                <Plus size={16} className={styles.icon} />
                Add more field
              </button>
            </div>

            {/* Separator */}
            {index < currencyTypes.length - 1 && (
              <div className={styles.separator} />
            )}
          </div>
        ))}

        {/* Add New Currency Type Button */}
        <button
          onClick={handleAddCurrencyType}
          className={styles.addCurrencyBtn}
        >
          <Plus size={20} className={styles.icon} />
          Add Currency Type
        </button>

        {/* Save Button */}
        <button onClick={handleSave} className={styles.saveBtn}>
          Save
        </button>
      </div>
    </div>
  );
}

export default Game;
