import styles from "./ProcessTopup.module.css";

export default function ProcessTopup() {
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Process Topup</h1>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Player Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Player Information</h2>
          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Player Name</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Enter player name"
                defaultValue="Player_U7"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Topup</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Select topup type"
                defaultValue="Call of Duty: Mobile"
              />
            </div>
          </div>
        </section>

        {/* Topup Details Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Topup Details</h2>
          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Topup Item</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Type of topup"
                defaultValue="COD POINTS"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Amount</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Enter amount"
                defaultValue="350 CP"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Date/Time of Purchase</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Purchase date and time"
              defaultValue="22nd, March 2025 - 04:32 PM"
            />
          </div>
        </section>

        {/* Transaction Details Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Transaction Details</h2>
          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Stryx Player ID</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Player ID"
                defaultValue="P2341756221"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Country</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Country"
                defaultValue="NIGERIA"
              />
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Amount Paid</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Amount paid"
                defaultValue="NGN 14,450.00"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Payment Channel</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Payment channel"
                defaultValue="PAYSTACK"
              />
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Payment Reference</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Reference number"
                defaultValue="1937142458"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Payment Status</label>
              <div className={styles.statusBadge}>
                <span>✓ STEAM VERIFIED</span>
              </div>
            </div>
          </div>
        </section>

        {/* Message/Notes Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Message</h2>
          <div className={styles.formGroup}>
            <textarea
              className={styles.textarea}
              placeholder="Add notes or message..."
              rows="4"
              defaultValue="FAB to launch 3D party website for pump purchase"
            />
          </div>
        </section>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button className={styles.btnDecline}>Decline Purchase</button>
          <button className={styles.btnApprove}>Approve Purchase</button>
        </div>
      </div>
    </div>
  );
}
