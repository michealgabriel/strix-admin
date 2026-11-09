import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPlayerProfile, clearPlayerProfile } from "../../store/playerProfileSlice";
import styles from "./ViewPlayer.module.css";

const PlayerProfile = ({ playerId }) => {
  const dispatch = useDispatch();
  const { playerData: player, loading, error } = useSelector((state) => state.playerProfile);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (playerId) {
      dispatch(fetchPlayerProfile(playerId));
    }
    return () => {
      dispatch(clearPlayerProfile());
    };
  }, [playerId, dispatch]);

  if (loading || !player) {
    return (
      <div className={styles.container}>
        <p style={{ color: "black", textAlign: "center", marginTop: "50px" }}>
          Loading player profile...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p style={{ color: "red", textAlign: "center", marginTop: "50px" }}>
          Error: {error}
        </p>
      </div>
    );
  }

  const games = player.added_games || [];
  const totalGamePages = Math.ceil(games.length / 8) || 1;
  const displayedGames = games.slice((currentPage - 1) * 8, currentPage * 8);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrevNext = (direction) => {
    if (direction === "prev" && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else if (direction === "next" && currentPage < totalGamePages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className={styles.container}>
      {/* Profile Header */}
      <div className={styles.profileHeader}>
        <div className={styles.profileImage} style={{overflow: 'hidden'}}>
          {player.profile_image ? (
            <img 
              src={player.profile_image} 
              alt="profile" 
              style={{width: '100%', height: '100%', objectFit: 'cover'}} 
            />
          ) : (
            player.username ? player.username.substring(0, 2).toUpperCase() : "NA"
          )}
        </div>
        <div className={styles.profileInfo}>
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>Name</div>
            <div className={styles.infoValue}>{player.title || player.username}</div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>Player XP</div>
            <div className={styles.infoValue}>{(player.player_xp || 0).toLocaleString()} XP</div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>No. of Games</div>
            <div className={styles.infoValue}>{player.added_games_count || 0}</div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>Strix Gold</div>
            <div className={styles.infoValue}>{(player.strix_gold || 0).toLocaleString()}</div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>No. of Channels</div>
            <div className={styles.infoValue}>{player.channels_count !== undefined ? player.channels_count : "N/A"}</div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>Strix Pass</div>
            <div className={styles.infoValue}>
              {player.pass_type === "freepass" ? "Free Pass" : player.pass_type || "N/A"}
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>Followers</div>
            <div className={styles.infoValue}>{player.followers_count !== undefined ? player.followers_count : "N/A"}</div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>Following</div>
            <div className={styles.infoValue}>{player.followings_count !== undefined ? player.followings_count : "N/A"}</div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>Post Likes</div>
            <div className={styles.infoValue}>{player.post_likes_count !== undefined ? player.post_likes_count : "N/A"}</div>
          </div>
        </div>
      </div>

      {/* Added Games Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}></span>
          Added Games
        </h2>
        <div className={styles.card}>
          <div className={styles.gamesGrid}>
            {displayedGames.length === 0 && (
              <p style={{color: 'gray', gridColumn: '1 / -1', textAlign: 'center'}}>No games added.</p>
            )}
            {displayedGames.map((game, index) => (
              <div key={index} className={styles.gameItem}>
                <div className={styles.gameIcon} style={{overflow: 'hidden', padding: 0, border: 'none', background: 'transparent'}}>
                  {game.cover_image ? (
                    <img 
                      src={game.cover_image} 
                      alt={game.name} 
                      style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit'}} 
                    />
                  ) : (
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#333', borderRadius: 'inherit', color: 'white'}}>
                      {game.name ? game.name.substring(0, 2).toUpperCase() : "G"}
                    </div>
                  )}
                </div>
                <div className={styles.gameName}>{game.name}</div>
              </div>
            ))}
          </div>
          <div className={styles.pagination}>
            <button onClick={() => handlePrevNext("prev")}>prev</button>
            {[...Array(totalGamePages)].map((_, index) => (
              <button
                key={index + 1}
                className={currentPage === index + 1 ? styles.active : ""}
                onClick={() => handlePageChange(index + 1)}
              >
                {index + 1}
              </button>
            ))}
            <button onClick={() => handlePrevNext("next")}>next</button>
          </div>
        </div>
      </div>

      {/* Obtained Badges Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}></span>
          Obtained Badges
        </h2>
        <div className={styles.card}>
          <div className={styles.badgesContainer} style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
            {player.badges && player.badges.length > 0 ? (
              player.badges.map((badge, idx) => (
                <div key={idx} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px'}}>
                  <div className={styles.badgeItem} style={{overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: badge.image ? 0 : undefined}}>
                    {badge.image ? (
                      <img src={badge.image} alt={badge.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    ) : (
                      <span style={{fontSize: '24px'}}>🏆</span>
                    )}
                  </div>
                  <span style={{fontSize: '0.75rem', fontWeight: 'bold', color: '#555', textAlign: 'center', maxWidth: '80px', wordWrap: 'break-word', lineHeight: '1.2'}}>{badge.name}</span>
                </div>
              ))
            ) : (
              <p style={{color: 'gray'}}>No badges obtained.</p>
            )}
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}></span>
          Posts
        </h2>
        <div className={styles.postsContainer}>
          {/* Video Post */}
          <div className={styles.postCard}>
            <div className={styles.postHeader}>
              <div className={styles.postAvatar}>MG</div>
              <div className={styles.postUserInfo}>
                <div className={styles.postUsername}>MrGamer007</div>
                <div className={styles.postDate}>02/06/2025</div>
              </div>
            </div>
            <div className={styles.postContent}>
              <div className={styles.postMedia}>
                🎮
                <div className={styles.playButton}>▶</div>
              </div>
              <div className={styles.postText}>
                <div className={styles.postTitle}>
                  Overwatch Mobile: Blizzard's Hero Shooter Goes Portable!
                </div>
                <div className={styles.postDescription}>
                  Check out this amazing gameplay footage from the new mobile
                  version...
                </div>
              </div>
            </div>
            <div className={styles.postFooter}>
              <div className={styles.postStat}>👁️ 22.5k</div>
              <div className={styles.postStat}>👍 122</div>
              <div className={styles.postStat}>💬 45</div>
            </div>
          </div>

          {/* Picture Post */}
          <div className={styles.postCard}>
            <div className={styles.postHeader}>
              <div className={styles.postAvatar}>MG</div>
              <div className={styles.postUserInfo}>
                <div className={styles.postUsername}>MrGamer007</div>
                <div className={styles.postDate}>02/06/2025</div>
              </div>
            </div>
            <div className={styles.postContent}>
              <div className={styles.postMedia}>📸</div>
              <div className={styles.postText}>
                <div className={styles.postTitle}>
                  Epic Gaming Setup Complete!
                </div>
                <div className={styles.postDescription}>
                  Finally finished my dream gaming setup. What do you think?
                </div>
              </div>
            </div>
            <div className={styles.postFooter}>
              <div className={styles.postStat}>👁️ 15.2k</div>
              <div className={styles.postStat}>👍 89</div>
              <div className={styles.postStat}>💬 23</div>
            </div>
          </div>

          {/* Single Game Tag Post */}
          <div className={styles.postCard}>
            <div className={styles.postHeader}>
              <div className={styles.postAvatar}>MG</div>
              <div className={styles.postUserInfo}>
                <div className={styles.postUsername}>MrGamer007</div>
                <div className={styles.postDate}>02/06/2025</div>
              </div>
            </div>
            <div className={styles.postContent}>
              <div className={styles.postMedia}>🎯</div>
              <div className={styles.postText}>
                <div className={styles.postTitle}>
                  PUBG: Players Unknown Battleground
                </div>
                <div className={styles.postDescription}>
                  Only played Mlbb for 5 years comparing to others in less
                  experience but what I'm experiencing is so good and amazing, i
                  really like their heroes...
                </div>
              </div>
              <div className={styles.gameTags}>
                <div className={styles.gameTag}>
                  <div className={styles.gameTagIcon}>PU</div>
                  <span>PUBG Mobile</span>
                </div>
              </div>
            </div>
            <div className={styles.postFooter}>
              <div className={styles.postStat}>👁️ 22.5k</div>
              <div className={styles.postStat}>👍 122</div>
              <div className={styles.postStat}>💬 34</div>
            </div>
          </div>

          {/* Multiple Game Tags Post */}
          <div className={styles.postCard}>
            <div className={styles.postHeader}>
              <div className={styles.postAvatar}>MG</div>
              <div className={styles.postUserInfo}>
                <div className={styles.postUsername}>MrGamer007</div>
                <div className={styles.postDate}>02/06/2025</div>
              </div>
            </div>
            <div className={styles.postContent}>
              <div className={styles.postMedia}>🎮</div>
              <div className={styles.postText}>
                <div className={styles.postTitle}>
                  New Arcade Mobile Titles: 2025 summer launch weeks ❤️👑
                </div>
                <div className={styles.postDescription}>
                  Excited for these upcoming mobile games launching this summer!
                </div>
              </div>
              <div className={styles.gameTags}>
                <div className={styles.gameTag}>
                  <div className={styles.gameTagIcon}>SM</div>
                  <span>Super Mario</span>
                </div>
                <div className={styles.gameTag}>
                  <div className={styles.gameTagIcon}>SK</div>
                  <span>Skull Kid</span>
                </div>
                <div className={styles.gameTag}>
                  <div className={styles.gameTagIcon}>MK</div>
                  <span>Mario Kart</span>
                </div>
              </div>
            </div>
            <div className={styles.postFooter}>
              <div className={styles.postStat}>👁️ 22.5k</div>
              <div className={styles.postStat}>👍 122</div>
              <div className={styles.postStat}>💬 67</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;
