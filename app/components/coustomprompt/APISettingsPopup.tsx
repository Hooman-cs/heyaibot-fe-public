"use client"

import React, { useState, useEffect } from "react"
import styles from "./APISettingsPopup.module.css"
import config from '../utils/config';
import { 
  X, 
  Link, 
  Key, 
  FileText, 
  Trash2, 
  Check, 
  AlertCircle,
  Eye,
  EyeOff,
  Cog,
  Lock,
  Tag,
  Loader2,
  Edit,
  Save
} from "lucide-react"

type PromptParameter = {
  id: string
  key: string
}

type APIPrompt = {
  id: string
  text: string
  parameter?: PromptParameter
  type?: 'root' | 'child'
  level?: number
  parentText?: string
  isEditing?: boolean
  tempKey?: string
}

type UseApiPopupProps = {
  open: boolean
  onClose: () => void
  websiteId?: string 
  promptName?: string
  prompts?: Array<{ text: string, children?: any[] }>
}

const UseApiPopup: React.FC<UseApiPopupProps> = ({ 
  open, 
  onClose,
  websiteId,
  promptName,
  prompts = [] 
}) => {
  const [url, setUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiPrompts, setApiPrompts] = useState<APIPrompt[]>([])
  const [allChildPrompts, setAllChildPrompts] = useState<APIPrompt[]>([])
  const [showMode, setShowMode] = useState<'root' | 'child'>('root')
  const [newParamKey, setNewParamKey] = useState("")
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)
  const [editModeId, setEditModeId] = useState<string | null>(null)
  
  const API_BASE = `${config.apiBaseUrl}/api/childprompt`

  useEffect(() => {
    if (open) {
      loadApiConfig()
    } else {
      setIsLoadingConfig(true)
      setApiPrompts([])
      setAllChildPrompts([])
      setUrl("")
      setApiKey("")
      setShowMode('root')
      setEditModeId(null)
    }
  }, [open])

  const loadApiConfig = async () => {
    setIsLoadingConfig(true)
    
    try {
      let serverData = null
      
      if (websiteId && promptName) {
        const encodedPrompt = encodeURIComponent(promptName)
        const res = await fetch(`${API_BASE}/${websiteId}/${encodedPrompt}`)
        
        if (res.ok) {
          const data = await res.json()
          serverData = data.data || data
          
          const urlsArray = serverData.urls || []
          const apiKeysArray = serverData.apiKeys || []
          
          setUrl(urlsArray.length > 0 ? urlsArray[0] : "")
          setApiKey(apiKeysArray.length > 0 ? apiKeysArray[0] : "")
        }
      }
      
      const rootPrompts = prompts || []
      const initialPrompts: APIPrompt[] = []
      
      if (rootPrompts.length > 0) {
        // Load other prompts from promptsWithParams
        const serverPromptsWithParams = serverData?.promptsWithParams || []
        const serverParamsMap = new Map()
        
        serverPromptsWithParams.forEach((p: any) => {
          if (p.text && p.parameter) {
            serverParamsMap.set(p.text, p.parameter)
          }
        })
        
        // Check if there's summaryList data in serverData
        const summaryListData = serverData?.summaryList || []
        
        // Load Summary from summaryList
        if (summaryListData.length > 0) {
          // summaryList is an array of objects with text and parameter
          summaryListData.forEach((summaryItem: any) => {
            if (summaryItem.text === "Summary" && summaryItem.parameter) {
              initialPrompts.push({
                id: `summary-${Date.now()}`,
                text: "Summary",
                parameter: {
                  id: summaryItem.parameter.id || `param-summary`,
                  key: summaryItem.parameter.key || ""
                },
                type: 'root',
                isEditing: false,
                tempKey: summaryItem.parameter.key || ""
              })
            }
          })
        }
        
        // If no Summary found in summaryList, add empty Summary
        if (!initialPrompts.some(p => p.text === "Summary")) {
          initialPrompts.push({
            id: `summary-${Date.now()}`,
            text: "Summary",
            parameter: undefined,
            type: 'root',
            isEditing: false,
            tempKey: ""
          })
        }
        
        // Then add other root prompts with database data (excluding Summary)
        rootPrompts.forEach((prompt, index) => {
          const promptText = prompt.text || `Prompt ${index + 1}`
          // Skip if it's "Summary" as we already added it
          if (promptText === "Summary") return
          
          const serverParam = serverParamsMap.get(promptText)
          
          initialPrompts.push({
            id: `root-${index}-${Date.now()}`,
            text: promptText,
            parameter: serverParam ? {
              id: serverParam.id || `param-${index}`,
              key: serverParam.key || ""
            } : undefined,
            type: 'root',
            isEditing: false,
            tempKey: serverParam?.key || ""
          })
        })
      }
      
      // Extract child prompts with database data
      const extractChildPrompts = (nodes: any[], level: number = 1): APIPrompt[] => {
        const result: APIPrompt[] = []
        
        const traverse = (node: any, currentLevel: number) => {
          if (currentLevel >= 1 && node.text && node.text !== "Summary") {
            result.push({
              id: `child-${Date.now()}-${Math.random()}`,
              text: node.text || '',
              type: 'child',
              level: currentLevel,
              isEditing: false,
              tempKey: ''
            })
          }
          
          if (node.children && Array.isArray(node.children)) {
            node.children.forEach((child: any) => {
              traverse(child, currentLevel + 1)
            })
          }
        }
        
        nodes.forEach(root => {
          traverse(root, 0)
        })
        
        return result
      }
      
      const childPrompts = extractChildPrompts(prompts)
      
      // Add database parameters to child prompts
      if (serverData?.promptsWithParams) {
        const updatedChildPrompts = childPrompts.map(childPrompt => {
          const matchingParam = serverData.promptsWithParams.find((p: any) => 
            p.text === childPrompt.text && p.type === 'child'
          )
          
          if (matchingParam && matchingParam.parameter) {
            return {
              ...childPrompt,
              parameter: {
                id: matchingParam.parameter.id || `param-${Date.now()}`,
                key: matchingParam.parameter.key || ""
              },
              tempKey: matchingParam.parameter.key || ""
            }
          }
          return childPrompt
        })
        
        setAllChildPrompts(updatedChildPrompts)
      } else {
        setAllChildPrompts(childPrompts)
      }
      
      setApiPrompts(initialPrompts)
      
    } catch (error) {
      console.error('Error loading config:', error)
      
      const rootPrompts = prompts || []
      const initialPrompts: APIPrompt[] = []
      
      if (rootPrompts.length > 0) {
        // Always add Summary first
        initialPrompts.push({
          id: `summary-${Date.now()}`,
          text: "Summary",
          parameter: undefined,
          type: 'root',
          isEditing: false,
          tempKey: ""
        })
        
        // Then add other prompts
        rootPrompts.forEach((prompt, index) => {
          const promptText = prompt.text || `Prompt ${index + 1}`
          if (promptText === "Summary") return
          
          initialPrompts.push({
            id: `root-${index}-${Date.now()}`,
            text: promptText,
            parameter: undefined,
            type: 'root',
            isEditing: false,
            tempKey: ""
          })
        })
      }
      
      const extractChildPrompts = (nodes: any[], level: number = 1): APIPrompt[] => {
        const result: APIPrompt[] = []
        
        const traverse = (node: any, currentLevel: number) => {
          if (currentLevel >= 1 && node.text && node.text !== "Summary") {
            result.push({
              id: `child-${Date.now()}-${Math.random()}`,
              text: node.text || '',
              type: 'child',
              level: currentLevel,
              isEditing: false,
              tempKey: ''
            })
          }
          
          if (node.children && Array.isArray(node.children)) {
            node.children.forEach((child: any) => {
              traverse(child, currentLevel + 1)
            })
          }
        }
        
        nodes.forEach(root => {
          traverse(root, 0)
        })
        
        return result
      }
      
      const childPrompts = extractChildPrompts(prompts)
      setAllChildPrompts(childPrompts)
      setApiPrompts(initialPrompts)
    } finally {
      setIsLoadingConfig(false)
    }
  }

  const handleAddParameter = (promptId: string) => {
    if (!newParamKey.trim()) return
    
    const updatedPrompts = showMode === 'root' ? apiPrompts : allChildPrompts
    const setterFunction = showMode === 'root' ? setApiPrompts : setAllChildPrompts
    
    const updated = updatedPrompts.map(prompt => {
      if (prompt.id === promptId) {
        const newParameter = {
          id: `param-${Date.now()}`,
          key: newParamKey.trim()
        }
        
        return {
          ...prompt,
          parameter: newParameter,
          tempKey: newParamKey.trim(),
          isEditing: false
        }
      }
      return prompt
    })
    
    setterFunction(updated)
    setNewParamKey("")
    setSelectedPromptId(null)
  }

  const handleUpdateParameter = async (promptId: string) => {
    const updatedPrompts = showMode === 'root' ? apiPrompts : allChildPrompts
    const setterFunction = showMode === 'root' ? setApiPrompts : setAllChildPrompts
    
    const updated = updatedPrompts.map(prompt => {
      if (prompt.id === promptId && prompt.tempKey && prompt.tempKey.trim()) {
        const updatedParameter = {
          ...prompt.parameter!,
          id: prompt.parameter?.id || `param-${Date.now()}`,
          key: prompt.tempKey.trim()
        }
        
        return {
          ...prompt,
          parameter: updatedParameter,
          isEditing: false
        }
      }
      return prompt
    })
    
    setterFunction(updated)
    setEditModeId(null)
  }

  const handleDeleteParameter = async (promptId: string) => {
    const updatedPrompts = showMode === 'root' ? apiPrompts : allChildPrompts
    const setterFunction = showMode === 'root' ? setApiPrompts : setAllChildPrompts
    
    const updated = updatedPrompts.map(prompt => {
      if (prompt.id === promptId) {
        return {
          ...prompt,
          parameter: undefined,
          tempKey: "",
          isEditing: false
        }
      }
      return prompt
    })
    
    setterFunction(updated)
  }

  const handleEditParameter = (promptId: string) => {
    const updatedPrompts = showMode === 'root' ? apiPrompts : allChildPrompts
    const setterFunction = showMode === 'root' ? setApiPrompts : setAllChildPrompts
    
    const updated = updatedPrompts.map(prompt => {
      if (prompt.id === promptId && prompt.parameter) {
        return {
          ...prompt,
          isEditing: true,
          tempKey: prompt.parameter.key
        }
      }
      return prompt
    })
    
    setterFunction(updated)
    setEditModeId(promptId)
  }

  const handleCancelEdit = (promptId: string) => {
    const updatedPrompts = showMode === 'root' ? apiPrompts : allChildPrompts
    const setterFunction = showMode === 'root' ? setApiPrompts : setAllChildPrompts
    
    const updated = updatedPrompts.map(prompt => {
      if (prompt.id === promptId) {
        return {
          ...prompt,
          isEditing: false,
          tempKey: prompt.parameter?.key || ""
        }
      }
      return prompt
    })
    
    setterFunction(updated)
    setEditModeId(null)
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      
      // Combine all prompts
      const allPrompts = [...apiPrompts, ...allChildPrompts]
      
      // Separate Summary from other prompts
      const summaryPrompt = allPrompts.find(p => p.text === "Summary")
      const otherPrompts = allPrompts.filter(p => p.text !== "Summary")
      
      // Prepare promptsWithParams (excluding Summary)
      const promptsWithParams = otherPrompts
        .filter(prompt => prompt.parameter)
        .map(prompt => ({
          text: prompt.text,
          parameter: prompt.parameter || null,
          type: prompt.type || 'root'
        }))
      
      // Prepare summaryList array (for Summary prompt)
      // summaryList should be an array of objects
      let summaryList = []
      if (summaryPrompt?.parameter) {
        summaryList.push({
          text: "Summary",
          parameter: summaryPrompt.parameter || null,
          type: 'root'
        })
      }

      if (websiteId && promptName) {
        const encodedPrompt = encodeURIComponent(promptName)
        const endpoint = `${API_BASE}/${websiteId}/${encodedPrompt}`
        
        let existingData = {}
        try {
          const res = await fetch(endpoint)
          if (res.ok) {
            const data = await res.json()
            existingData = data.data || data
          }
        } catch (error) {
          console.error('Error fetching existing data:', error)
        }
        
        // Prepare the update data matching your database model
        const updateData = {
          ...existingData,
          promptsWithParams: promptsWithParams,
          summaryList: summaryList, // Save Summary to summaryList field as array
          urls: url ? [url] : [],
          apiKeys: apiKey ? [apiKey] : [],
          backendApiKey: apiKey || "", // Also save to backendApiKey field
          updatedAt: new Date().toISOString(),
          websiteId,
          promptName,
          pk: `website#${websiteId}`,
          sk: `prompt#${promptName}`
        }
        
        console.log('Saving data with summaryList:', updateData); // Debug log
        
        const res = await fetch(endpoint, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        })
        
        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(`Failed to save configuration: ${errorText}`)
        }
        
        onClose()
      } else {
        // If no websiteId, save to localStorage
        const localConfig = {
          url,
          apiKey,
          prompts: promptsWithParams,
          summaryList: summaryList,
          savedAt: new Date().toISOString()
        }
        
        localStorage.setItem('apiConfig', JSON.stringify(localConfig))
        onClose()
      }
    } catch (error) {
      console.error('Error saving config:', error)
      // You might want to show an error message to the user here
    } finally {
      setLoading(false)
    }
  }

  // Helper function to ensure Summary is always first
  const sortPromptsWithSummaryFirst = (prompts: APIPrompt[]) => {
    const summary = prompts.find(p => p.text === "Summary")
    const others = prompts.filter(p => p.text !== "Summary")
    return summary ? [summary, ...others] : [...others]
  }

  // Get current prompts based on showMode
  const currentPrompts = showMode === 'root' ? sortPromptsWithSummaryFirst(apiPrompts) : allChildPrompts
  const groupedPrompts = []
  for (let i = 0; i < currentPrompts.length; i += 2) {
    groupedPrompts.push(currentPrompts.slice(i, i + 2))
  }

  const handleToggleView = () => {
    setShowMode(prev => prev === 'root' ? 'child' : 'root')
    setEditModeId(null)
    setSelectedPromptId(null)
  }

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerMain}>
            <Cog className={styles.headerIcon} size={24} />
            <div>
              <h2>{promptName ? `API Configuration - ${promptName}` : "API Configuration"}</h2>
              <p>Configure API parameters for {showMode === 'root' ? 'root' : 'child/sub-child'} prompts{promptName ? ` in "${promptName}"` : ""}</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose} disabled={isLoadingConfig}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {isLoadingConfig ? (
            <div className={styles.loaderContainer}>
              <div className={styles.loaderSpinner}>
                <Loader2 size={48} className={styles.spinnerIcon} />
              </div>
              <div className={styles.loaderText}>
                <h3>Loading API Configuration</h3>
                <p>Please wait while we load your data...</p>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.apiConfigSection}>
                <div className={styles.apiConfigGrid}>
                  <div className={styles.configInputGroup}>
                    <div className={styles.inputLabel}>
                      <Link size={16} />
                      API URL
                    </div>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://api.example.com/v1"
                      className={styles.urlInput}
                    />
                  </div>
                  
                  <div className={styles.configInputGroup}>
                    <div className={styles.inputLabel}>
                      <Key size={16} />
                      API Key
                    </div>
                    <div className={styles.apiKeyWrapper}>
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your API key"
                        className={styles.apiKeyInput}
                      />
                      <button
                        type="button"
                        className={styles.eyeToggle}
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.toggleSection}>
                <button 
                  className={styles.toggleButton}
                  onClick={handleToggleView}
                  disabled={showMode === 'root' && apiPrompts.length === 0 || 
                           showMode === 'child' && allChildPrompts.length === 0}
                >
                  {showMode === 'root' ? (
                    <>
                      Show Child Prompts ({allChildPrompts.length})
                    </>
                  ) : (
                    <>
                      Show Root Prompts ({apiPrompts.length})
                    </>
                  )}
                </button>
              </div>

              <div className={styles.promptsSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>
                    <FileText size={20} />
                    {showMode === 'root' ? 'Root' : 'Child/Sub-Child'} Prompts ({currentPrompts.length})
                    <span className={styles.sectionSubtitle}>
                      - Add API parameters to {showMode === 'root' ? 'root' : 'child/sub-child'} prompts
                    </span>
                  </div>
                  
                  <div className={styles.sectionStats}>
                    <div className={styles.statItem}>
                      <Tag size={14} />
                      <span>{currentPrompts.filter(p => p.parameter).length} with parameters</span>
                    </div>
                  </div>
                </div>

                {currentPrompts.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIllustration}>
                      <FileText size={64} />
                    </div>
                    <h3>
                      No {showMode === 'root' ? 'Root' : 'Child/Sub-Child'} Prompts
                    </h3>
                    <p>
                      {showMode === 'root' 
                        ? 'Create root prompts in the main builder to configure API parameters'
                        : 'Create child prompts in the main builder to configure API parameters'}
                    </p>
                  </div>
                ) : (
                  <div className={styles.promptsGrid}>
                    {groupedPrompts.map((row, rowIndex) => (
                      <div key={rowIndex} className={styles.promptRow}>
                        {row.map((prompt, promptIndex) => (
                          <div 
                            key={prompt.id} 
                            className={styles.promptCard}
                            data-type={prompt.type}
                            style={prompt.level ? { marginLeft: `${(prompt.level - 1) * 20}px` } : {}}
                          >
                            <div className={styles.promptHeader}>
                              <div className={styles.promptMeta}>
                                <div className={styles.promptInfo}>
                                  <div>
                                    <div className={styles.promptNumber}>
                                      {showMode === 'root' ? 'Root' : `Level ${prompt.level || 1}`} Prompt {rowIndex * 2 + promptIndex + 1}
                                    </div>
                                
                                  </div>
                                </div>
                                <div className={styles.promptStatus}>
                                  {prompt.parameter ? (
                                    <span className={styles.hasParameter}>
                                      <Check size={12} />
                                      Parameter Set
                                    </span>
                                  ) : (
                                    <span className={styles.noParameter}>
                                      <AlertCircle size={12} />
                                      No Parameter
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className={styles.promptTextContainer}>
                              <Lock size={14} className={styles.lockIcon} />
                              <div className={styles.promptText} title={prompt.text}>
                                {prompt.text}
                              </div>
                            </div>

                            <div className={styles.parameterSection}>
                              {prompt.parameter ? (
                                <div className={styles.parameterCard}>
                                  <div className={styles.parameterHeader}>
                                    <Tag size={14} className={styles.paramIcon} />
                                    <span className={styles.paramLabel}>Parameter Key:</span>
                                    {!prompt.isEditing && (
                                      <button 
                                        className={styles.editParamBtn}
                                        onClick={() => handleEditParameter(prompt.id)}
                                        title="Edit parameter"
                                      >
                                        <Edit size={14} />
                                      </button>
                                    )}
                                  </div>
                                  <div className={styles.parameterContent}>
                                    {prompt.isEditing ? (
                                      <>
                                        <input
                                          type="text"
                                          value={prompt.tempKey || ""}
                                          onChange={(e) => {
                                            const updatedPrompts = showMode === 'root' ? apiPrompts : allChildPrompts
                                            const setterFunction = showMode === 'root' ? setApiPrompts : setAllChildPrompts
                                            
                                            const updated = updatedPrompts.map(p => {
                                              if (p.id === prompt.id) {
                                                return { ...p, tempKey: e.target.value }
                                              }
                                              return p
                                            })
                                            
                                            setterFunction(updated)
                                          }}
                                          className={styles.parameterInput}
                                          placeholder="parameter_key"
                                          autoFocus
                                        />
                                        <div className={styles.editActions}>
                                          <button 
                                            className={styles.confirmBtn}
                                            onClick={() => handleUpdateParameter(prompt.id)}
                                            disabled={!prompt.tempKey?.trim()}
                                          >
                                            <Save size={14} />
                                            Update
                                          </button>
                                          <button 
                                            className={styles.cancelBtn}
                                            onClick={() => handleCancelEdit(prompt.id)}
                                          >
                                            <X size={14} />
                                            Cancel
                                          </button>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className={styles.parameterValue}>
                                          {prompt.parameter.key}
                                        </div>
                                        <button 
                                          className={styles.deleteParamBtn}
                                          onClick={() => handleDeleteParameter(prompt.id)}
                                          title="Remove parameter"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className={styles.addParameterSection}>
                                  {selectedPromptId === prompt.id ? (
                                    <div className={styles.addParameterForm}>
                                      <div className={styles.formHeader}>
                                        <Tag size={14} />
                                        <span>Add Parameter</span>
                                        {prompt.text === "Summary" && (
                                          <span className={styles.databaseNote}>Saves to database</span>
                                        )}
                                      </div>
                                      <div className={styles.formGroup}>
                                        <input
                                          type="text"
                                          value={newParamKey}
                                          onChange={(e) => setNewParamKey(e.target.value)}
                                          placeholder="Enter parameter key"
                                          className={styles.newParamInput}
                                          onKeyDown={(e) => e.key === 'Enter' && handleAddParameter(prompt.id)}
                                        />
                                        <div className={styles.formActions}>
                                          <button 
                                            className={styles.confirmBtn}
                                            onClick={() => handleAddParameter(prompt.id)}
                                            disabled={!newParamKey.trim()}
                                          >
                                            <Check size={14} />
                                            Add
                                          </button>
                                          <button 
                                            className={styles.cancelBtn}
                                            onClick={() => {
                                              setSelectedPromptId(null)
                                              setNewParamKey("")
                                            }}
                                          >
                                            <X size={14} />
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className={styles.addParameterPrompt}>
                                      <button 
                                        className={styles.addParamBtn}
                                        onClick={() => setSelectedPromptId(prompt.id)}
                                      >
                                        <Tag size={14} />
                                        Add Parameter
                                      </button>
                                      <p className={styles.addPromptHint}>
                                        Click to add API parameter for this prompt
                                     
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {row.length === 1 && (
                          <div className={styles.emptyPromptSlot}></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerStats}>
            <div className={styles.totalPrompts}>
              <span className={styles.totalNumber}>{apiPrompts.length}</span>
              <span className={styles.totalLabel}>Root Prompts</span>
            </div>
            <div className={styles.configuredPrompts}>
              <span className={styles.configuredNumber}>
                {showMode === 'root' 
                  ? apiPrompts.filter(p => p.parameter).length
                  : allChildPrompts.filter(p => p.parameter).length}
              </span>
              <span className={styles.configuredLabel}>
                {showMode === 'root' ? 'Root' : 'Child'} With Parameters
              </span>
            </div>
            <div className={styles.pendingPrompts}>
              <span className={styles.pendingNumber}>
                {showMode === 'root'
                  ? apiPrompts.length - apiPrompts.filter(p => p.parameter).length
                  : allChildPrompts.length - allChildPrompts.filter(p => p.parameter).length}
              </span>
              <span className={styles.pendingLabel}>
                {showMode === 'root' ? 'Root' : 'Child'} Pending
              </span>
            </div>
          </div>
          
          <div className={styles.footerActions}>
            <button 
              className={styles.cancelBtnLarge}
              onClick={onClose}
              disabled={loading || isLoadingConfig}
            >
              Cancel
            </button>
            <button 
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={loading || isLoadingConfig}
            >
              {loading ? (
                <>
                  <div className={styles.spinner}></div>
                  Saving...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UseApiPopup