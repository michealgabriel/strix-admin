import styles from "./Dashboard.module.css";
import React, { useState, useEffect } from "react";
import { FaGamepad, FaUser } from "react-icons/fa";
import { BsGraphUpArrow } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { fetchTotalGames, fetchPlayersData } from "../../store/analyticsSlice";
import { fetchPlayersList, setCurrentPage } from "../../store/playersListSlice";
import { fetchGenresList, setCurrentPage as setGenreCurrentPageStore } from "../../store/genresListSlice";
import ViewPlayer from "./ViewPlayer";

function Dashboard() {
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  if (selectedPlayerId) {
    return (
      <div className={styles.dashboard}>
        <button 
          onClick={() => setSelectedPlayerId(null)} 
          className={styles.strixBtn}
          style={{ marginBottom: "20px", display: "block", width: "fit-content", padding: "10px 15px" }}
        >
          ← Back to Dashboard
        </button>
        <ViewPlayer playerId={selectedPlayerId} />
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardContent}>
        <Analytics />
        <Players onViewPlayer={setSelectedPlayerId} />
        <Genres />
      </div>
    </div>
  );
}

export default Dashboard;

function Analytics() {
  const dispatch = useDispatch();
  const { 
    totalGames, 
    loading, 
    error,
    totalPlayers,
    playersThisMonth,
    loadingPlayers,
    errorPlayers
  } = useSelector((state) => state.analytics);

  useEffect(() => {
    dispatch(fetchTotalGames());
    dispatch(fetchPlayersData());
  }, [dispatch]);

  return (
    <div className={styles.analyticsContainer}>
      <div className={styles.analyticsDiv}>
        <div className={styles.iconDiv}>
          <FaGamepad className={`${styles.Aicons}`} size={30} />
        </div>
        <p className={styles.analyticsP2}>
          {loading ? "..." : error ? "Err" : totalGames}
        </p>
        <p className={styles.analyticsP}>Total Games</p>
      </div>

      <div className={styles.analyticsDiv2}>
        <div className={styles.iconDiv}>
          <FaUser className={`${styles.Aicons}`} size={25} />
        </div>
        <div className={styles.numberWrapper}>
          <p className={styles.analyticsP2}>
            {loadingPlayers ? "..." : errorPlayers ? "Err" : totalPlayers}
          </p>
          <span className={styles.spanAnalP2}>
            ({loadingPlayers ? "..." : playersThisMonth > 0 ? `+${playersThisMonth}` : playersThisMonth} this month)
          </span>
        </div>
        <p className={styles.analyticsP}>Total Players</p>
      </div>

      <div className={styles.analyticsDiv}>
        <div className={styles.iconDiv}>
          <BsGraphUpArrow className={`${styles.Aicons}`} size={25} />
        </div>
        <p className={styles.analyticsP2}>$45k</p>
        <p className={styles.analyticsP}>Strix Revenue</p>
      </div>
    </div>
  );
}

function Players({ onViewPlayer }) {
  const dispatch = useDispatch();
  const { players, loading, totalPages, currentPage } = useSelector((state) => state.playersList);
  const [playerSearchTerm, setPlayerSearchTerm] = useState("");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      dispatch(fetchPlayersList({ page: currentPage, search: playerSearchTerm }));
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [playerSearchTerm, currentPage, dispatch]);

  const handlePlayerSearchChange = (e) => {
    setPlayerSearchTerm(e.target.value);
    dispatch(setCurrentPage(1));
  };

  const renderPaginationButtons = (currentPage, totalPages, setPage) => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <p
          key={i}
          onClick={() => setPage(i)}
          className={
            currentPage === i
              ? styles.activePaginationPage
              : styles.normalPagination
          }
        >
          {i}
        </p>
      );
    }
    return (
      <>
        <button
          onClick={() => setPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          prev
        </button>
        {pages}
        <button
          onClick={() => setPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          next
        </button>
      </>
    );
  };

  return (
    <div className={styles.playersDiv}>
      <div className={styles.playersNav}>
        <p className={styles.players}>Players</p>
        <input
          type="text"
          placeholder="Search..."
          value={playerSearchTerm}
          onChange={handlePlayerSearchChange}
          className={styles.searchInput}
        />
      </div>
      <div className={styles.playersDetails}>
        {/* Table Headers */}
        <div className={styles.pDetails}>
          <div className={styles.pHeaders}>
            <p>S/N</p>
          </div>
          {loading ? <p className={styles.tableContentNum}>...</p> : players.map((player, index) => (
            <p key={`sn-${player.id}`} className={styles.tableContentNum}>
              {(currentPage - 1) * 3 + index + 1}
            </p>
          ))}
        </div>
        <div className={styles.pDetails}>
          <div className={styles.pHeaders}>
            <p>Profile</p>
          </div>
          {loading ? <p className={styles.tableContent}>...</p> : players.map((player) => (
            <p key={`profile-${player.id}`} className={styles.tableContent}>
              {player.username ? player.username.charAt(0).toUpperCase() : "?"}
            </p>
          ))}
        </div>
        <div className={styles.pDetails}>
          <div className={styles.pHeaders}>
            <p>Name</p>
          </div>
          {loading ? <p className={styles.tableContent}>...</p> : players.map((player) => (
            <p key={`name-${player.id}`} className={styles.tableContent}>
              {player.username}
            </p>
          ))}
        </div>
        <div className={styles.pDetails}>
          <div className={styles.pHeaders}>
            <p>No. Games</p>
          </div>
          {loading ? <p className={styles.tableContentNum}>...</p> : players.map((player) => (
            <p key={`games-${player.id}`} className={styles.tableContentNum}>
              {player.added_games_count}
            </p>
          ))}
        </div>
        <div className={styles.pDetails}>
          <div className={styles.pHeaders}>
            <p>Action</p>
          </div>
          <div className={styles.innerDiv}>
            {loading ? <p className={styles.strixBtn}>...</p> : players.map((player) => (
              <button 
                key={`action-${player.id}`} 
                className={styles.strixBtn}
                onClick={() => onViewPlayer(player.id)}
              >
                View
              </button>
            ))}
          </div>
        </div>
        {players.length === 0 && !loading && (
          <p className={styles.noDataMessage}>No players found.</p>
        )}
      </div>
      <div className={styles.playersPagination}>
        {renderPaginationButtons(
          currentPage,
          totalPages,
          (page) => dispatch(setCurrentPage(page))
        )}
      </div>
    </div>
  );
}

function Genres() {
  const dispatch = useDispatch();
  const { genres, loading, totalPages, currentPage } = useSelector((state) => state.genresList);
  const [genreSearchTerm, setGenreSearchTerm] = useState("");

  const displayGenres = genres.slice(0, 3);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      dispatch(fetchGenresList({ page: currentPage, search: genreSearchTerm }));
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [genreSearchTerm, currentPage, dispatch]);

  const handleGenreSearchChange = (e) => {
    setGenreSearchTerm(e.target.value);
    dispatch(setGenreCurrentPageStore(1));
  };

  const renderPaginationButtons = (currentPage, totalPages, setPage) => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <p
          key={i}
          onClick={() => setPage(i)}
          className={currentPage === i ? styles.activePaginationPage : styles.normalPagination}
        >
          {i}
        </p>
      );
    }
    return (
      <>
        <button
          onClick={() => setPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          prev
        </button>
        {pages}
        <button
          onClick={() => setPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          next
        </button>
      </>
    );
  };

  return (
    <div className={styles.playersDiv}>
      <div className={styles.genresNav}>
        <p className={styles.genres}>Genres</p>
        <input
          type="text"
          placeholder="Search genres..."
          value={genreSearchTerm}
          onChange={handleGenreSearchChange}
          className={styles.searchInput}
        />
      </div>
      <div className={styles.genresDetails}>
        {/* Table Headers */}
        <div className={styles.gDetails}>
          <div className={styles.gHeaders}>
            <p>S/N</p>
          </div>
          {loading ? <p className={styles.tableContentNum}>...</p> : displayGenres.map((genre, index) => (
            <p key={`sn-${genre.id}`} className={styles.tableContentNum}>
              {(currentPage - 1) * 3 + index + 1}
            </p>
          ))}
        </div>
        <div className={styles.gDetails}>
          <div className={styles.gHeaders}>
            <p>Name</p>
          </div>
          {loading ? <p className={styles.tableContent}>...</p> : displayGenres.map((genre) => (
            <p key={`name-${genre.id}`} className={styles.tableContent}>
              {genre.name}
            </p>
          ))}
        </div>
        {displayGenres.length === 0 && !loading && (
          <p className={styles.noDataMessage}>No genres found.</p>
        )}
      </div>
      <div className={styles.genresPagination}>
        {renderPaginationButtons(
          currentPage,
          totalPages,
          (page) => dispatch(setGenreCurrentPageStore(page))
        )}
      </div>
    </div>
  );
}
