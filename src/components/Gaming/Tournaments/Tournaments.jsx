import { useState } from "react";
import styles from "./Tournaments.module.css";

// These components (Card, Button, Select, etc.) from Shadcn are not part of a default Vite setup.
// To use them, you would need to either install and configure Shadcn UI or
// replace them with standard HTML elements and apply the CSS modules classes.
// For this conversion, we'll use standard HTML to keep it simple.

// The 'use client' directive is for Next.js and is not needed in Vite.
// Image component is also a Next.js component. We will use a standard <img> tag.

export default function TournamentsAdminPage() {
  const [filterValue, setFilterValue] = useState("");

  const ongoingTournaments = [
    { id: 1, image: "/placeholder.svg?height=200&width=300&text=Tournament+1" },
    { id: 2, image: "/placeholder.svg?height=200&width=300&text=Tournament+2" },
    { id: 3, image: "/placeholder.svg?height=200&width=300&text=Tournament+3" },
    { id: 4, image: "/placeholder.svg?height=200&width=300&text=Tournament+4" },
  ];

  const upcomingTournaments = [
    {
      id: 1,
      game: "Warzone Mobile",
      prize: "$35,000",
      description: "CarrierZone Tournament",
      users: "User1 - 02/08/25",
      color: styles.bgOrange,
    },
    {
      id: 2,
      game: "PUBG",
      prize: "Be best PUBG",
      description: "Tournament of our time",
      users: "User - 02/08/25",
      color: styles.bgBlue,
    },
    {
      id: 3,
      game: "CODM",
      prize: "Test your skills",
      description: "In this tourney",
      users: "User - 02/08/25",
      color: styles.bgPurple,
    },
  ];

  const handleFilterChange = (event) => {
    setFilterValue(event.target.value);
  };

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <header className={styles.header}>
        <h1 className={styles.heading}>VIEW/Manage Tournaments</h1>
        <button className={styles.createButton}>Create</button>
      </header>

      {/* Filter Section */}
      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Filter:</span>
          <select
            value={filterValue}
            onChange={handleFilterChange}
            className={styles.filterSelect}
          >
            <option value="">Dropdown</option>
            <option value="strix">Strix</option>
            <option value="external-player">External/Player</option>
          </select>
        </div>
      </div>

      {/* Ongoing Tournaments Section */}
      <section className={styles.ongoingSection}>
        <h2 className={styles.subheading}>Ongoing Tournaments</h2>
        <div className={styles.gridContainer}>
          {ongoingTournaments.map((tournament) => (
            <div key={tournament.id} className={styles.card}>
              <div className={styles.cardImageContainer}>
                <img
                  src={tournament.image || "/placeholder.svg"}
                  alt={`Tournament ${tournament.id}`}
                  className={styles.cardImage}
                />
                <div className={styles.liveBadgeContainer}>
                  <span className={styles.liveBadge}>Live</span>
                </div>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.placeholderBox}>
                  <span className={styles.placeholderText}>
                    Tournament Details
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Tournaments Section */}
      <section>
        <h2 className={styles.subheading}>Upcoming Tournaments</h2>
        <div className={styles.upcomingGrid}>
          {upcomingTournaments.map((tournament) => (
            <div key={tournament.id} className={styles.card}>
              <div className={`${styles.cardHeader} ${tournament.color}`}>
                <div className={styles.upcomingBadgeContainer}>
                  <span className={styles.upcomingBadge}>
                    {tournament.game}
                  </span>
                </div>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.cardBody}>
                  <div>
                    <p className={styles.cardText}>
                      {tournament.prize} - {tournament.description}
                    </p>
                  </div>
                  <div className={styles.userContainer}>
                    <div className={styles.userIcon}>
                      <span role="img" aria-label="user">
                        👤
                      </span>
                    </div>
                    <span className={styles.userText}>{tournament.users}</span>
                  </div>
                  <button className={styles.editButton}>Edit</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
