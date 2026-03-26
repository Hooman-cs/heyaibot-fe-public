import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [activeStep, setActiveStep] = useState(1);
  const [basicInfoValid, setBasicInfoValid] = useState(false);
  const [showBasicInfoError, setShowBasicInfoError] = useState(false);
  const sidebarRef = useRef(null);
  const contentRef = useRef(null);
  const basicInfoRef = useRef(null);

  const steps = [
    { id: 1, name: 'Basic Info', icon: '📄' },
    { id: 2, name: 'Knowledge Base', icon: '📚' },
    { id: 3, name: 'Prompts', icon: '💬' },
    { id: 4, name: 'Actions', icon: '⚡' },
    { id: 5, name: 'Preview & Test', icon: '👁️' },
    { id: 6, name: 'Branding', icon: '🎨' }
  ];

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [activeStep]);

  // ✅ Check BasicInfo validity whenever config changes
  useEffect(() => {
    const isValid = BasicInfo.validate(config);
    setBasicInfoValid(isValid);
  }, [config]);

  // ✅ Save button click — validate before saving
  const handleSaveClick = (e) => {
    e.preventDefault();

    if (!basicInfoValid) {
      // Step 1 pe redirect karo
      setActiveStep(1);
      setShowBasicInfoError(true);  // BasicInfo ko errors dikhao

      // Scroll top
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
            showErrors={showBasicInfoError}      // ✅ errors trigger
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
      {/* Left Sidebar */}
      <div className={styles.sidebar} ref={sidebarRef}>
        <div className={styles.sidebarHeader}>
          <div className={styles.backLink} onClick={onCancel}>
            ← Back to List
          </div>
          <button
            className={styles.saveButton}
            onClick={handleSaveClick}   // ✅ validation wala handler
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          {/* ✅ Basic info incomplete warning */}
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
                {/* ✅ Red dot on step 1 if incomplete */}
                {step.id === 1 && !basicInfoValid && (
                  <span className={styles.stepErrorDot}>!</span>
                )}
              </div>
              {activeStep === step.id && <div className={styles.activeIndicator}></div>}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.verticalDivider}></div>

      {/* Right Content Area */}
      <div className={styles.contentArea}>
        <div className={styles.contentHeader}>
          <div className={styles.headerLeft}>
            <h2>{steps.find(s => s.id === activeStep)?.name}</h2>
            <div className={styles.stepIndicator}>
              Step {activeStep} of {steps.length}
            </div>
          </div>
          <div className={styles.headerButtons}>
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