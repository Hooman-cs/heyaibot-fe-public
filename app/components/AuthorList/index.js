// components/AuthorList/index.jsx (Admin Panel)
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from './AuthorList.module.css';
import { FaTrash, FaEdit, FaGlobe, FaKey, FaCode, FaLock } from 'react-icons/fa';
import { IoMdSwitch } from 'react-icons/io';
import CodePopup from '../Code/CodePopup';

const AdminWebsiteList = ({ websites, onEdit, onDelete, onAddNew, onStatusChange }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showCodePopup, setShowCodePopup] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [loadingStatusId, setLoadingStatusId] = useState(null);
  const [lockedWarningId, setLockedWarningId] = useState(null);
  const [updatedWebsites, setUpdatedWebsites] = useState(websites);
  const [formData, setFormData] = useState({
    superAdminUrl: '',
    superAdminChatUrl: '',
    code: ''
  });

  // ── DELETE ──
  const handleConfirm = (id) => {
    setDeleteId(id);
    setShowConfirm(true);
  };
  
  const handleCancelDelete = () => {
    setDeleteId(null);
    setShowConfirm(false);
  };
  
  const handleDelete = () => {
    if (deleteId !== null) {
      onDelete(deleteId);
      setDeleteId(null);
      setShowConfirm(false);
    }
  };

  // ── CODE POPUP ──
  const handleCodeButtonClick = (website) => {
    setSelectedWebsite(website);
    const existingData = updatedWebsites.find(w => w.id === website.id);
    setFormData({
      superAdminUrl: existingData?.superAdminUrl || '',
      superAdminChatUrl: existingData?.superAdminChatUrl || '',
      code: existingData?.code || ''
    });
    setShowCodePopup(true);
  };

  const handleCloseCodePopup = () => {
    setShowCodePopup(false);
    setSelectedWebsite(null);
    setFormData({ superAdminUrl: '', superAdminChatUrl: '', code: '' });
  };

  const handleFormChange = (name, value) =>
    setFormData(prev => ({ ...prev, [name]: value }));

  const handleSaveCode = () => {
    if (selectedWebsite) {
      setUpdatedWebsites(prev =>
        prev.map(w => w.id === selectedWebsite.id ? { ...w, ...formData } : w)
      );
      onEdit(selectedWebsite.id, formData);
      handleCloseCodePopup();
    }
  };

  // ── STATUS TOGGLE — ADMIN WITH LOCK CHECK ──
  const handleStatusToggle = async (website) => {
    // Check if SuperAdmin has locked this website
    const isSuperAdminLocked = website.superAdminLocked === true;
    const isInactive = website.status === 'inactive';

    // If SuperAdmin locked it AND it's inactive, Admin cannot activate it
    if (isSuperAdminLocked && isInactive) {
      setLockedWarningId(website.id);
      setTimeout(() => setLockedWarningId(null), 3000);
      return;
    }

    const newStatus = website.status === 'active' ? 'inactive' : 'active';
    setLoadingStatusId(website.id);
    await onStatusChange(website.id, newStatus);
    setLoadingStatusId(null);
  };

  // Function to check if edit/delete buttons should be disabled
  const shouldDisableActions = (website) => {
    // Disable ONLY when SuperAdmin has locked it AND status is inactive
    return website.superAdminLocked === true && website.status === 'inactive';
  };

  return (
    <div className={styles.listView}>
      {websites.length === 0 ? (
        <motion.div
          className={styles.emptyList}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.emptyIllustration}>
            <FaGlobe size={48} className={styles.emptyIcon} />
          </div>
          <h3>No websites found</h3>
          <p>Get started by adding your first website</p>
          <motion.button
            className={styles.addNewButton}
            onClick={onAddNew}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Add New Website
          </motion.button>
        </motion.div>
      ) : (
        <ul className={styles.itemList}>
          {websites.map((website, index) => {
            const isSuperAdminLocked = website.superAdminLocked === true;
            const isInactive = website.status === 'inactive';
            const isLoading = loadingStatusId === website.id;
            const showLockWarn = lockedWarningId === website.id;
            const toggleBlocked = isSuperAdminLocked && isInactive;
            const disableActions = shouldDisableActions(website);

            return (
              <motion.li
                key={website.id ?? index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`${styles.item} ${isInactive ? styles.inactiveItem : ''}`}
              >
                <div className={styles.websiteInfo}>
                  {/* Meta */}
                  <div className={styles.websiteMeta}>
                    <span className={styles.websiteId}>
                      <FaKey className={styles.metaIcon} />
                      API Key: {website.apiKey}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={styles.websiteStatus} data-status={website.status}>
                        {isInactive ? 'Inactive' : 'Active'}
                      </span>

                      {isSuperAdminLocked && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          borderRadius: '12px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          fontWeight: '600',
                        }}>
                          <FaLock size={9} />
                          Locked by SuperAdmin
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Name + Code */}
                  <div className={styles.websiteHeader}>
                    <h3 className={styles.websiteName}>{website.websiteName}</h3>
                    <motion.button
                      className={styles.codeButton}
                      onClick={() => handleCodeButtonClick(website)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={disableActions}
                      style={{ opacity: disableActions ? 0.5 : 1, cursor: disableActions ? 'not-allowed' : 'pointer' }}
                    >
                      <FaCode className={styles.codeIcon} />
                      <span>Code</span>
                    </motion.button>
                  </div>

                  {/* URL */}
                  <div className={styles.websiteUrl}>
                    <FaGlobe className={styles.urlIcon} />
                    <a
                      href={website.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.urlLink}
                    >
                      {website.websiteUrl.replace(/^https?:\/\//, '')}
                    </a>
                  </div>

                  {/* Saved config */}
                  {(website.superAdminUrl || website.superAdminChatUrl || website.code) && (
                    <div className={styles.savedDataPreview}>
                      <span className={styles.previewLabel}>Saved Configuration:</span>
                      {website.superAdminUrl && <span>Admin URL ✓</span>}
                      {website.superAdminChatUrl && <span>Chat URL ✓</span>}
                      {website.code && <span>Code ✓</span>}
                    </div>
                  )}

                  {/* Lock warning flash */}
                  {showLockWarn && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        marginTop: '8px',
                        padding: '7px 12px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#dc2626',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <FaLock size={11} />
                      This website is locked by SuperAdmin. Only SuperAdmin can reactivate it.
                    </motion.div>
                  )}
                </div>

                {/* Actions */}
                <div className={styles.itemActions}>
                  <div className={styles.statusToggle}>
                    {isLoading ? (
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid #e2e8f0',
                        borderTop: '2px solid #6366f1',
                        borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite',
                      }} />
                    ) : (
                      <>
                        {toggleBlocked
                          ? <FaLock size={13} style={{ color: '#dc2626' }} />
                          : <IoMdSwitch className={styles.switchIcon} />
                        }
                        <label
                          className={styles.switch}
                          title={
                            toggleBlocked
                              ? '🔒 Locked by SuperAdmin'
                              : `Click to ${website.status === 'active' ? 'deactivate' : 'activate'}`
                          }
                          style={{ cursor: toggleBlocked ? 'not-allowed' : 'pointer', position: 'relative' }}
                        >
                          <input
                            type="checkbox"
                            checked={website.status === 'active'}
                            onChange={() => handleStatusToggle(website)}
                            disabled={toggleBlocked}
                          />
                          <span
                            className={styles.slider}
                            style={{
                              opacity: toggleBlocked ? 0.45 : 1,
                              filter: toggleBlocked ? 'grayscale(60%)' : 'none',
                            }}
                          />
                        </label>
                      </>
                    )}
                  </div>

                  <motion.button
                    className={styles.editButton}
                    onClick={() => onEdit(website.id)}
                    whileHover={!disableActions ? { scale: 1.1 } : {}}
                    whileTap={!disableActions ? { scale: 0.95 } : {}}
                    disabled={disableActions}
                    style={{ 
                      opacity: disableActions ? 0.5 : 1, 
                      cursor: disableActions ? 'not-allowed' : 'pointer' 
                    }}
                  >
                    <FaEdit className={styles.actionIcon} />
                    <span className={styles.buttonText}>Edit</span>
                  </motion.button>

                  <motion.button
                    className={styles.deleteButton}
                    onClick={() => handleConfirm(website.id)}
                    whileHover={!disableActions ? { scale: 1.1 } : {}}
                    whileTap={!disableActions ? { scale: 0.95 } : {}}
                    disabled={disableActions}
                    style={{ 
                      opacity: disableActions ? 0.5 : 1, 
                      cursor: disableActions ? 'not-allowed' : 'pointer' 
                    }}
                  >
                    <FaTrash className={styles.actionIcon} />
                    <span className={styles.buttonText}>Delete</span>
                  </motion.button>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}

      {showConfirm && (
        <motion.div className={styles.confirmOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className={styles.confirmBox} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}>
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this website? This action cannot be undone.</p>
            <div className={styles.confirmButtons}>
              <motion.button 
                onClick={handleDelete} 
                className={styles.confirmDelete} 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                Delete
              </motion.button>
              <motion.button 
                onClick={handleCancelDelete} 
                className={styles.confirmCancel} 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showCodePopup && selectedWebsite && (
        <CodePopup
          website={selectedWebsite}
          onClose={handleCloseCodePopup}
          onSave={handleSaveCode}
          formData={formData}
          onFormChange={handleFormChange}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminWebsiteList;