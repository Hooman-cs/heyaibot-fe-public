import React, { useState, useEffect, useRef } from 'react';
import styles from './AuthorForm.module.css';
import BasicInfo from '../Steps/BasicInfo';
import KnowledgeBase from '../Steps/KnowledgeBase';
import Prompts from '../Steps/Prompts';
import Actions from '../Steps/Actions';
import PreviewTest from '../Steps/PreviewTest';

const WebsiteConfig = ({
  config,
  setConfig,
  tempSystemPrompt,
  setTempSystemPrompt,
  tempCustomPrompt,
  setTempCustomPrompt,
  tempCategory,
  setTempCategory,
  onSubmit,
  onCancel,
  hasItems,
  websiteId,
  apiKey,
  backendApiKey,
  userData,
  saving
}) => {
  const [activeStep, setActiveStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const sidebarRef = useRef(null);
  const contentRef = useRef(null);

  // Step configuration
  const steps = [
    { id: 1, name: 'Basic Info', icon: '📄' },
    { id: 2, name: 'Knowledge Base', icon: '📚' },
    { id: 3, name: 'Prompts', icon: '💬' },
    { id: 4, name: 'Actions', icon: '⚡' },
    { id: 5, name: 'Preview & Test', icon: '👁️' }
  ];

  // Scroll to top when step changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    setShowPreview(false);
  }, [activeStep]);

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  const renderStepContent = () => {
    const commonProps = {
      config,
      setConfig,
      tempSystemPrompt,
      setTempSystemPrompt,
      tempCustomPrompt,
      setTempCustomPrompt,
      tempCategory,
      setTempCategory,
      websiteId,
      apiKey,
      backendApiKey
    };

    switch(activeStep) {
      case 1: return <BasicInfo {...commonProps} />;
      case 2: return <KnowledgeBase {...commonProps} />;
      case 3: return <Prompts {...commonProps} />;
      case 4: return <Actions {...commonProps} />;
      case 5: return <PreviewTest {...commonProps} />;
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
            onClick={onSubmit}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
        
        <div className={styles.stepsContainer}>
          {steps.map((step) => (
            <div
              key={step.id}
              className={`${styles.stepItem} ${activeStep === step.id ? styles.activeStep : ''}`}
              onClick={() => setActiveStep(step.id)}
            >
              <div className={styles.stepIcon}>{step.icon}</div>
              <div className={styles.stepInfo}>
                <span className={styles.stepName}>{step.name}</span>
              </div>
              {activeStep === step.id && (
                <div className={styles.activeIndicator}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Vertical Divider Line */}
      <div className={styles.verticalDivider}></div>

      {/* Right Content Area */}
      <div className={styles.contentArea}>
        {/* Header with Bottom Line */}
        <div className={styles.contentHeader}>
          <div className={styles.headerLeft}>
            <h2>
              {steps.find(s => s.id === activeStep)?.name}
            </h2>
            <div className={styles.stepIndicator}>
              Step {activeStep} of 5
            </div>
          </div>
          <div className={styles.headerButtons}>
            <button 
              className={`${styles.previewButton} ${showPreview ? styles.activePreview : ''}`}
              onClick={togglePreview}
            >
              <span className={styles.buttonIcon}>👁️</span>
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button 
              className={styles.nextButton}
              onClick={() => setActiveStep(prev => Math.min(5, prev + 1))}
              disabled={activeStep === 5}
            >
              Next
              <span className={styles.buttonIcon}>→</span>
            </button>
          </div>
          {/* Bottom Border Line */}
          <div className={styles.headerBottomLine}></div>
        </div>

        {/* Main Content with Preview */}
        <div className={styles.contentWrapper}>
          <div 
            className={`${styles.contentBody} ${showPreview ? styles.withPreview : ''}`} 
            ref={contentRef}
          >
            {renderStepContent()}
          </div>

          {showPreview && (
            <>
              <div className={styles.contentDivider}></div>
              <div className={styles.previewPanel}>
                <div className={styles.previewPanelHeader}>
                  <h3>Live Preview</h3>
                  <span className={styles.previewStep}>Step {activeStep}</span>
                </div>
                <div className={styles.previewPanelContent}>
                  {activeStep === 1 && (
                    <div className={styles.previewData}>
                      <h4>Basic Information</h4>
                      <div className={styles.previewItem}>
                        <span>Website Name:</span>
                        <strong>{config.websiteName || 'Not set'}</strong>
                      </div>
                      <div className={styles.previewItem}>
                        <span>Website URL:</span>
                        <strong>{config.websiteUrl || 'Not set'}</strong>
                      </div>
                    </div>
                  )}
                  {activeStep === 2 && (
                    <div className={styles.previewData}>
                      <h4>Knowledge Base</h4>
                      <div className={styles.previewSection}>
                        <span>Categories:</span>
                        <div className={styles.previewTags}>
                          {config.category?.map((cat, i) => (
                            <span key={i} className={styles.previewTag}>{cat}</span>
                          ))}
                          {!config.category?.length && <span className={styles.previewEmpty}>None</span>}
                        </div>
                      </div>
                      <div className={styles.previewSection}>
                        <span>Roles:</span>
                        <div className={styles.previewTags}>
                          {config.roles?.map((role, i) => (
                            <span key={i} className={styles.previewTag}>{role}</span>
                          ))}
                          {!config.roles?.length && <span className={styles.previewEmpty}>None</span>}
                        </div>
                      </div>
                    </div>
                  )}
                  {activeStep === 3 && (
                    <div className={styles.previewData}>
                      <h4>System Prompts</h4>
                      <div className={styles.previewList}>
                        {config.systemPrompt?.map((prompt, i) => (
                          <div key={i} className={styles.previewPrompt}>
                            <p>{prompt}</p>
                          </div>
                        ))}
                        {!config.systemPrompt?.length && <span className={styles.previewEmpty}>No prompts added</span>}
                      </div>
                    </div>
                  )}
                  {activeStep === 4 && (
                    <div className={styles.previewData}>
                      <h4>Custom Prompts</h4>
                      <div className={styles.previewList}>
                        {config.customPrompt?.map((prompt, i) => (
                          <div key={i} className={styles.previewPrompt}>
                            <p>{prompt}</p>
                          </div>
                        ))}
                        {!config.customPrompt?.length && <span className={styles.previewEmpty}>No prompts added</span>}
                      </div>
                    </div>
                  )}
                  {activeStep === 5 && (
                    <div className={styles.previewData}>
                      <h4>Final Configuration</h4>
                      <p className={styles.previewNote}>Ready for testing!</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebsiteConfig;