'use client';
import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './PlanLimitModal.module.css';

// ─────────────────────────────────────────────────────────────────────────────
// PlanLimitModal
//
// Props:
//   bots     → ALL fetched items (sirf active wale filter karke dikhata hai)
//   maxBot   → plan ki limit
//   onConfirm → (selectedIds: string[]) => void
//               selectedIds = jo bots ACTIVE rahenge
//               baki sab AdminPanel se inactive ho jaenge
//
// NOTE: document.body.overflow AdminPanel handle karta hai
//       Is component mein nahi karna — warna scroll permanently band ho sakta hai
// ─────────────────────────────────────────────────────────────────────────────

const PlanLimitModal = ({ bots, maxBot, onConfirm }) => {

  // Sirf active bots dikhao
  const activeBots = useMemo(
    () => (bots || []).filter(b => b.status === 'active'),
    [bots]
  );

  // Pre-select pehle maxBot active bots
  const [selected, setSelected] = useState(
    () => activeBots.slice(0, maxBot).map(b => b.id)
  );

  const activeCount    = activeBots.length;
  const toDeactivate   = activeCount - selected.length;
  const needToUnselect = Math.max(0, selected.length - maxBot);
  const isValid        = selected.length <= maxBot;

  // Agar limit exceed nahi ho raha — modal dikhane ki zaroorat nahi
  if (activeCount <= maxBot) return null;

  const toggle = (id) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else if (prev.length < maxBot) {
        return [...prev, id];
      }
      return prev; // limit pe hain — aur select nahi
    });
  };

  const handleConfirm = () => {
    if (isValid && needToUnselect === 0) {
      onConfirm(selected);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, scale: 0.93, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 16 }}
          transition={{ duration: 0.22, type: 'spring', stiffness: 320, damping: 26 }}
        >

          {/* HEADER */}
          <div className={styles.header}>
            <div className={styles.iconWrap}>⚠️</div>
            <h3 className={styles.title}>Plan Limit Exceeded</h3>
            <p className={styles.subtitle}>
              Your plan allows <strong>{maxBot}</strong> active bot{maxBot > 1 ? 's' : ''}.
              You currently have <strong>{activeCount}</strong> active.
            </p>
          </div>


          {/* BOTS LIST */}
          <div className={styles.listWrap}>
            {activeBots.map((bot) => {
              const isChecked  = selected.includes(bot.id);
              const isDisabled = !isChecked && selected.length >= maxBot;

              return (
                <motion.div
                  key={bot.id}
                  className={`
                    ${styles.botItem}
                    ${isChecked  ? styles.botSelected   : styles.botUnselected}
                    ${isDisabled ? styles.botDisabled    : ''}
                  `}
                  onClick={() => !isDisabled && toggle(bot.id)}
                  whileHover={!isDisabled ? { x: 3 } : {}}
                  transition={{ duration: 0.12 }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isDisabled}
                    onChange={() => toggle(bot.id)}
                    className={styles.checkbox}
                    onClick={e => e.stopPropagation()}
                  />
                  <div className={styles.botInfo}>
                    <span className={styles.botName}>{bot.websiteName}</span>
                    <span className={styles.botUrl}>
                      {bot.websiteUrl?.replace(/^https?:\/\//, '') || '—'}
                    </span>
                  </div>
                  <span className={`${styles.badge} ${isChecked ? styles.badgeKeep : styles.badgeOff}`}>
                    {isChecked ? 'Keep Active' : 'Deactivate'}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* FOOTER */}
          <div className={styles.footer}>
            <div className={styles.summary}>
              <span className={styles.summaryText}>
                Selected: <strong>{selected.length}</strong> / {maxBot}
              </span>
              {toDeactivate > 0 && (
                <span className={styles.deactivateCount}>
                  {toDeactivate} will be deactivated
                </span>
              )}
            </div>

            <motion.button
              onClick={handleConfirm}
              disabled={!isValid || needToUnselect > 0}
              className={`${styles.confirmBtn} ${(isValid && needToUnselect === 0) ? styles.confirmBtnActive : styles.confirmBtnDisabled}`}
              whileHover={(isValid && needToUnselect === 0) ? { scale: 1.02, y: -1 } : {}}
              whileTap={(isValid && needToUnselect === 0) ? { scale: 0.98 } : {}}
              transition={{ duration: 0.13 }}
            >
              {(isValid && needToUnselect === 0)
                ? `Confirm — Keep ${selected.length}, Deactivate ${toDeactivate}`
                : `Unselect ${needToUnselect} more to continue`
              }
            </motion.button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PlanLimitModal;