import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from './AuthorList.module.css';
import { FaTrash, FaEdit, FaGlobe, FaKey, FaCode } from 'react-icons/fa';
import { IoMdSwitch } from 'react-icons/io';
import CodePopup from '../Code/CodePopup';
const WebsiteList = ({ websites, onEdit, onDelete, onAddNew, onStatusChange }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
 const [showCodePopup, setShowCodePopup] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [formData, setFormData] = useState({
    superAdminUrl: '',
    superAdminChatUrl: '',
    code: ''
  });
  const handleConfirm = (id) => {
    setDeleteId(id);
    setShowConfirm(true);
  };
const [updatedWebsites, setUpdatedWebsites] = useState(websites);
  const handleDelete = () => {
    if (deleteId !== null) {
      onDelete(deleteId);
      setDeleteId(null);
      setShowConfirm(false);
    }
  };
  const handleCodeButtonClick = (website) => {
    setSelectedWebsite(website);
    // Load existing data if available
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
    setFormData({
      superAdminUrl: '',
      superAdminChatUrl: '',
      code: ''
    });
  };
   const handleFormChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSaveCode = () => {
    if (selectedWebsite) {
      // Update frontend state only
      const updated = updatedWebsites.map(website => 
        website.id === selectedWebsite.id 
          ? { 
              ...website, 
              superAdminUrl: formData.superAdminUrl,
              superAdminChatUrl: formData.superAdminChatUrl,
              code: formData.code
            }
          : website
      );
      setUpdatedWebsites(updated);
    }
  };
  const handleCancelDelete = () => {
    setDeleteId(null);
    setShowConfirm(false);
  };

  const handleStatusToggle = (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    onStatusChange(id, newStatus);
  };

  const activeCount = websites.filter(w => w.status === 'active').length;
  const inactiveCount = websites.filter(w => w.status === 'inactive').length;

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
        <>
          {/* <div className={styles.topBar}>
            <h2 className={styles.listTitle}>Website/App Management</h2>
            <div className={styles.statusSummary}>
              <span className={styles.activeCount}>
                <span className={styles.statusIndicatorActive}></span>
                Active: {activeCount}
              </span>
              <span className={styles.inactiveCount}>
                <span className={styles.statusIndicatorInactive}></span>
                Inactive: {inactiveCount}
              </span>
            </div>
          </div> */}

          <ul className={styles.itemList}>
            {websites.map((website, index) => (
              <motion.li
                key={website.id ?? index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`${styles.item} ${website.status === 'inactive' ? styles.inactiveItem : ''}`}
              >
                <div className={styles.websiteInfo}>
                  <div className={styles.websiteMeta}>
                    <span className={styles.websiteId}>
                      <FaKey className={styles.metaIcon} />
                      API Key: {website.apiKey}
                    </span>
                    <span className={styles.websiteStatus} data-status={website.status}>
                      {website.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                 
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
                   {(website.superAdminUrl || website.superAdminChatUrl || website.code) && (
                    <div className={styles.savedDataPreview}>
                      <span className={styles.previewLabel}>Saved Configuration:</span>
                      {website.superAdminUrl && <span>Admin URL ✓</span>}
                      {website.superAdminChatUrl && <span>Chat URL ✓</span>}
                      {website.code && <span>Code ✓</span>}
                    </div>
                  )}
                </div>

                <div className={styles.itemActions}>
                  {/* Status toggle */}
                  <div className={styles.statusToggle}>
                    <IoMdSwitch className={styles.switchIcon} />
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={website.status === 'active'}
                        onChange={() => handleStatusToggle(website.id, website.status)}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  {/* Edit button */}
                  <motion.button 
                    className={styles.editButton} 
                    onClick={() => onEdit(website.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaEdit className={styles.actionIcon} />
                    <span className={styles.buttonText}>Edit</span>
                  </motion.button>
                  
                  {/* Delete button */}
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
            ))}
          </ul>
        </>
      )}

      {/* Confirm Delete Modal */}
      {showConfirm && (
        <motion.div 
          className={styles.confirmOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className={styles.confirmBox}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
          >
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
    </div>
  );
};

export default WebsiteList;
