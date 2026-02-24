import React from 'react';
import styles from './Step.module.css';

const PreviewTest = ({ config }) => {
  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewMessage}>
        <div className={styles.previewIcon}>👁️</div>
        <h3>Preview & Test</h3>
        <p>Your configuration will appear here</p>
     
       
      </div>
    </div>
  );
};

export default PreviewTest;