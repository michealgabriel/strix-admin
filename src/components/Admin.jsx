import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout, setPermissions } from "../store/authSlice";
import { secureFetch } from "../utils/api";
import { FaGamepad, FaRegPlayCircle } from "react-icons/fa";
import { AiOutlineGift, AiOutlineUser } from "react-icons/ai";
import { BsFlag, BsWallet2 } from "react-icons/bs";
import { BiGridAlt } from "react-icons/bi";
import { GiLaurelCrown } from "react-icons/gi";
import { FiShoppingBag, FiSettings } from "react-icons/fi";
import { RiCustomerService2Line } from "react-icons/ri";
import {
  MdKeyboardArrowUp,
  MdKeyboardArrowDown,
  MdGroups2,
} from "react-icons/md";

import styles from "./Admin.module.css";
import Dashboard from "./Dashboards/Dashboard";
import Games from "./Gaming/Games/Games";
import DailyRewards from "./Gaming/Daily-Rewards/DailyRewards";
import Missions from "./Gaming/Missions/Missions";
import EpicClips from "./Gaming/Epic-Clips/EpicClips";
import StrixPass from "./Gaming/Strix-Pass/StrixPass";
import Tournaments from "./Gaming/Tournaments/Tournaments";
import Players from "./User/Players/Players";
import Channels from "./User/Channels-Chats/Channels";
import SaleItems from "./Shop&Support/Sale-Items/SaleItems";
import GameTopup from "./Shop&Support/Game-Topup/GameTopup";
import Customer from "./Shop&Support/Customer-Support/Customer";
import Settings from "./Shop&Support/Settings/Settings";

function Admin() {
  const [selectedComponent, setSelectedComponent] = useState("dashboard");
  const dispatch = useDispatch();
  // Grab the exact role ID the backend assigned us (e.g., 1)
  const adminRoleId = useSelector((state) => state.auth.adminData?.roleId);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await secureFetch("/systemroles?page=1&limit=5");
        const data = await response.json();
        
        if (data && data.data) {
          // Precisely find the role that matches your specific ID
          const myRole = data.data.find((r) => r.id === adminRoleId);
          
          if (myRole && myRole.permissions) {
            // Extract just the permission names into a clean array
            const permissionsArray = myRole.permissions.map((p) => p.name);
            dispatch(setPermissions(permissionsArray));
          }
        }
      } catch (error) {
        console.error("Failed to load permissions:", error);
      }
    };
    
    if (adminRoleId) {
      fetchPermissions();
    }
  }, [adminRoleId, dispatch]);

  return (
    <div className={styles.adminPage}>
      <NavBar />
      <div className={styles.sidebarContent}>
        <SideBar
          selectedComponent={selectedComponent}
          setSelectedComponent={setSelectedComponent}
        />
        <div className={styles.adminContent}>
          {selectedComponent === "dashboard" && <Dashboard />}
          {selectedComponent === "games" && <Games />}
          {selectedComponent === "rewards" && <DailyRewards />}
          {selectedComponent === "missions" && <Missions />}
          {selectedComponent === "clips" && <EpicClips />}
          {selectedComponent === "pass" && <StrixPass />}
          {selectedComponent === "tournaments" && <Tournaments />}
          {selectedComponent === "players" && <Players />}
          {selectedComponent === "chats" && <Channels />}
          {selectedComponent === "sale" && <SaleItems />}
          {selectedComponent === "topup" && <GameTopup />}
          {selectedComponent === "support" && <Customer />}
          {selectedComponent === "settings" && <Settings />}
        </div>
      </div>
    </div>
  );
}

function NavBar() {
  const dispatch = useDispatch();
  
  // Grab the logged-in admin's name from Redux (fallback to "A" if missing)
  const adminName = useSelector((state) => state.auth.adminData?.name || "A");
  // Get the first character and ensure it is mathematically small (lowercase) per your instructions
  const firstLetter = adminName.charAt(0);

  return (
    <div className={styles.navDiv}>
      <h1 className={styles.navLogo}>STRIX Admin</h1>
      <div className={styles.navRight}>
        <div className={styles.navUser}>
          <p className={styles.navUserP}>{firstLetter}</p>
        </div>
        <button 
          onClick={() => dispatch(logout())}
          className={styles.logoutBtn}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

function SideBar({ selectedComponent, setSelectedComponent }) {
  const [isGamingOpen, setIsGamingOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);

  // Read our permissions and the god-mode flag directly from Redux!
  const permissions = useSelector((state) => state.auth.permissions) || [];
  const isBase = useSelector((state) => state.auth.adminData?.isBase);
  
  // THE BYPASS: If they are a base admin, they automatically pass every permission check!
  const hasPerm = (permName) => isBase || permissions.includes(permName);

  return (
    <div className={styles.sidebar}>
      <div className={styles.menuItem}>
        <div className={styles.sidebarOpts}>
          <div
            onClick={() => setSelectedComponent("dashboard")}
            className={`${styles.link} ${
              selectedComponent === "dashboard" ? styles.activeLink : ""
            }`}
          >
            <BiGridAlt
              className={`${styles.icons} ${
                selectedComponent === "dashboard" ? styles.activeLink : ""
              }`}
              size={17}
            />
            Dashboard
          </div>
          <div
            className={styles.opts2}
            onClick={() => setIsGamingOpen((prev) => !prev)}
          >
            <span className={styles.spanH}>Gaming</span>
            <span>
              {isGamingOpen ? (
                <MdKeyboardArrowUp className={styles.icons} size={17} />
              ) : (
                <MdKeyboardArrowDown className={styles.icons} size={17} />
              )}
            </span>
          </div>
        </div>
      </div>

      {isGamingOpen && (
        <div className={styles.dropdown}>
          {hasPerm("view_games") && (
            <div
              onClick={() => setSelectedComponent("games")}
              className={`${styles.link} ${
                selectedComponent === "games" ? styles.activeLink : ""
              }`}
            >
              <FaGamepad
                className={`${styles.icons} ${
                  selectedComponent === "games" ? styles.activeLink : ""
                }`}
                size={17}
              />
              Games
            </div>
          )}
          {hasPerm("view_daily_rewards") && (
            <div
              onClick={() => setSelectedComponent("rewards")}
              className={`${styles.link} ${
                selectedComponent === "rewards" ? styles.activeLink : ""
              }`}
            >
              <AiOutlineGift
                className={`${styles.icons} ${
                  selectedComponent === "rewards" ? styles.activeLink : ""
                }`}
                size={17}
              />
              Daily Rewards
            </div>
          )}
          {hasPerm("view_missions") && (
            <div
              onClick={() => setSelectedComponent("missions")}
              className={`${styles.link} ${
                selectedComponent === "missions" ? styles.activeLink : ""
              }`}
            >
              <BsFlag
                className={`${styles.icons} ${
                  selectedComponent === "missions" ? styles.activeLink : ""
                }`}
                size={17}
              />
              Missions
            </div>
          )}
          {hasPerm("view_epic_clips") && (
            <div
              onClick={() => setSelectedComponent("clips")}
              className={`${styles.link} ${
                selectedComponent === "clips" ? styles.activeLink : ""
              }`}
            >
              <FaRegPlayCircle
                className={`${styles.icons} ${
                  selectedComponent === "clips" ? styles.activeLink : ""
                }`}
                size={17}
              />
              Epic Clips
            </div>
          )}
          {hasPerm("view_pass") && (
            <div
              onClick={() => setSelectedComponent("pass")}
              className={`${styles.link} ${
                selectedComponent === "pass" ? styles.activeLink : ""
              }`}
            >
              <BiGridAlt
                className={`${styles.icons} ${
                  selectedComponent === "pass" ? styles.activeLink : ""
                }`}
                size={17}
              />
              Strix Pass
            </div>
          )}
          {hasPerm("view_tournaments") && (
            <div
              onClick={() => setSelectedComponent("tournaments")}
              className={`${styles.link} ${
                selectedComponent === "tournaments" ? styles.activeLink : ""
              }`}
            >
              <GiLaurelCrown
                className={`${styles.icons} ${
                  selectedComponent === "tournaments" ? styles.activeLink : ""
                }`}
                size={17}
              />
              Tournaments
            </div>
          )}
        </div>
      )}

      <div className={styles.menuItem}>
        <div className={styles.sidebarOpts}>
          <div
            className={styles.opts2}
            onClick={() => setIsUserOpen((prev) => !prev)}
          >
            <span className={styles.spanH}>User</span>
            <span>
              {isUserOpen ? (
                <MdKeyboardArrowUp className={styles.icons} size={17} />
              ) : (
                <MdKeyboardArrowDown className={styles.icons} size={17} />
              )}
            </span>
          </div>
        </div>
      </div>

      {isUserOpen && (
        <div className={styles.dropdown}>
          {hasPerm("view_users") && (
            <div
              onClick={() => setSelectedComponent("players")}
              className={`${styles.link} ${
                selectedComponent === "players" ? styles.activeLink : ""
              }`}
            >
              <AiOutlineUser
                className={`${styles.icons} ${
                  selectedComponent === "players" ? styles.activeLink : ""
                }`}
                size={17}
              />
              Players
            </div>
          )}
          {hasPerm("view_channels") && (
            <div
              onClick={() => setSelectedComponent("chats")}
              className={`${styles.link} ${
                selectedComponent === "chats" ? styles.activeLink : ""
              }`}
            >
              <MdGroups2
                className={`${styles.icons} ${
                  selectedComponent === "chats" ? styles.activeLink : ""
                }`}
                size={17}
              />
              Channels/Chats
            </div>
          )}
        </div>
      )}

      <div className={styles.menuItem}>
        <div className={styles.sidebarOpts}>
          <div
            className={styles.opts2}
            onClick={() => setIsShopOpen((prev) => !prev)}
          >
            <span className={styles.spanH}>Shop & Support</span>
            <span>
              {isShopOpen ? (
                <MdKeyboardArrowUp className={styles.icons} size={17} />
              ) : (
                <MdKeyboardArrowDown className={styles.icons} size={17} />
              )}
            </span>
          </div>
        </div>
      </div>

      {isShopOpen && (
        <div className={styles.dropdown}>
          {hasPerm("view_shop_sale_items") && (
            <div
              onClick={() => setSelectedComponent("sale")}
              className={`${styles.link} ${
                selectedComponent === "sale" ? styles.activeLink : ""
              }`}
            >
              <FiShoppingBag
                className={`${styles.icons} ${
                  selectedComponent === "sale" ? styles.activeLink : ""
                }`}
                size={17}
              />
              Sale items
            </div>
          )}
          {hasPerm("view_game_topups") && (
            <div
              onClick={() => setSelectedComponent("topup")}
              className={`${styles.link} ${
                selectedComponent === "topup" ? styles.activeLink : ""
              }`}
            >
              <BsWallet2
                className={`${styles.icons} ${
                  selectedComponent === "topup" ? styles.activeLink : ""
                }`}
                size={17}
              />
              Game Topup
            </div>
          )}
          {hasPerm("manage_customer_supports") && (
            <div
              onClick={() => setSelectedComponent("support")}
              className={`${styles.link} ${
                selectedComponent === "support" ? styles.activeLink : ""
              }`}
            >
              <RiCustomerService2Line
                className={`${styles.icons} ${
                  selectedComponent === "support" ? styles.activeLink : ""
                }`}
                size={17}
              />
              Customer Support
            </div>
          )}
          {(hasPerm("manage_system_countries") || hasPerm("view_system_admins") || hasPerm("view_roles")) && (
            <div
              onClick={() => setSelectedComponent("settings")}
              className={`${styles.link} ${
                selectedComponent === "settings" ? styles.activeLink : ""
              }`}
            >
              <FiSettings
                className={`${styles.icons} ${
                  selectedComponent === "settings" ? styles.activeLink : ""
                }`}
                size={17}
              />
              Settings
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Admin;
