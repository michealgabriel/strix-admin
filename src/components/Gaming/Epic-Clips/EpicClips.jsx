import React, { useState, useEffect, useRef } from "react";
import styles from "./EpicClips.module.css";
import { secureFetch } from "../../../utils/api";

const videosPerPage = 10;

const EpicClips = () => {
  const [currentVideos, setCurrentVideos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("name");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const videoRef = useRef(null);
  const playerSectionRef = useRef(null);

  useEffect(() => {
    fetchVideos();
  }, [currentPage]);

  useEffect(() => {
    sortCurrentVideos();
  }, [sortBy]);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const response = await secureFetch(`/epicclips/submissions?page=${currentPage}&limit=${videosPerPage}`);
      const data = await response.json();
      if (data.message === "success") {
        let fetchedData = data.data || [];
        
        // Initial sort based on current sortBy
        fetchedData = sortArray(fetchedData, sortBy);
        
        setCurrentVideos(fetchedData);
        if (data.pagination) {
          setTotalPages(Math.ceil(data.pagination.total / data.pagination.page_limit));
        }
      }
    } catch (error) {
      console.error("Failed to fetch epic clips", error);
    }
    setIsLoading(false);
  };

  const sortArray = (arr, sortType) => {
    const sorted = [...arr];
    sorted.sort((a, b) => {
      switch (sortType) {
        case "name":
          return (a.system_game?.name || "").localeCompare(b.system_game?.name || "");
        case "date":
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case "likes":
          return (b.likes_count || 0) - (a.likes_count || 0);
        case "user":
          return (a.user?.username || "").localeCompare(b.user?.username || "");
        default:
          return 0;
      }
    });
    return sorted;
  };

  const sortCurrentVideos = () => {
    if (currentVideos.length > 0) {
      setCurrentVideos(sortArray(currentVideos, sortBy));
    }
  };

  const changePage = (direction) => {
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openPlayer = (video) => {
    setSelectedVideo(video);
    setIsPlaying(true);
    setTimeout(() => {
      if (playerSectionRef.current) {
        playerSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const playVideo = () => {
    if (selectedVideo) {
      setIsPlaying(true);
      videoRef.current?.play().catch(e => console.error("Play failed:", e));
    }
  };

  const pauseVideo = () => {
    setIsPlaying(false);
    videoRef.current?.pause();
  };

  const restartVideo = () => {
    if (selectedVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      setIsPlaying(true);
      videoRef.current.play().catch(e => console.error("Play failed:", e));
    }
  };

  const crownVideo = async () => {
    if (!selectedVideo) return;
    try {
      const response = await secureFetch(`/admin/epicclips/submissions/${selectedVideo.id}/crown-winner`, {
        method: "POST"
      });
      const data = await response.json();
      if (data.epic_clip_submission) {
        setSelectedVideo(data.epic_clip_submission);
        setCurrentVideos(prev => 
          prev.map(v => ({
            ...v,
            is_winner: v.id === selectedVideo.id ? data.epic_clip_submission.is_winner : false
          }))
        );
      }
    } catch (error) {
      console.error("Failed to crown winner:", error);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.viewText}>View clips submitted by players</div>
        <div className={styles.filterSection}>
          <span className={styles.filterLabel}>Filter:</span>
          <select
            className={styles.filterDropdown}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Sort by Name</option>
            <option value="date">Sort by Date</option>
            <option value="likes">Sort by Likes</option>
            <option value="user">Sort by User</option>
          </select>
        </div>
      </div>

      {/* Video Grid */}
      <div className={styles.videoGrid}>
        {currentVideos.map((video) => (
          <div
            key={video.id}
            className={styles.videoCard}
            onClick={() => openPlayer(video)}
          >
            <div className={styles.videoThumbnail}>
              <video
                src={`${video.clip}#t=0.1`}
                preload="metadata"
                muted
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <div className={styles.playIcon} style={{ zIndex: 2 }}>▶</div>
              {video.is_winner ? (
                <div style={{ position: "absolute", top: "10px", right: "10px", fontSize: "1.5rem", zIndex: 3 }} title="Winner">👑</div>
              ) : null}
            </div>
            <div className={styles.videoInfo}>
              <div className={styles.videoTitle}>{video.system_game?.name || "NULL"}</div>
              <div className={styles.videoMeta}>
                <div className={styles.videoStats}>
                  <span>NULL views</span>
                  <span>{video.likes_count ?? "NULL"} likes</span>
                </div>
                <div className={styles.videoUser}>
                  <div 
                    className={styles.userIcon}
                    style={{
                      backgroundImage: video.user?.profile_image ? `url(${video.user.profile_image})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center"
                    }}
                  >
                    {!video.user?.profile_image && "👤"}
                  </div>
                  <span>{video.user?.username || "NULL"}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <button
          className={styles.paginationBtn}
          onClick={() => changePage(-1)}
          disabled={currentPage === 1 || isLoading}
        >
          ← Previous
        </button>
        <div className={styles.paginationInfo}>
          Page {currentPage} of {totalPages === 0 ? 1 : totalPages}
        </div>
        <button
          className={styles.paginationBtn}
          onClick={() => changePage(1)}
          disabled={currentPage >= totalPages || isLoading}
        >
          Next →
        </button>
      </div>

      {/* Video Player Section */}
      <div className={styles.videoPlayerSection} ref={playerSectionRef}>
        <div className={styles.playerHeader}>
          <div className={styles.playerTitle}>
            {selectedVideo ? (selectedVideo.system_game?.name || "NULL") : "Select a video to play"}
          </div>
        </div>

        <div
          className={styles.videoPlayer}
          style={
            selectedVideo
              ? { background: "#000", padding: 0 }
              : {}
          }
        >
          {selectedVideo ? (
            <video 
              ref={videoRef}
              src={selectedVideo.clip} 
              autoPlay
              style={{ width: "100%", height: "100%", borderRadius: "12px", objectFit: "contain" }}
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
            />
          ) : (
            <span className={styles.emptyState}>
              Click on a video above to start watching
            </span>
          )}
        </div>


        <div className={styles.playerControls}>
          <button
            className={isPlaying ? `${styles.controlBtn} ${styles.secondary}` : styles.controlBtn}
            onClick={isPlaying ? pauseVideo : playVideo}
            disabled={!selectedVideo}
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>
          <button
            className={`${styles.controlBtn} ${styles.secondary}`}
            onClick={restartVideo}
            disabled={!selectedVideo}
          >
            ⏮ Restart
          </button>
          <button
            className={`${styles.controlBtn} ${styles.crown}`}
            onClick={crownVideo}
            disabled={!selectedVideo || selectedVideo.is_winner}
          >
            {selectedVideo?.is_winner ? "👑 Crowned Winner" : "👑 Crown Winner"}
          </button>
        </div>

        <div className={styles.videoDetails}>
          <div className={styles.playerInfo}>
            <div 
              className={styles.playerAvatar}
              style={{
                backgroundImage: selectedVideo?.user?.profile_image ? `url(${selectedVideo.user.profile_image})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            >
              {!selectedVideo?.user?.profile_image && "👤"}
            </div>
            <div className={styles.playerName}>
              {selectedVideo ? (selectedVideo.user?.username || "NULL") : "Select a video"}
            </div>
          </div>
          <div className={styles.videoStatsSection}>
            <div className={styles.statItem}>
              <div className={`${styles.statIcon} ${styles.likes}`}>❤</div>
              <span className={styles.statNumber}>
                {selectedVideo ? (selectedVideo.likes_count ?? "NULL") : 0}
              </span>
            </div>
            <div className={styles.statItem}>
              <div className={`${styles.statIcon} ${styles.comments}`}>💬</div>
              <span className={styles.statNumber}>
                {selectedVideo ? (selectedVideo.comments_count ?? "NULL") : 0}
              </span>
            </div>
            <div className={styles.statItem}>
              <div className={`${styles.statIcon} ${styles.shares}`}>📤</div>
              <span className={styles.statNumber}>
                {selectedVideo ? (selectedVideo.share_count ?? "NULL") : 0}
              </span>
            </div>
            <div className={styles.statItem}>
              <div className={`${styles.statIcon} ${styles.votes}`}>👍</div>
              <span className={styles.statNumber}>
                {selectedVideo ? (selectedVideo.votes_count ?? "NULL") : 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EpicClips;
