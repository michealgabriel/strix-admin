import React from "react";
import styles from "./SaleItems.module.css";

const goldBundles = [
  { quantity: "350 STRIX GOLD", price: "2.99" },
  { quantity: "650 STRIX GOLD", price: "6.99" },
  { quantity: "1800 STRIX GOLD", price: "17.99" },
  { quantity: "3400 STRIX GOLD", price: "34.99" },
];

const AddIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={styles.addIcon}
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const SaleItems = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Shop Sale Items</h1>
        <button className={`${styles.button} ${styles.addButton}`}>
          <AddIcon />
          Add New Item
        </button>
      </header>

      <main className={styles.mainGrid}>
        {/* Strix Gold Bundles Section */}
        <div className={`${styles.card} ${styles.fullWidthCard}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Strix Gold Bundles</h2>
            <p className={styles.cardDescription}>
              Manage the available Strix Gold quantities and their prices.
            </p>
          </div>
          <div className={styles.cardContent}>
            {goldBundles.map((bundle, index) => (
              <div key={index} className={styles.bundleItem}>
                <div className={styles.inputWrapper}>
                  <label
                    htmlFor={`strix-quantity-${index}`}
                    className={styles.srOnly}
                  >
                    Strix Quantity
                  </label>
                  <input
                    id={`strix-quantity-${index}`}
                    type="text"
                    defaultValue={bundle.quantity}
                    className={styles.input}
                  />
                </div>
                <div className={styles.inputWrapper}>
                  <label
                    htmlFor={`strix-price-${index}`}
                    className={styles.srOnly}
                  >
                    Amount in Dollars
                  </label>
                  <div className={styles.inputWithIcon}>
                    <span className={styles.inputIcon}>$</span>
                    <input
                      id={`strix-price-${index}`}
                      type="text"
                      defaultValue={bundle.price}
                      className={styles.input}
                    />
                  </div>
                </div>
                <button className={`${styles.button} ${styles.editButton}`}>
                  Edit
                </button>
                <button className={`${styles.button} ${styles.deleteButton}`}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Chest Items Section */}
        <div className={`${styles.card} ${styles.fullWidthCard}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Chest Items</h2>
            <p className={styles.cardDescription}>
              Configure the details for common and legendary chests.
            </p>
          </div>
          <div className={`${styles.cardContent} ${styles.chestGrid}`}>
            {/* Common Chest */}
            <div className={styles.chestItem}>
              <h3 className={styles.chestTitle}>Common Chest</h3>
              <div className={styles.chestImage}>
                <img
                  src="/placeholder.svg" // Replace with your image path
                  alt="Common Chest Icon"
                  className={styles.image}
                />
              </div>
              <button className={`${styles.button} ${styles.freeButton}`}>
                FREE
              </button>
            </div>

            {/* Legendary Chest */}
            <div className={styles.chestItem}>
              <h3 className={styles.chestTitle}>Legendary Chest</h3>
              <div className={styles.chestImage}>
                <img
                  src="/placeholder.svg" // Replace with your image path
                  alt="Legendary Chest Icon"
                  className={styles.image}
                />
              </div>
              <div className={styles.priceContainer}>
                <input
                  type="number"
                  defaultValue={100}
                  className={`${styles.input} ${styles.priceInput}`}
                />
                <span className={styles.priceLabel}>*Amount in Strix gold</span>
              </div>
              <button
                className={`${styles.button} ${styles.editButton} ${styles.marginTop}`}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SaleItems;
