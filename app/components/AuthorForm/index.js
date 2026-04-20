import React, { useState, useEffect, useRef } from 'react';
import styles from './AuthorForm.module.css';
import BasicInfo from '../Steps/BasicInfo';
import KnowledgeBase from '../Steps/KnowledgeBase';
import Prompts from '../Steps/Prompts';
import Actions from '../Steps/Actions';
import PreviewTest from '../Steps/PreviewTest';
import Branding from '../Steps/Branding';

const WebsiteConfig = ({
  config,
  setConfig,
  tempSystemPrompt, setTempSystemPrompt,
  tempCustomPrompt, setTempCustomPrompt,
  tempCategory, setTempCategory,
  onSubmit,
  onCancel,
  hasItems,
  websiteId,
  apiKey,
  backendApiKey,
  saving
}) => {
  const [activeStep, setActiveStep]           = useState(1);
  const [basicInfoValid, setBasicInfoValid]   = useState(false);
  const [showBasicInfoError, setShowBasicInfoError] = useState(false);
  const sidebarRef  = useRef(null);
  const contentRef  = useRef(null);
  const basicInfoRef = useRef(null);

  const steps = [
    { id: 1, name: 'Basic Info',     icon: '📄' },
    { id: 2, name: 'Knowledge Base', icon: '📚' },
    { id: 3, name: 'Prompts',        icon: '💬' },
    { id: 4, name: 'Actions',        icon: '⚡' },
    { id: 5, name: 'Preview & Test', icon: '👁️' },
    { id: 6, name: 'Branding',       icon: '🎨' },
  ];

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [activeStep]);

  useEffect(() => {
    const isValid = !!(
      config.websiteName?.trim() &&
      config.websiteUrl?.trim() &&
      config.category?.length > 0
    );
    setBasicInfoValid(isValid);
  }, [config.websiteName, config.websiteUrl, config.category]);

  const handleSaveClick = (e) => {
    e.preventDefault();
    if (!basicInfoValid) {
      setActiveStep(1);
      setShowBasicInfoError(true);
      if (contentRef.current) contentRef.current.scrollTop = 0;
      return;
    }
    setShowBasicInfoError(false);
    onSubmit(e);
  };

  const renderStepContent = () => {
    const commonProps = {
      config, setConfig,
      tempSystemPrompt, setTempSystemPrompt,
      tempCustomPrompt, setTempCustomPrompt,
      tempCategory, setTempCategory,
      websiteId, apiKey, backendApiKey
    };
    switch (activeStep) {
      case 1:
        return (
          <BasicInfo
            {...commonProps}
            ref={basicInfoRef}
            showErrors={showBasicInfoError}
            onValidationChange={setBasicInfoValid}
          />
        );
      case 2: return <KnowledgeBase {...commonProps} />;
      case 3: return <Prompts {...commonProps} />;
      case 4: return <Actions {...commonProps} />;
      case 5: return <PreviewTest config={config} backendApiKey={backendApiKey} />;
      case 6: return <Branding config={config} setConfig={setConfig} backendApiKey={backendApiKey} />;
      default: return null;
    }
  };

  return (
    <div className={styles.configContainer}>

      {/* ── Left Sidebar — Back to List REMOVED ── */}
      <div className={styles.sidebar} ref={sidebarRef}>
        <div className={styles.sidebarHeader}>
          {/* ✅ Sirf warning — back button nahi */}
          {!basicInfoValid && (
            <div className={styles.saveWarning}>
              ⚠️ Fill Basic Info first
            </div>
          )}
        </div>

        <div className={styles.stepsContainer}>
          {steps.map((step) => (
            <div
              key={step.id}
              className={`
                ${styles.stepItem}
                ${activeStep === step.id ? styles.activeStep : ''}
                ${step.id === 1 && !basicInfoValid ? styles.stepError : ''}
              `}
              onClick={() => setActiveStep(step.id)}
            >
              <div className={styles.stepIcon}>{step.icon}</div>
              <div className={styles.stepInfo}>
                <span className={styles.stepName}>{step.name}</span>
                {step.id === 1 && !basicInfoValid && (
                  <span className={styles.stepErrorDot}>!</span>
                )}
              </div>
              {activeStep === step.id && (
                <div className={styles.activeIndicator}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.verticalDivider}></div>

      {/* ── Right Content Area ── */}
      <div className={styles.contentArea}>
        <div className={styles.contentHeader}>
          <div className={styles.headerLeft}>
            <h2>{steps.find(s => s.id === activeStep)?.name}</h2>
            <div className={styles.stepIndicator}>
              Step {activeStep} of {steps.length}
            </div>
          </div>

          {/* ✅ Save + Next — side by side, same style */}
          <div className={styles.headerButtons}>
            <button
              className={styles.saveButton}
              onClick={handleSaveClick}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className={styles.savingSpinner}></span>
                  Saving...
                </>
              ) : (
                <>💾 Save Changes</>
              )}
            </button>

            <button
              className={styles.nextButton}
              onClick={() => setActiveStep(prev => Math.min(steps.length, prev + 1))}
              disabled={activeStep === steps.length}
            >
              Next
              <span className={styles.buttonIcon}>→</span>
            </button>
          </div>

          <div className={styles.headerBottomLine}></div>
        </div>

        <div className={styles.contentWrapper}>
          <div className={styles.contentBody} ref={contentRef}>
            {renderStepContent()}
          </div>
        </div>
      </div>

    </div>
  );
};

export default WebsiteConfig;