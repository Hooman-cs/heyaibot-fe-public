'use client';
import styles from './ChatAvatar.module.css';

const ChatAvatar = ({ isChatOpen, secondaryColor, onClick }) => {
  return (
    <button 
      className={styles.chatWidgetAvatar} 
      onClick={onClick}
      style={{
        display: isChatOpen ? 'none' : 'flex',
        backgroundColor: 'white',
        border: `4px solid ${secondaryColor}`
      }}
      aria-label="Open chat"
    >
      <div className={styles.avatarIcon}>💬</div>
      <div className={styles.pulseEffect} style={{ backgroundColor: secondaryColor }} />
    </button>
  );
};

export default ChatAvatar;