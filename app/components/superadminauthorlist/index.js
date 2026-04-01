// components/superadminauthorlist/index.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from '../AuthorList/AuthorList.module.css';
import { FaTrash, FaEdit, FaGlobe, FaKey, FaCode, FaLock, FaUndoAlt } from 'react-icons/fa';
import { IoMdSwitch } from 'react-icons/io';
import CodePopup from '../Code/CodePopup';

const SuperAdminWebsiteList = ({ websites, onEdit, onDelete, onAddNew, onStatusChange, onRestore }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showCodePopup, setShowCodePopup] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [loadingStatusId, setLoadingStatusId] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
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

  // ── STATUS TOGGLE ──
  const handleStatusToggle = async (website) => {
    const newStatus = website.status === 'active' ? 'inactive' : 'active';
    setLoadingStatusId(website.id);
    await onStatusChange(website.id, newStatus);
    setLoadingStatusId(null);
  };

  // ── RESTORE ──
  const handleRestore = async (id) => {
    setRestoringId(id);
    await onRestore(id);
    setRestoringId(null);
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
            const isLocked        = website.superAdminLocked === true;
            const isInactive      = website.status === 'inactive';
            const isLoading       = loadingStatusId === website.id;
            const isRestoring     = restoringId === website.id;
            const isAdminDeleted  = website.adminDeleted === true;

            return (
              <motion.li
                key={website.id ?? index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`${styles.item} ${isInactive ? styles.inactiveItem : ''}`}
                style={{
                  // Admin-deleted items ko slightly different background
                  background: isAdminDeleted ? '#fffbeb' : undefined,
                  borderLeft: isAdminDeleted ? '3px solid #f59e0b' : undefined,
                  opacity: isAdminDeleted ? 0.85 : 1,
                }}
              >
                <div className={styles.websiteInfo}>
                  {/* Meta row */}
                  <div className={styles.websiteMeta}>
                    <span className={styles.websiteId}>
                      <FaKey className={styles.metaIcon} />
                      API Key: {website.apiKey}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className={styles.websiteStatus} data-status={website.status}>
                        {isInactive ? 'Inactive' : 'Active'}
                      </span>

                      {/* SuperAdmin lock badge */}
                      {isLocked && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                          borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: '600',
                        }}>
                          <FaLock size={9} />
                          Admin Locked
                        </span>
                      )}

                      {/* Admin Deleted badge — SuperAdmin ko dikhta hai */}
                      {isAdminDeleted && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          background: '#fef9c3', color: '#92400e', border: '1px solid #fde68a',
                          borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: '600',
                        }}>
                          🗑️ Admin Deleted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Name + Code */}
                  <div className={styles.websiteHeader}>
                    <h3 className={styles.websiteName}>
                      {website.websiteName}
                      {isAdminDeleted && (
                        <span style={{ fontSize: '12px', color: '#92400e', marginLeft: '8px', fontWeight: '400' }}>
                          (Hidden from Admin)
                        </span>
                      )}
                    </h3>
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

                  {/* Admin deleted info */}
                  {isAdminDeleted && website.adminDeletedAt && (
                    <div style={{
                      marginTop: '6px',
                      padding: '6px 10px',
                      background: '#fef9c3',
                      border: '1px solid #fde68a',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#78350f',
                    }}>
                      🗑️ Deleted by Admin on {new Date(website.adminDeletedAt).toLocaleString()}
                    </div>
                  )}

                  {/* Saved config */}
                  {(website.superAdminUrl || website.superAdminChatUrl || website.code) && (
                    <div className={styles.savedDataPreview}>
                      <span className={styles.previewLabel}>Saved Configuration:</span>
                      {website.superAdminUrl && <span>Admin URL ✓</span>}
                      {website.superAdminChatUrl && <span>Chat URL ✓</span>}
                      {website.code && <span>Code ✓</span>}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className={styles.itemActions}>

                  {/* Restore button — sirf adminDeleted items ke liye */}
                  {isAdminDeleted ? (
                    <motion.button
                      onClick={() => handleRestore(website.id)}
                      disabled={isRestoring}
                      whileHover={!isRestoring ? { scale: 1.05 } : {}}
                      whileTap={!isRestoring ? { scale: 0.95 } : {}}
                      style={{
                        background: isRestoring ? '#d1fae5' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        cursor: isRestoring ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}
                    >
                      {isRestoring ? (
                        <div style={{ width: '14px', height: '14px', border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      ) : (
                        <FaUndoAlt size={12} />
                      )}
                      {isRestoring ? 'Restoring...' : 'Restore'}
                    </motion.button>
                  ) : (
                    /* Normal status toggle — sirf non-deleted websites ke liye */
                    <div className={styles.statusToggle}>
                      {isLoading ? (
                        <div style={{ width: '20px', height: '20px', border: '2px solid #e2e8f0', borderTop: '2px solid #6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
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
                  )}

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
                    title={isAdminDeleted ? 'Permanently delete from database' : 'Permanently delete'}
                  >
                    <FaTrash className={styles.actionIcon} />
                    <span className={styles.buttonText}>
                      {isAdminDeleted ? 'Perm. Delete' : 'Delete'}
                    </span>
                  </motion.button>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}

      {/* Confirm permanent delete */}
      {showConfirm && (
        <motion.div className={styles.confirmOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className={styles.confirmBox} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}>
            <h3>Confirm Permanent Deletion</h3>
            <p>Are you sure you want to <strong>permanently delete</strong> this website?</p>
            <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '4px' }}>
              ⚠️ This will delete the website from database completely. This action cannot be undone.
            </p>
            <div className={styles.confirmButtons}>
              <motion.button
                onClick={handleDelete}
                className={styles.confirmDelete}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Yes, Delete Permanently
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