import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaCopy, FaCode, FaCheckDouble } from 'react-icons/fa';
import styles from './CodePopup.module.css';
import config from '../utils/config';

const CodePopup = ({ website, onClose }) => {
  const [formData, setFormData] = useState({
    superAdminChatUrl: '',
    integrationCode: ''
  });
  const [copiedField, setCopiedField] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const BASE_URL = config.baseUrl;

  // Initialize form data with template URLs and integration code
  const initializeFormData = () => {
    if (website?.apiKey && !isInitialized) {
      const superAdminChatUrl = `${BASE_URL}/Chatpanel/AdminChatRequests/${website.apiKey}`;
      const integrationCode = `<script
  src="${BASE_URL}/widget.js"
  data-app-id="${website.apiKey}"
  async
  defer
></script>`;
      
      setFormData({
        superAdminChatUrl,
        integrationCode
      });
      setIsInitialized(true);
    }
  };

  // Initialize when popup opens
  useEffect(() => {
    initializeFormData();
  }, [website?.apiKey]);

  const handleCopyToClipboard = (text, fieldName) => {
    if (!text) return;
    
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  if (!website) {
    return null;
  }

  return (
    <motion.div 
      className={styles.codePopupOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className={styles.codePopup}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.codePopupHeader}>
          <h2 className={styles.codePopupTitle}>
            <FaCode className={styles.titleIcon} />
            Integration Details - {website.websiteName}
          </h2>
          <motion.button 
            className={styles.closeButton}
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaTimes />
          </motion.button>
        </div>

        <div className={styles.codePopupContent}>
          <div className={styles.formSection}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                Admin Chat Request URL
                {formData.superAdminChatUrl && (
                  <motion.button
                    type="button"
                    className={`${styles.fieldCopyButton} ${copiedField === 'superAdminChatUrl' ? styles.copied : ''}`}
                    onClick={() => handleCopyToClipboard(formData.superAdminChatUrl, 'superAdminChatUrl')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    {copiedField === 'superAdminChatUrl' ? (
                      <FaCheckDouble className={styles.checkIcon} />
                    ) : (
                      <FaCopy />
                    )}
                  </motion.button>
                )}
              </label>
              <div className={styles.readonlyField}>
                {formData.superAdminChatUrl}
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                Integration Code
                {formData.integrationCode && (
                  <motion.button
                    type="button"
                    className={`${styles.fieldCopyButton} ${copiedField === 'integrationCode' ? styles.copied : ''}`}
                    onClick={() => handleCopyToClipboard(formData.integrationCode, 'integrationCode')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    {copiedField === 'integrationCode' ? (
                      <FaCheckDouble className={styles.checkIcon} />
                    ) : (
                      <FaCopy />
                    )}
                  </motion.button>
                )}
              </label>
              <div className={styles.codeBlock}>
                <pre>{formData.integrationCode}</pre>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CodePopup;