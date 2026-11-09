import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { changeRole } from "../../../store/settingsSlice";
import { secureFetch } from "../../../utils/api";
import styles from "./Settings.module.css";
import { FaPlus, FaCloudUploadAlt, FaTrashAlt, FaEdit } from "react-icons/fa";

function Settings() {
  const currentUserRole = useSelector((state) => state.settings.currentUserRole);
  const dispatch = useDispatch();

  const [countries, setCountries] = useState([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);

  const [admins, setAdmins] = useState([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);

  // Grab the explicit role info from our secure Redux store
  const currentUserIsBase = useSelector((state) => state.auth.adminData?.isBase);
  const currentUserPermissions = useSelector((state) => state.auth.permissions) || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCountry, setEditingCountry] = useState({
    id: null,
    name: "",
    currency: "",
    symbol: "",
    rate_per_base: 1,
    status: "active"
  });

  // Admin Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [systemRoles, setSystemRoles] = useState([]);
  const [editingAdmin, setEditingAdmin] = useState({
    id: null,
    name: "",
    email: "",
    role_id: 1,
    status: "active"
  });

  // Delete Admin State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [isDeletingAdmin, setIsDeletingAdmin] = useState(false);  const fetchCountries = async () => {
    try {
      setIsLoadingCountries(true);
      const response = await secureFetch("/systemcountries");
      const data = await response.json();
      
      if (data.message === "success") {
        setCountries(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch system countries:", error);
    } finally {
      setIsLoadingCountries(false);
    }
  };

  // Fetch Admins Action
  const fetchAdmins = async () => {
    try {
      setIsLoadingAdmins(true);
      const response = await secureFetch("/systemadmins?page=1&limit=5");
      const data = await response.json();
      
      if (data.message === "success") {
        setAdmins(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch system admins:", error);
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  useEffect(() => {
    fetchCountries();
    fetchAdmins();

    // Silently fetch roles so we can populate the dropdown for Adding Admins beautifully
    const fetchRoles = async () => {
      try {
        const response = await secureFetch("/systemroles?page=1&limit=50");
        const data = await response.json();
        if (data.message === "success") {
          setSystemRoles(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch system roles:", error);
      }
    };
    fetchRoles();
  }, []);

  const handleAddAdminClick = () => {
    // Reset to blank slate template
    setEditingAdmin({
      id: null,
      name: "",
      email: "",
      role_id: systemRoles.length > 0 ? systemRoles[0].id : 1,
      status: "active"
    });
    setIsAdminModalOpen(true);
  };

  const handleAdminInputChange = (e) => {
    const { name, value } = e.target;
    setEditingAdmin(prev => ({ ...prev, [name]: value }));
  };

  const handleAdminUpdateSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingAdmin(true);

    const isEditing = editingAdmin.id !== null;
    const url = isEditing 
        ? `/systemadmins/${editingAdmin.id}` 
        : `/systemadmins`;

    try {
      // Setup payload differently since we don't pass email on update!
      const payloadBody = {
        name: editingAdmin.name,
        role_id: parseInt(editingAdmin.role_id, 10), // Cast to int
        status: editingAdmin.status
      };

      if (!isEditing) {
        payloadBody.email = editingAdmin.email; // Only needed when Adding NEW Admin
      }

      const response = await secureFetch(url, {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(payloadBody)
      });
      const data = await response.json();
      if (data.message === "success") {
        setIsAdminModalOpen(false);
        fetchAdmins(); // Auto refresh UI
      } else {
        alert(data.message || "Failed to save admin.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving admin.");
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleAddCountry = () => {
        setEditingCountry({
      id: null,
      name: "",
      currency: "",
      symbol: "",
      rate_per_base: 1,
      status: "active"
    });
    setIsModalOpen(true);
  };

  const handleUpdateLocale = (countryObj) => {
    setEditingCountry({ ...countryObj });
    setIsModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
        const isEditing = editingCountry.id !== null;
    const url = isEditing 
        ? `/systemcountries/${editingCountry.id}/update` 
        : `/systemcountries`;

    try {
      const response = await secureFetch(url, {
        method: "POST",
        body: JSON.stringify({
          name: editingCountry.name,
          currency: editingCountry.currency,
          symbol: editingCountry.symbol,
          rate_per_base: editingCountry.rate_per_base,
          status: editingCountry.status
        })
      });
      const data = await response.json();
      if (data.message === "success") {
        setIsModalOpen(false);
        fetchCountries();       } else {
        alert(data.message || "Failed to update.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving country.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingCountry(prev => ({ ...prev, [name]: value }));
  };

  

  
  const handleRemoveAdminClick = (adminObj) => {
    setAdminToDelete(adminObj);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAdmin = async () => {
    if (!adminToDelete) return;
    setIsDeletingAdmin(true);
    try {
      const response = await secureFetch(`/systemadmins/${adminToDelete.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.message === "success") {
        setIsDeleteModalOpen(false);
        setAdminToDelete(null);
        fetchAdmins(); // Refresh table entirely automatically
      } else {
        alert(data.message || "Failed to delete admin.");
      }
    } catch (err) {
      console.error(err);
      alert("Error securely deleting admin.");
    } finally {
      setIsDeletingAdmin(false);
    }
  };

  const handleEditRoleClick = (adminObj) => {
    // Pre-fill all fields beautifully!
    setEditingAdmin({
      id: adminObj.id,
      name: adminObj.name,
      email: adminObj.email || "", 
      role_id: adminObj.role_id || (systemRoles.length > 0 ? systemRoles[0].id : 1),
      status: adminObj.status || "active"
    });
    setIsAdminModalOpen(true);
  };

  const canManage = (adminToManage) => {
    // Base admins can manage anyone except themselves or other base admins
    if (currentUserIsBase) {
      return !adminToManage.is_base;
    }
    
    // Normal admins can manage only if they explicitly have the right permission
    if (currentUserPermissions.includes("edit_system_admins")) {
      return !adminToManage.is_base; // They can NEVER manage a base admin
    }

    return false;
  };

  return (
    <div className={styles.container}>
      {/* System Countries Section */}
      <section>
        <div className={styles.sectionHeader}>
          <h2 className={styles.title}>SYSTEM COUNTRIES</h2>
          <button className={styles.addBtn} onClick={handleAddCountry}>
            <FaPlus size={12} /> Add Country
          </button>
        </div>
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th>S/N</th>
                <th>Name</th>
                <th>Currency</th>
                <th>Symbol</th>
                <th>Rate</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingCountries ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                    Loading system countries...
                  </td>
                </tr>
              ) : countries.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                    No countries configured yet.
                  </td>
                </tr>
              ) : (
                countries.map((c, index) => (
                  <tr key={c.id} className={styles.tableRow}>
                    <td className={styles.sn}>{index + 1}</td>
                    <td>{c.name}</td>
                    <td>{c.currency}</td>
                    <td className={styles.currencySymbol}>{c.symbol}</td>
                    <td style={{ fontWeight: c.is_base ? "bold" : "normal" }}>
                      {c.is_base ? "Base" : c.rate_per_base}
                    </td>
                    <td>
                      <button 
                        className={styles.updateBtn}
                        onClick={() => handleUpdateLocale(c)}
                      >
                        <FaCloudUploadAlt style={{ marginRight: "4px" }} /> UPDATE
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Admins Section */}
      <section>
        <div className={styles.sectionHeader}>
          <h2 className={styles.title}>ADMINS</h2>
          <button className={styles.addBtn} onClick={handleAddAdminClick}>
            <FaPlus size={12} /> Add New Admin
          </button>
        </div>
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th>S/N</th>
                <th>Name</th>
                <th>Role Title</th>
                <th style={{ textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingAdmins ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                    Loading system admins...
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                    No admins found.
                  </td>
                </tr>
              ) : (
                admins.map((admin, index) => (
                  <tr key={admin.id} className={styles.tableRow}>
                    <td className={styles.sn}>{index + 1}</td>
                    <td style={{ fontWeight: 500 }}>{admin.name}</td>
                    <td>
                      <span className={styles.roleBadge}>
                        {admin.role?.name || "Unknown"} {admin.is_base ? "(Base)" : ""}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {canManage(admin) ? (
                        <div className={styles.actionContainer} style={{ justifyContent: "center" }}>
                          <button 
                            className={styles.removeBtn}
                            onClick={() => handleRemoveAdminClick(admin)}
                          >
                            <FaTrashAlt style={{ marginRight: "4px" }} /> Remove
                          </button>
                          <button 
                            className={styles.editBtn}
                            onClick={() => handleEditRoleClick(admin)}
                          >
                            <FaEdit style={{ marginRight: "4px" }} /> Edit
                          </button>
                        </div>
                      ) : (
                        <span className={styles.disabledAction}>No Access</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Update/Add Country Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              {editingCountry.id ? "Update System Country" : "Add System Country"}
            </div>
            <form onSubmit={handleUpdateSubmit}>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={editingCountry.name} 
                  onChange={handleInputChange}
                  className={styles.input} 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Currency Code</label>
                <input 
                  type="text" 
                  name="currency"
                  value={editingCountry.currency} 
                  onChange={handleInputChange}
                  className={styles.input} 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Symbol</label>
                <input 
                  type="text" 
                  name="symbol"
                  value={editingCountry.symbol} 
                  onChange={handleInputChange}
                  className={styles.input} 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Rate Per Base</label>
                <input 
                  type="number" 
                  step="0.0001"
                  name="rate_per_base"
                  value={editingCountry.rate_per_base} 
                  onChange={handleInputChange}
                  className={styles.input} 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Status</label>
                <select 
                  name="status"
                  value={editingCountry.status} 
                  onChange={handleInputChange}
                  className={styles.input}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className={styles.cancelBtn}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Admin Modal */}
      {isAdminModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              {editingAdmin.id ? "Update Admin" : "Add New Admin"}
            </div>
            <form onSubmit={handleAdminUpdateSubmit}>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={editingAdmin.name} 
                  onChange={handleAdminInputChange}
                  className={styles.input} 
                  required 
                />
              </div>
              {!editingAdmin.id && (
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    value={editingAdmin.email} 
                    onChange={handleAdminInputChange}
                    className={styles.input} 
                    required 
                  />
                </div>
              )}
              <div className={styles.formGroup}>
                <label>Role</label>
                <select 
                  name="role_id"
                  value={editingAdmin.role_id} 
                  onChange={handleAdminInputChange}
                  className={styles.input}
                  required
                >
                  {systemRoles.length === 0 && <option value="">Loading roles...</option>}
                  {systemRoles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Status</label>
                <select 
                  name="status"
                  value={editingAdmin.status} 
                  onChange={handleAdminInputChange}
                  className={styles.input}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={() => setIsAdminModalOpen(false)} 
                  className={styles.cancelBtn}
                  disabled={isSubmittingAdmin}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={isSubmittingAdmin}>
                  {isSubmittingAdmin ? "Saving..." : "Save Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Admin Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ textAlign: "center", padding: "30px 24px" }}>
            <FaTrashAlt size={40} color="#ef4444" style={{ marginBottom: "16px" }} />
            <h3 style={{ fontSize: "18px", color: "#1e293b", marginBottom: "8px" }}>Remove Admin Access?</h3>
            <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "24px" }}>
              Are you sure you want to permanently remove <strong>{adminToDelete?.name}</strong>?
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className={styles.cancelBtn}
                disabled={isDeletingAdmin}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteAdmin} 
                style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                disabled={isDeletingAdmin}
              >
                {isDeletingAdmin ? "Deleting..." : "Yes, Delete Admin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
