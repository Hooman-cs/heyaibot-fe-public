import React, { useState, useEffect, useRef } from 'react';
import styles from './Step.module.css';
import { 
  FaEdit, FaTrash, FaCheck, FaTimes, FaGlobe, FaLink,
  FaPlus, FaSave, FaUndo, FaCheckCircle, FaExternalLinkAlt, FaFolder
} from 'react-icons/fa';
import { MdWeb, MdHttp } from 'react-icons/md';

const BasicInfo = ({ config, setConfig, onValidationChange }) => {
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({
    websiteName: false,
    websiteUrl: false,
    category: false
  });

  const [tempCategory, setTempCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const categoryInputRef = useRef(null);
  const inputRef = useRef(null);

  // ✅ Validation check — parent ko batao
  useEffect(() => {
    const isValid = 
      config.websiteName?.trim() &&
      config.websiteUrl?.trim() &&
      config.category?.length > 0;

    if (onValidationChange) {
      onValidationChange(!!isValid);
    }
  }, [config.websiteName, config.websiteUrl, config.category, onValidationChange]);

  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingField]);

  useEffect(() => {
    if (showCategoryInput && categoryInputRef.current) {
      categoryInputRef.current.focus();
    }
  }, [showCategoryInput]);

  const validateUrl = (url) => {
    if (!url) return true;
    const pattern = /^(https?:\/\/)?((localhost(:\d+)?)|([\da-z.-]+\.[a-z.]{2,6}))([\/\w .-]*)*\/?$/;
    return pattern.test(url);
  };

  // ✅ Publicly exposed validate method
  const validateAll = () => {
    const errors = {
      websiteName: !config.websiteName?.trim(),
      websiteUrl: !config.websiteUrl?.trim(),
      category: !config.category?.length
    };
    setFieldErrors(errors);
    return !errors.websiteName && !errors.websiteUrl && !errors.category;
  };

  const handleEdit = (field, value) => {
    setEditingField(field);
    setEditValue(value);
    setValidationErrors({});
    setFieldErrors(prev => ({ ...prev, [field]: false }));
  };

  const handleSave = () => {
    if (!editValue.trim()) {
      setValidationErrors({ [editingField]: 'This field cannot be empty' });
      return;
    }
    if (editingField === 'websiteUrl' && !validateUrl(editValue)) {
      setValidationErrors({ websiteUrl: 'Please enter a valid URL' });
      return;
    }
    setConfig({ ...config, [editingField]: editValue.trim() });
    setFieldErrors(prev => ({ ...prev, [editingField]: false }));
    setEditingField(null);
    setEditValue('');
    setValidationErrors({});
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue('');
    setValidationErrors({});
  };

  const handleDelete = (field) => {
    setConfig({ ...config, [field]: '' });
    setFieldErrors(prev => ({ ...prev, [field]: true }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); }
    else if (e.key === 'Escape') handleCancel();
  };

  const addCategory = () => {
    if (tempCategory.trim()) {
      setConfig(prev => ({
        ...prev,
        category: [...(prev.category || []), tempCategory.trim()]
      }));
      setFieldErrors(prev => ({ ...prev, category: false }));
      setTempCategory('');
      setShowCategoryInput(false);
    }
  };

  const updateCategory = (index, newValue) => {
    if (newValue.trim()) {
      const updated = [...config.category];
      updated[index] = newValue.trim();
      setConfig(prev => ({ ...prev, category: updated }));
    }
    setEditingCategory(null);
    setTempCategory('');
  };

  const deleteCategory = (index) => {
    const updated = config.category.filter((_, i) => i !== index);
    setConfig(prev => ({ ...prev, category: updated }));
    if (updated.length === 0) {
      setFieldErrors(prev => ({ ...prev, category: true }));
    }
  };

  const startEditCategory = (index, value) => {
    setEditingCategory({ index, value });
    setTempCategory(value);
  };

  const cancelEditCategory = () => {
    setEditingCategory(null);
    setTempCategory('');
    setShowCategoryInput(false);
  };

  const getFieldIcon = (field) => {
    switch(field) {
      case 'websiteName': return <MdWeb className={styles.fieldIcon} />;
      case 'websiteUrl': return <MdHttp className={styles.fieldIcon} />;
      default: return <FaGlobe className={styles.fieldIcon} />;
    }
  };

  const getFieldPlaceholder = (field) => {
    switch(field) {
      case 'websiteName': return 'e.g., My Awesome Website';
      case 'websiteUrl': return 'https://www.example.com';
      default: return 'Enter value...';
    }
  };

  const formatDisplayValue = (field, value) => {
    if (!value) return null;
    if (field === 'websiteUrl') return value.length > 40 ? value.substring(0, 40) + '...' : value;
    return value;
  };

  return (
    <div className={styles.basicInfoWrapper}>

      {/* ✅ Validation Error Banner */}
      {(fieldErrors.websiteName || fieldErrors.websiteUrl || fieldErrors.category) && (
        <div className={styles.validationBanner}>
          <span className={styles.validationBannerIcon}>⚠️</span>
          <span>Please fill in all required fields before saving:</span>
          <ul className={styles.validationList}>
            {fieldErrors.websiteName && <li>Website Name is required</li>}
            {fieldErrors.websiteUrl && <li>Website URL is required</li>}
            {fieldErrors.category && <li>At least one Category is required</li>}
          </ul>
        </div>
      )}

      {/* Top Row - 2 columns */}
      <div className={styles.topRowGrid}>

        {/* Website Name Card */}
        <div
          className={`${styles.infoCard} ${hoveredCard === 'websiteName' ? styles.hovered : ''} ${fieldErrors.websiteName ? styles.errorCard : ''}`}
          onMouseEnter={() => setHoveredCard('websiteName')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className={styles.cardBackground}>
            <div className={styles.cardPattern}></div>
          </div>

          <div className={styles.cardContent}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.iconWrapper}>{getFieldIcon('websiteName')}</div>
                <div className={styles.titleWrapper}>
                  <h3 className={styles.cardTitle}>
                    Website/App Name
                    <span className={styles.requiredStar}>*</span>
                  </h3>
                  <span className={styles.cardSubtitle}>Identify your platform</span>
                </div>
              </div>
              {config.websiteName ? (
                <div className={styles.statusBadge}>
                  <FaCheckCircle className={styles.statusIcon} />
                  <span>Configured</span>
                </div>
              ) : (
                <div className={styles.requiredBadge}>Required</div>
              )}
            </div>

            <div className={styles.cardBody}>
              {editingField === 'websiteName' ? (
                <div className={styles.editSection}>
                  <div className={styles.inputWrapper}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={getFieldPlaceholder('websiteName')}
                      className={`${styles.editInput} ${validationErrors.websiteName ? styles.error : ''}`}
                    />
                    {validationErrors.websiteName && (
                      <span className={styles.errorMessage}>{validationErrors.websiteName}</span>
                    )}
                  </div>
                  <div className={styles.editActions}>
                    <button onClick={handleSave} className={`${styles.actionBtn} ${styles.saveBtn}`} disabled={!editValue.trim()}>
                      <FaSave className={styles.btnIcon} /><span>Save</span>
                    </button>
                    <button onClick={handleCancel} className={`${styles.actionBtn} ${styles.cancelBtn}`}>
                      <FaUndo className={styles.btnIcon} /><span>Cancel</span>
                    </button>
                  </div>
                  <div className={styles.inputHint}>Press Enter to save · Esc to cancel</div>
                </div>
              ) : (
                <div className={styles.displaySection}>
                  {config.websiteName ? (
                    <div className={styles.valueDisplay}>
                      <span className={styles.displayLabel}>Current Name</span>
                      <div className={styles.valueWrapper}>
                        <span className={styles.displayValue}>
                          {formatDisplayValue('websiteName', config.websiteName)}
                        </span>
                        {hoveredCard === 'websiteName' && (
                          <div className={styles.valueActions}>
                            <button onClick={() => handleEdit('websiteName', config.websiteName)} className={`${styles.iconBtn} ${styles.editBtn}`}>
                              <FaEdit />
                            </button>
                            <button onClick={() => handleDelete('websiteName')} className={`${styles.iconBtn} ${styles.deleteBtn}`}>
                              <FaTrash />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyText}>
                        <h4>No name added yet</h4>
                        <p>Add a name to identify your website</p>
                      </div>
                      <button onClick={() => handleEdit('websiteName', '')} className={`${styles.addButton} ${fieldErrors.websiteName ? styles.addButtonError : ''}`}>
                        <FaPlus className={styles.btnIcon} />
                        <span>Add Name</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ✅ Red bottom line */}
            {fieldErrors.websiteName && <div className={styles.errorBottomLine}></div>}
          </div>
        </div>

        {/* Website URL Card */}
        <div
          className={`${styles.infoCard} ${hoveredCard === 'websiteUrl' ? styles.hovered : ''} ${fieldErrors.websiteUrl ? styles.errorCard : ''}`}
          onMouseEnter={() => setHoveredCard('websiteUrl')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className={styles.cardBackground}>
            <div className={styles.cardPattern}></div>
          </div>

          <div className={styles.cardContent}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.iconWrapper}>{getFieldIcon('websiteUrl')}</div>
                <div className={styles.titleWrapper}>
                  <h3 className={styles.cardTitle}>
                    Website URL
                    <span className={styles.requiredStar}>*</span>
                  </h3>
                  <span className={styles.cardSubtitle}>Your site's web address</span>
                </div>
              </div>
              {config.websiteUrl ? (
                <div className={styles.statusBadge}>
                  <FaCheckCircle className={styles.statusIcon} />
                  <span>Configured</span>
                </div>
              ) : (
                <div className={styles.requiredBadge}>Required</div>
              )}
            </div>

            <div className={styles.cardBody}>
              {editingField === 'websiteUrl' ? (
                <div className={styles.editSection}>
                  <div className={styles.inputWrapper}>
                    <div className={styles.urlInputWrapper}>
                      <span className={styles.urlPrefix}>https://</span>
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="example.com"
                        className={`${styles.editInput} ${styles.urlInput} ${validationErrors.websiteUrl ? styles.error : ''}`}
                      />
                    </div>
                    {validationErrors.websiteUrl && (
                      <span className={styles.errorMessage}>{validationErrors.websiteUrl}</span>
                    )}
                  </div>
                  <div className={styles.editActions}>
                    <button onClick={handleSave} className={`${styles.actionBtn} ${styles.saveBtn}`} disabled={!editValue.trim()}>
                      <FaSave className={styles.btnIcon} /><span>Save</span>
                    </button>
                    <button onClick={handleCancel} className={`${styles.actionBtn} ${styles.cancelBtn}`}>
                      <FaUndo className={styles.btnIcon} /><span>Cancel</span>
                    </button>
                  </div>
                  <div className={styles.inputHint}>Enter a valid URL</div>
                </div>
              ) : (
                <div className={styles.displaySection}>
                  {config.websiteUrl ? (
                    <div className={styles.valueDisplay}>
                      <span className={styles.displayLabel}>Current URL</span>
                      <div className={styles.valueWrapper}>
                        <a
                          href={config.websiteUrl.startsWith('http') ? config.websiteUrl : `https://${config.websiteUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.urlValue}
                        >
                          <span className={styles.displayValue}>
                            {formatDisplayValue('websiteUrl', config.websiteUrl)}
                          </span>
                          <FaExternalLinkAlt className={styles.externalIcon} />
                        </a>
                        {hoveredCard === 'websiteUrl' && (
                          <div className={styles.valueActions}>
                            <button onClick={() => handleEdit('websiteUrl', config.websiteUrl)} className={`${styles.iconBtn} ${styles.editBtn}`}>
                              <FaEdit />
                            </button>
                            <button onClick={() => handleDelete('websiteUrl')} className={`${styles.iconBtn} ${styles.deleteBtn}`}>
                              <FaTrash />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyText}>
                        <h4>No URL added yet</h4>
                        <p>Add your website's address</p>
                      </div>
                      <button onClick={() => handleEdit('websiteUrl', '')} className={`${styles.addButton} ${fieldErrors.websiteUrl ? styles.addButtonError : ''}`}>
                        <FaPlus className={styles.btnIcon} />
                        <span>Add URL</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ✅ Red bottom line */}
            {fieldErrors.websiteUrl && <div className={styles.errorBottomLine}></div>}
          </div>
        </div>
      </div>

      {/* Categories Card */}
      <div className={styles.bottomRowFull}>
        <div
          className={`${styles.infoCard} ${styles.fullWidthCard} ${hoveredCard === 'category' ? styles.hovered : ''} ${fieldErrors.category ? styles.errorCard : ''}`}
          onMouseEnter={() => setHoveredCard('category')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className={styles.cardBackground}>
            <div className={styles.cardPattern}></div>
          </div>

          <div className={styles.cardContent}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.iconWrapper}>
                  <FaFolder className={styles.fieldIcon} />
                </div>
                <div className={styles.titleWrapper}>
                  <h3 className={styles.cardTitle}>
                    Categories
                    <span className={styles.requiredStar}>*</span>
                  </h3>
                  <span className={styles.cardSubtitle}>Organize your content</span>
                </div>
              </div>
              <div className={styles.statusBadge}>
                {config.category?.length > 0 ? (
                  <><FaCheckCircle className={styles.statusIcon} /><span>{config.category.length} items</span></>
                ) : (
                  <span className={styles.requiredBadge}>Required</span>
                )}
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.categoriesList}>
                {config.category && config.category.length > 0 ? (
                  config.category.map((cat, index) => (
                    <div key={index} className={styles.categoryItem}>
                      {editingCategory?.index === index ? (
                        <div className={styles.editCategoryContainer}>
                          <input
                            ref={categoryInputRef}
                            type="text"
                            value={tempCategory}
                            onChange={(e) => setTempCategory(e.target.value)}
                            onBlur={() => updateCategory(index, tempCategory)}
                            onKeyPress={(e) => e.key === 'Enter' && updateCategory(index, tempCategory)}
                            className={styles.editCategoryInput}
                            autoFocus
                          />
                          <div className={styles.categoryEditActions}>
                            <button onClick={() => updateCategory(index, tempCategory)} className={styles.saveCategoryBtn}><FaCheck /></button>
                            <button onClick={cancelEditCategory} className={styles.cancelCategoryBtn}><FaTimes /></button>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.categoryDisplay}>
                          <span className={styles.categoryName}>{cat}</span>
                          <div className={styles.categoryActions}>
                            <button onClick={() => startEditCategory(index, cat)} className={styles.iconBtn} title="Edit category"><FaEdit /></button>
                            <button onClick={() => deleteCategory(index)} className={styles.iconBtn} title="Delete category"><FaTrash /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyCategories}>
                    <p>No categories added yet</p>
                  </div>
                )}
              </div>

              <div className={styles.addCategorySection}>
                {!showCategoryInput ? (
                  <button
                    className={`${styles.addCategoryBtn} ${fieldErrors.category ? styles.addCategoryBtnError : ''}`}
                    onClick={() => setShowCategoryInput(true)}
                  >
                    <FaPlus /> Add Category
                  </button>
                ) : (
                  <div className={styles.addCategoryInput}>
                    <input
                      ref={categoryInputRef}
                      type="text"
                      value={tempCategory}
                      onChange={(e) => setTempCategory(e.target.value)}
                      placeholder="Enter category name"
                      onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                      className={styles.categoryInput}
                      autoFocus
                    />
                    <button onClick={addCategory} className={styles.addBtn} disabled={!tempCategory.trim()}>Add</button>
                    <button onClick={cancelEditCategory} className={styles.cancelBtn}>Cancel</button>
                  </div>
                )}
              </div>
            </div>

            {/* ✅ Red bottom line */}
            {fieldErrors.category && <div className={styles.errorBottomLine}></div>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ Export validate method so parent can call it
BasicInfo.validate = (config) => {
  return !!(
    config.websiteName?.trim() &&
    config.websiteUrl?.trim() &&
    config.category?.length > 0
  );
};

export default BasicInfo;