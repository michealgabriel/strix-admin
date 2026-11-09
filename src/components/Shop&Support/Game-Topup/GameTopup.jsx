import React from "react";
import styles from "./GameTopup.module.css";

const GameTopup = () => {
  // Mock data for games and purchases
  const games = [
    {
      sn: 1,
      name: "Call of Duty Mobile",
      coverClass: styles.coverCod,
      status: "Active",
    },
    {
      sn: 2,
      name: "PUBG Mobile",
      coverClass: styles.coverPubg,
      status: "Active",
    },
    {
      sn: 3,
      name: "Free Fire",
      coverClass: styles.coverFreefire,
      status: "Active",
    },
  ];

  const purchases = [
    {
      sn: 1,
      player: "MountMe_97",
      game: "Brawl Stars",
      item: "500 Gems",
      gameTagClass: styles.tagEmerald,
    },
    {
      sn: 2,
      player: "XgamingX_23",
      game: "PUBG Mobile",
      item: "1000 UC",
      gameTagClass: styles.tagOrange,
    },
    {
      sn: 3,
      player: "ProPlayer_44",
      game: "Free Fire",
      item: "250 Diamonds",
      gameTagClass: styles.tagRed,
    },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerWrapper}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>Game Top-Up Manager</h1>
            <p className={styles.subtitle}>
              Manage topup games & currencies for specific countries
            </p>
          </div>
          <button className={styles.addButton}>+ Add Game Topup</button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Select Country</label>
            <select className={styles.countrySelect}>
              <option>Nigeria</option>
              <option>USA</option>
              <option>Ghana</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Available Games Section */}
        <section>
          <h2 className={styles.sectionTitle}>
            <span className={styles.titleBarEmerald}></span>
            Available Game Topups
          </h2>

          <div className={styles.card}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th className={styles.th}>S/N</th>
                    <th className={styles.th}>Game Cover</th>
                    <th className={styles.th}>Game Name</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {games.map((game) => (
                    <tr key={game.sn} className={styles.tableRow}>
                      <td className={styles.tdPrimary}>{game.sn}</td>
                      <td className={styles.td}>
                        <div
                          className={`${styles.gameCover} ${game.coverClass}`}
                        ></div>
                      </td>
                      <td className={styles.tdPrimary}>{game.name}</td>
                      <td className={styles.td}>
                        <span className={styles.statusActive}>
                          ● {game.status}
                        </span>
                      </td>
                      <td className={styles.tdActions}>
                        <button className={styles.actionDisable}>
                          Disable
                        </button>
                        <button className={styles.actionManage}>Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Pending Purchases Section */}
        <section>
          <div className={styles.pendingHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.titleBarOrange}></span>
              Pending Purchases
            </h2>
            <div className={styles.filterGroup}>
              <label className={styles.label}>Filter by Status</label>
              <select className={styles.statusSelect}>
                <option>All Status</option>
                <option>Pending</option>
                <option>Processing</option>
                <option>Completed</option>
              </select>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th className={styles.th}>S/N</th>
                    <th className={styles.th}>Player</th>
                    <th className={styles.th}>Game</th>
                    <th className={styles.th}>Item</th>
                    <th className={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {purchases.map((purchase) => (
                    <tr key={purchase.sn} className={styles.tableRow}>
                      <td className={styles.tdSecondary}>{purchase.sn}</td>
                      <td className={styles.tdPrimary}>{purchase.player}</td>
                      <td className={styles.tdSecondary}>
                        <span
                          className={`${styles.gameTag} ${purchase.gameTagClass}`}
                        >
                          {purchase.game}
                        </span>
                      </td>
                      <td className={styles.tdSecondary}>{purchase.item}</td>
                      <td className={styles.td}>
                        <button className={styles.actionProcess}>
                          Process
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default GameTopup;
