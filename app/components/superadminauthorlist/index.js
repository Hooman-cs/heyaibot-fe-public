// components/superadminauthorlist/index.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from '../AuthorList/AuthorList.module.css';
import { FaTrash, FaEdit, FaGlobe, FaKey, FaCode, FaLock, FaLockOpen } from 'react-icons/fa';
import { IoMdSwitch } from 'react-icons/io';
import CodePopup from '../Code/CodePopup';

const SuperAdminWebsiteList = ({ websites, onEdit, onDelete, onAddNew, onStatusChange }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showCodePopup, setShowCodePopup] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [loadingStatusId, setLoadingStatusId] = useState(null);
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
      onEdit(selectedWebsite.id, formData); // Assuming you want to save to parent
      handleCloseCodePopup();
    }
  };

  // ── STATUS TOGGLE — SUPERADMIN (always allowed) ──
  const handleStatusToggle = async (website) => {
    const newStatus = website.status === 'active' ? 'inactive' : 'active';
    setLoadingStatusId(website.id);
    await onStatusChange(website.id, newStatus);
    setLoadingStatusId(null);
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
          <p>Add your first website to get started</p>
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
            const isLocked = website.superAdminLocked === true;
            const isInactive = website.status === 'inactive';
            const isLoading = loadingStatusId === website.id;

            return (
              <motion.li
                key={website.id ?? index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`${styles.item} ${isInactive ? styles.inactiveItem : ''}`}
              >
                <div className={styles.websiteInfo}>
                  {/* Meta row */}
                  <div className={styles.websiteMeta}>
                    <span className={styles.websiteId}>
                      <FaKey className={styles.metaIcon} />
                      API Key: {website.apiKey}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={styles.websiteStatus} data-status={website.status}>
                        {isInactive ? 'Inactive' : 'Active'}
                      </span>

                      {/* Lock badge */}
                      {isLocked && (
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
                          Admin Locked
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

                  {/* Lock info — SuperAdmin ko bata do ki admin locked hai */}
                
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
                        {isLocked
                          ? <FaLock size={13} style={{ color: '#dc2626' }} title="Admin locked" />
                          : <IoMdSwitch className={styles.switchIcon} />
                        }
                        <label
                          className={styles.switch}
                          title={`Click to ${website.status === 'active' ? 'deactivate & lock' : 'activate & unlock'}`}
                          style={{ cursor: 'pointer' }}
                        >
                          <input
                            type="checkbox"
                            checked={website.status === 'active'}
                            onChange={() => handleStatusToggle(website)}
                          />
                          <span className={styles.slider} />
                        </label>
                      </>
                    )}
                  </div>

                  <motion.button
                    className={styles.editButton}
                    onClick={() => onEdit(website.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaEdit className={styles.actionIcon} />
                    <span className={styles.buttonText}>Edit</span>
                  </motion.button>

                  <motion.button
                    className={styles.deleteButton}
                    onClick={() => handleConfirm(website.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
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

export default SuperAdminWebsiteList;