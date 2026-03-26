import React, { useState, useEffect } from "react";
import styles from "./Branding.module.css";
import Chatwidget from "./chatwidget";
import config from "../utils/config";

const API_URL = config.apiBaseUrl;

const Branding = ({ config: widgetConfig, setConfig, backendApiKey }) => {
  const [headerColor, setHeaderColor] = useState(
    widgetConfig?.headerColor || "#ff6347"
  );
  const [poweredByText, setPoweredByText] = useState("JDPC Global");
  const [poweredByUrl, setPoweredByUrl] = useState("https://jdpcglobal.com");
  const [showWidget, setShowWidget] = useState(true);
  const [previewKey, setPreviewKey] = useState(Date.now());
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ text: "", type: "" });

  const handleColorChange = (e) => {
    setHeaderColor(e.target.value);
  };

  const handleRefreshPreview = async () => {
    await loadBrandingData();
    setPreviewKey(Date.now());
    setShowWidget(true);
  };

  const handleSaveColor = async () => {
    if (!backendApiKey) {
      setSaveMessage({ text: "❌ No API key found", type: "error" });
      setTimeout(() => setSaveMessage({ text: "", type: "" }), 3000);
      return;
    }

    setIsSaving(true);
    setSaveMessage({ text: "", type: "" });

    try {
      const response = await fetch(`${API_URL}/api/branding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: backendApiKey,
          headerColor: headerColor,
          poweredByText: poweredByText,
          poweredByUrl: poweredByUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSaveMessage({
          text: "✅ Branding saved successfully!",
          type: "success",
        });
        if (setConfig) {
          setConfig((prev) => ({
            ...prev,
            headerColor: headerColor,
            poweredByText: poweredByText,
            poweredByUrl: poweredByUrl,
          }));
        }
      } else {
        setSaveMessage({
          text: `❌ Error: ${data.message || "Failed to save"}`,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Save error:", error);
      setSaveMessage({
        text: "❌ Network error. Please try again.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage({ text: "", type: "" }), 3000);
    }
  };

  const loadBrandingData = async () => {
    if (!backendApiKey) return;
    try {
      const response = await fetch(`${API_URL}/api/branding/${backendApiKey}`);
      const data = await response.json();

      if (data.success && data.data) {
        setHeaderColor(data.data.headerColor);
        if (data.data.poweredByText) setPoweredByText(data.data.poweredByText);
        if (data.data.poweredByUrl) setPoweredByUrl(data.data.poweredByUrl);
        if (setConfig) {
          setConfig((prev) => ({
            ...prev,
            headerColor: data.data.headerColor,
            poweredByText: data.data.poweredByText || "JDPC Global",
            poweredByUrl: data.data.poweredByUrl || "https://jdpcglobal.com",
          }));
        }
      } else {
        const defaultColor = widgetConfig?.headerColor || "#ff6347";
        setHeaderColor(defaultColor);
      }
    } catch (error) {
      console.error("Error loading branding data:", error);
      setHeaderColor(widgetConfig?.headerColor || "#ff6347");
    }
  };

  useEffect(() => {
    loadBrandingData();
  }, [backendApiKey]);

  const defaultConfig = {
    primaryColor: "#4a6baf",
    secondaryColor: "#ff6347",
    widgetPosition: { right: "0px", bottom: "0px" },
    chatWindowSize: { width: "340px", height: "470px" },
    websiteName: "Support12",
    apiBaseUrl: API_URL,
  };

  const mergedConfig = {
    ...defaultConfig,
    ...widgetConfig,
    headerColor: headerColor,
    poweredByText: poweredByText,
    poweredByUrl: poweredByUrl,
    widgetPosition: {
      ...defaultConfig.widgetPosition,
      ...(widgetConfig?.widgetPosition || {}),
    },
    chatWindowSize: {
      ...defaultConfig.chatWindowSize,
      ...(widgetConfig?.chatWindowSize || {}),
    },
  };

  return (
    <div className={styles.brandingContainer}>
      <div className={styles.settingsColumn}>
        <div className={styles.settingsHeader}>
          <h3>Branding Settings</h3>
          <p>Customize how your chat widget looks</p>
        </div>

        <div className={styles.settingsForm}>
          <div className={styles.formGroup}>
            <label>
              <span className={styles.labelIcon}>🎨</span>
              Header Background Color
            </label>
            <div className={styles.colorInputGroup}>
              <input
                type="color"
                value={headerColor}
                onChange={handleColorChange}
              />
              <input
                type="text"
                value={headerColor}
                onChange={handleColorChange}
                className={styles.colorTextInput}
                placeholder="#ff6347"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>
              <span className={styles.labelIcon}>✏️</span>
              Powered By Text
            </label>
            <input
              type="text"
              value={poweredByText}
              onChange={(e) => setPoweredByText(e.target.value)}
              className={styles.textInput}
              placeholder="JDPC Global"
              maxLength={50}
            />
           
          </div>

          <div className={styles.formGroup}>
            <label>
              <span className={styles.labelIcon}>🔗</span>
              Powered By Link URL
            </label>
            <input
              type="url"
              value={poweredByUrl}
              onChange={(e) => setPoweredByUrl(e.target.value)}
              className={styles.textInput}
              placeholder="https://jdpcglobal.com"
            />
           
          </div>

          <div className={styles.formGroup}>
            <label>
              <span className={styles.labelIcon}>👁️</span>
              Preview
            </label>
            <div className={styles.poweredByPreview}>
              <span>Powered by </span>
              <a
                href={poweredByUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: headerColor, fontWeight: 600 }}
              >
                {poweredByText}
              </a>
            </div>
          </div>

          <button
            className={styles.saveColorButton}
            onClick={handleSaveColor}
            disabled={isSaving}
          >
            {isSaving ? "⏳ Saving..." : "💾 Save Branding"}
          </button>

          {saveMessage.text && (
            <div
              className={`${styles.saveMessage} ${styles[saveMessage.type]}`}
            >
              {saveMessage.text}
            </div>
          )}
        </div>
      </div>

      <div className={styles.previewColumn}>
        <div className={styles.previewHeader}>
          <h3>Widget Preview</h3>
          <div className={styles.previewActions}>
            <button
              className={styles.refreshButton}
              onClick={handleRefreshPreview}
              title="Refresh Preview"
            >
              🔄
            </button>
          </div>
        </div>

        <div className={styles.previewContent}>
          <div className={styles.previewBackground}>
            {showWidget && (
              <Chatwidget
                key={previewKey}
                primaryColor={mergedConfig.primaryColor}
                secondaryColor={mergedConfig.secondaryColor}
                widgetPosition={mergedConfig.widgetPosition}
                chatWindowSize={mergedConfig.chatWindowSize}
                backendApiKey={backendApiKey}
                apiBaseUrl={mergedConfig.apiBaseUrl}
                headerColor={headerColor}
                poweredByText={poweredByText}
                poweredByUrl={poweredByUrl}
                websiteName={mergedConfig.websiteName}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Branding;