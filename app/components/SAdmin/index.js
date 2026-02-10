// SAdmin/index.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from './SuperAuthorList.module.css';
import { FaTrash, FaEdit, FaGlobe, FaKey, FaLink, FaComments, FaCode, FaCopy, FaCheck } from 'react-icons/fa';

const WebsiteList = ({ 
  websites, 
  onEdit,  
  isWebsiteActive = true,
  configData = {},
  hasExistingConfig = false,
  websiteStatus = 'active',
  configLoading = false 
}) => {
  const [copiedField, setCopiedField] = useState('');

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(''), 2000);
    });
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
        </motion.div>
      ) : (
        <div className={styles.mainLayout}>
          {/* Top Section - Website List */}
          <div className={styles.websiteListSection}>
            <div className={styles.topBar}>
              <h2 className={styles.listTitle}>Website Management</h2>
              
            </div>

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
                    
                    <h3 className={styles.websiteName}>{website.websiteName}</h3>
                    
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

                    {/* Categories and Prompts Preview */}
                    {(website.category?.length > 0 || website.systemPrompt?.length > 0) && (
                      <div className={styles.websiteDetails}>
                        {website.category?.length > 0 && (
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Categories:</span>
                            <span className={styles.detailValue}>
                              {website.category.join(', ')}
                            </span>
                          </div>
                        )}
                        {website.systemPrompt?.length > 0 && (
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>System Prompts:</span>
                            <span className={styles.detailValue}>
                              {website.systemPrompt.length} configured
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Show message if website is inactive */}
                    {website.status === 'inactive' && (
                      <div className={styles.inactiveMessage}>
                        ⚠️ This website is currently inactive and cannot be edited
                      </div>
                    )}
                  </div>

                  <div className={styles.itemActions}>
                    {/* Edit button - Only show if website is active */}
                    {isWebsiteActive && website.status === 'active' && (
                      <motion.button 
                        className={styles.editButton} 
                        onClick={() => onEdit && onEdit(website.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaEdit className={styles.actionIcon} />
                        <span className={styles.buttonText}>Edit Website</span>
                      </motion.button>
                    )}
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Bottom Section - Configuration */}
          <div className={styles.configSectionWrapper}>
            {configLoading ? (
              <div className={styles.configLoading}>
                <div className={styles.loadingSpinner}></div>
                Loading configuration...
              </div>
            ) : hasExistingConfig ? (
              <motion.div 
                className={styles.configSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className={styles.configHeader}>
                  <h3 className={styles.configTitle}>
                    <FaCode className={styles.configIcon} />
                    Integration Settings
                  </h3>
                  <div className={styles.configBadge}>
                    <div className={styles.statusDot}></div>
                    Active
                  </div>
                </div>
                
                {/* <div className={styles.configContent}>
                  {/* Super Admin URL - Top */}
                  <div className={styles.configItem}>
                    {/* <div className={styles.configItemHeader}>
                      <div className={styles.configItemTitle}>
                        <FaLink className={styles.configItemIcon} />
                        <span>Super Admin URL</span>
                      </div>
                      {configData.superAdminUrl && (
                        <button 
                          className={styles.copyButton}
                          onClick={() => handleCopy(configData.superAdminUrl, 'superAdminUrl')}
                          title="Copy to clipboard"
                        >
                          {copiedField === 'superAdminUrl' ? <FaCheck /> : <FaCopy />}
                        </button>
                      )}
                    </div>
                    <div className={styles.configValue}>
                      {configData.superAdminUrl ? (
                        <a 
                          href={configData.superAdminUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={styles.configLink}
                        >
                          {configData.superAdminUrl}
                        </a>
                      ) : (
                        <span className={styles.configEmpty}>Not configured</span>
                      )}
                    </div> */}
                  {/* </div>  */}

                  {/* Super Admin Chat URL - Middle */}
                  {/* <div className={styles.configItem}>
                    <div className={styles.configItemHeader}>
                      <div className={styles.configItemTitle}>
                        <FaComments className={styles.configItemIcon} />
                        <span>Super Admin Chat URL</span>
                      </div>
                      {configData.superAdminChatUrl && (
                        <button 
                          className={styles.copyButton}
                          onClick={() => handleCopy(configData.superAdminChatUrl, 'superAdminChatUrl')}
                          title="Copy to clipboard"
                        >
                          {copiedField === 'superAdminChatUrl' ? <FaCheck /> : <FaCopy />}
                        </button>
                      )}
                    </div>
                    <div className={styles.configValue}>
                      {configData.superAdminChatUrl ? (
                        <a 
                          href={configData.superAdminChatUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={styles.configLink}
                        >
                          {configData.superAdminChatUrl}
                        </a>
                      ) : (
                        <span className={styles.configEmpty}>Not configured</span>
                      )}
                    </div>
                  </div> */}

                  {/* Integration Code - Bottom (Full Code Always Visible) */}
                  <div className={styles.configItem}>
                    <div className={styles.configItemHeader}>
                      <div className={styles.configItemTitle}>
                        <FaCode className={styles.configItemIcon} />
                        <span>Integration Code</span>
                      </div>
                      {configData.integrationCode && (
                        <button 
                          className={styles.copyButton}
                          onClick={() => handleCopy(configData.integrationCode, 'integrationCode')}
                          title="Copy full code to clipboard"
                        >
                          {copiedField === 'integrationCode' ? <FaCheck /> : <FaCopy />}
                        </button>
                      )}
                    </div>
                    <div className={styles.configValue}>
                      {configData.integrationCode ? (
                        <div className={styles.codeContainer}>
                          <pre className={styles.integrationCode}>
                            {configData.integrationCode}
                          </pre>
                          <div className={styles.codeFooter}>
                            <span className={styles.codeLength}>
                              {configData.integrationCode.length} characters
                            </span>
                            <span className={styles.codeNote}>
                              Full code ready to use
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className={styles.configEmpty}>Not configured</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className={styles.quickActions}>
                  <h4 className={styles.quickActionsTitle}>Quick Actions</h4>
                  <div className={styles.actionButtons}>
                    {configData.superAdminUrl && (
                      <a 
                        href={configData.superAdminUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.actionButton}
                      >
                        <FaLink />
                        Open Admin Panel
                      </a>
                    )}
                    {configData.superAdminChatUrl && (
                      <a 
                        href={configData.superAdminChatUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.actionButton}
                      >
                        <FaComments />
                        View Chat Requests
                      </a>
                    )}
                    {configData.integrationCode && (
                      <button 
                        className={styles.actionButton}
                        onClick={() => handleCopy(configData.integrationCode, 'integrationCode')}
                      >
                        <FaCopy />
                        Copy Integration Code
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                className={styles.noConfigSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className={styles.noConfigContent}>
                  <FaCode className={styles.noConfigIcon} />
                  <h4>No Configuration Found</h4>
                  <p>Integration settings will appear here once they are configured for your website.</p>
                  <div className={styles.setupTips}>
                    <h5>Setup Required:</h5>
                    <ul>
                      <li>Configure integration endpoints</li>
                      <li>Set up admin URLs</li>
                      <li>Generate integration code</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Copy Notification */}
            {copiedField && (
              <motion.div 
                className={styles.copyNotification}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <FaCheck className={styles.copyCheckIcon} />
                Copied to clipboard!
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebsiteList;