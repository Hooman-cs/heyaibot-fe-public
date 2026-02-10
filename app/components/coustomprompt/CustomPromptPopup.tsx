"use client"

import React, { useMemo, useState, useEffect } from "react"
import styles from "./CustomPromptPopup.module.css"
import { X, Plus, Trash2, ChevronDown, Edit3, MoreVertical, Folder, FileText, Settings as SettingsIcon, Check, Loader2 } from "lucide-react"
import config from '../utils/config';
import UseApiPopup from "./APISettingsPopup";

type PromptNode = {
  text: string
  desc?: string
  children: PromptNode[]
}

type Path = number[]

function pathKey(path: Path): string {
  return path.join(".")
}

function getNodeAtPath(tree: PromptNode[], path: Path): PromptNode | null {
  let node: PromptNode | null = null
  let layer: PromptNode[] = tree
  for (let i = 0; i < path.length; i++) {
    const idx = path[i]
    if (!layer || idx < 0 || idx >= layer.length) return null
    node = layer[idx]
    layer = node.children
  }
  return node
}

function setNodeAtPath(tree: PromptNode[], path: Path, update: (node: PromptNode) => void): PromptNode[] {
  const clone = structuredClone(tree)
  let layer: PromptNode[] = clone
  let nodeToUpdate: PromptNode | undefined = undefined

  for (let i = 0; i < path.length; i++) {
    const idx = path[i]
    if (i === path.length - 1) {
      if (layer[idx]) {
        nodeToUpdate = layer[idx]
        update(nodeToUpdate)
      }
    } else {
      if (!layer[idx] || !layer[idx].children) return clone
      layer = layer[idx].children
    }
  }
  return clone
}

function removeNodeAtPath(tree: PromptNode[], path: Path): PromptNode[] {
  if (path.length === 0) return tree
  const clone = structuredClone(tree)
  let layer = clone
  for (let i = 0; i < path.length - 1; i++) {
    const idx = path[i]
    if (!layer[idx]) return clone
    layer = layer[idx].children
  }
  const lastIdx = path[path.length - 1]
  if (lastIdx >= 0 && lastIdx < layer.length) layer.splice(lastIdx, 1)
  return clone
}

const API_BASE = `${config.apiBaseUrl}/api/childprompt`

const CustomPromptPopup = ({
  onClose,
  websiteId,
  promptName,
   apiKey,
}: {
  onClose: () => void
  websiteId?: string
  promptName?: string
 apiKey?: string
}) => {
  const [prompts, setPrompts] = useState<PromptNode[]>([])
  const [newRootPrompt, setNewRootPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [isExistingRemote, setIsExistingRemote] = useState(false)
  const [openUseApi, setOpenUseApi] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [addChildOpenMap, setAddChildOpenMap] = useState<Record<string, boolean>>({})
  const [addChildTextMap, setAddChildTextMap] = useState<Record<string, string>>({})
  const [editingNodePath, setEditingNodePath] = useState<string | null>(null)
  const [editingNodeText, setEditingNodeText] = useState("")
  const [selectedPath, setSelectedPath] = useState<Path>([])
  const [dropdownOpenMap, setDropdownOpenMap] = useState<Record<string, boolean>>({})

  const selectedNode = useMemo(() => getNodeAtPath(prompts, selectedPath), [prompts, selectedPath])

  const getRootPrompts = () => {
    return prompts.map(prompt => ({
      text: prompt.text,
      children: prompt.children || []
    }));
  }

  
  useEffect(() => {
    async function load() {
      setIsLoadingData(true)
      if (websiteId && promptName) {
        setLoading(true)
        try {
          const encodedPrompt = encodeURIComponent(promptName)
          const res = await fetch(`${API_BASE}/${websiteId}/${encodedPrompt}`)
          if (res.ok) {
            const json = await res.json()
            setPrompts(json.prompts || [])
            setIsExistingRemote(true)
          } else if (res.status === 404) {
            setIsExistingRemote(false)
          }
        } catch (err) {
          // Handle error silently
        } finally {
          setLoading(false)
          setIsLoadingData(false)
        }
      } else {
        const savedData = localStorage.getItem("customPromptData")
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData)
            setPrompts(parsed.prompts || [])
          } catch (err) {
            // Handle parsing error silently
          }
        }
        setIsLoadingData(false)
      }
    }
    load()
  }, [websiteId, promptName])

  const toggleExpanded = (path: Path) => {
    const key = pathKey(path)
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const toggleAddChildForPath = (path: Path) => {
    const key = pathKey(path)
    setAddChildOpenMap((m) => ({ ...m, [key]: !m[key] }))
    setDropdownOpenMap((m) => ({ ...m, [key]: false }))
    setEditingNodePath(null)
  }

  const setAddChildTextForPath = (path: Path, val: string) => {
    const key = pathKey(path)
    setAddChildTextMap((m) => ({ ...m, [key]: val }))
  }

  const toggleDropdownForPath = (path: Path, e: React.MouseEvent) => {
    e.stopPropagation()
    const key = pathKey(path)
    setDropdownOpenMap((m) => ({ [key]: !m[key] }))
    setAddChildOpenMap((m) => ({ ...m, [key]: false }))
    setEditingNodePath(null)
  }

  const handleAddRootPrompt = () => {
    if (!newRootPrompt.trim()) return
    setPrompts((p) => [...p, { text: newRootPrompt.trim(), children: [] }])
    setNewRootPrompt("")
  }

  const handleAddChildAtPath = (path: Path) => {
    const key = pathKey(path)
    const val = (addChildTextMap[key] || "").trim()
    if (!val) return
    setPrompts(setNodeAtPath(prompts, path, (node) => node.children.push({ text: val, children: [] })))
    setAddChildTextForPath(path, "")
    setAddChildOpenMap((m) => ({ ...m, [key]: false }))
    setExpandedNodes(prev => new Set(prev).add(key))
  }

  const handleRemoveAtPath = (path: Path) => {
    setPrompts((prev) => removeNodeAtPath(prev, path))
    if (pathKey(path) === pathKey(selectedPath) || pathKey(selectedPath).startsWith(pathKey(path) + ".")) {
      setSelectedPath([])
    }
    setDropdownOpenMap((m) => ({ ...m, [pathKey(path)]: false }))
  }

  const handleStartNodeEdit = (node: PromptNode, path: Path) => {
    setEditingNodePath(pathKey(path))
    setEditingNodeText(node.text)
    setAddChildOpenMap(m => ({ ...m, [pathKey(path)]: false }))
    setDropdownOpenMap(m => ({ ...m, [pathKey(path)]: false }))
  }

  const handleUpdateNodeText = (path: Path) => {
    const val = editingNodeText.trim()
    if (!val) return
    setPrompts(setNodeAtPath(prompts, path, (node) => {
      node.text = val
    }))
    setEditingNodePath(null)
    setEditingNodeText("")
  }

  const handleCancelEdit = () => {
    setEditingNodePath(null)
    setEditingNodeText("")
  }

 

const handleSave = async () => {
  setLoading(true)
  try {
    const payload = { 
      websiteId, 
      promptName, 
      prompts,
      backendApiKey: apiKey, // ✅ YEH LINE RAHNE DO - database mein save hoga
    }

    if (websiteId && promptName) {
      if (isExistingRemote) {
        const res = await fetch(`${API_BASE}/${websiteId}/${encodeURIComponent(promptName)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            prompts,
            backendApiKey: apiKey, // ✅ UPDATE ke liye bhi bhejo
          }),
        })
        if (!res.ok) {
          throw new Error('Save failed')
        }
      } else {
        const res = await fetch(`${API_BASE}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          throw new Error('Save failed')
        }
        setIsExistingRemote(true)
      }
    }
    onClose()
  } catch (err) {
    // Handle error silently
  } finally {
    setLoading(false)
  }
}

const handleDeleteRemote = async () => {
  if (!websiteId || !promptName) return
  setLoading(true)
  try {
    const res = await fetch(`${API_BASE}/${websiteId}/${encodeURIComponent(promptName)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        backendApiKey: apiKey // ✅ DELETE ke liye bhi same apiKey bhejo
      }),
    })
    if (!res.ok) {
      throw new Error('Delete failed')
    }
    setIsExistingRemote(false)
    setPrompts([])
    onClose()
  } catch (err) {
    // Handle error silently
  } finally {
    setLoading(false)
  }
}

const countAllSubChildPromptsSimple = (nodes: PromptNode[]): number => {
  const countAllChildren = (node: PromptNode): number => {
    let count = 0;
    node.children.forEach(child => {
      count++; // Count this child
      count += countAllChildren(child); // Count its children too
    });
    return count;
  };
  
  // Total all children minus direct children
  const totalAllChildren = nodes.reduce((sum, root) => sum + countAllChildren(root), 0);
  const totalDirectChildren = nodes.reduce((sum, root) => sum + root.children.length, 0);
  
  return totalAllChildren - totalDirectChildren;
};

  useEffect(() => {
    const handleClickOutside = () => {
      setDropdownOpenMap({})
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const NodeItem: React.FC<{ node: PromptNode; path: Path; depth: number }> = ({ node, path, depth }) => {
    const key = pathKey(path)
    const isSelected = key === pathKey(selectedPath)
    const isEditing = key === editingNodePath
    const hasChildren = node.children.length > 0
    const isExpanded = expandedNodes.has(key)
    const isAddChildOpen = addChildOpenMap[key]
    const isDropdownOpen = dropdownOpenMap[key]
   
    return (
      <li className={`${styles.nodeItem} ${isSelected ? styles.nodeItemSelected : ""}`}>
        <div className={styles.nodeContent}>
          <div className={styles.nodeMain}>
            <div className={styles.nodeLeft}>
              <button
                className={`${styles.expandButton} ${hasChildren ? styles.expandable : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (hasChildren) toggleExpanded(path)
                }}
                disabled={!hasChildren}
              >
                {hasChildren ? (
                  <ChevronDown className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`} size={16} />
                ) : (
                  <div className={styles.dot} />
                )}
              </button>

              {isEditing ? (
                <input
                  type="text"
                  className={styles.editInput}
                  value={editingNodeText}
                  onChange={(e) => setEditingNodeText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdateNodeText(path);
                    else if (e.key === "Escape") handleCancelEdit();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <span className={styles.nodeText} title={node.text}>
                  {node.text}
                </span>
              )}
            </div>

            <div className={styles.nodeActions}>
              {isEditing ? (
                <div className={styles.editActions}>
                  <button
                    className={styles.updateButton}
                    onClick={() => handleUpdateNodeText(path)}
                    disabled={!editingNodeText.trim()}
                    title="Update"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    className={styles.cancelEditButton}
                    onClick={handleCancelEdit}
                    title="Cancel"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    className={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleAddChildForPath(path)
                    }}
                    title="Add child"
                  >
                    <Plus size={16} />
                  </button>
                  
                  <div className={styles.dropdownWrapper}>
                    <button
                      className={`${styles.actionButton} ${styles.moreButton} ${isDropdownOpen ? styles.active : ''}`}
                      onClick={(e) => toggleDropdownForPath(path, e)}
                      title="More options"
                    >
                      <MoreVertical size={16} />
                    </button>
                    
                    {isDropdownOpen && (
                      <div className={styles.dropdownMenu}>
                        <button
                          className={styles.dropdownItem}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStartNodeEdit(node, path)
                          }}
                        >
                          <Edit3 size={14} />
                          Edit
                        </button>
                        <button
                          className={`${styles.dropdownItem} ${styles.deleteItem}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveAtPath(path)
                          }}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {isAddChildOpen && (
            <div className={styles.addChildForm}>
              <input
                type="text"
                className={styles.childInput}
                placeholder="Enter child prompt..."
                value={addChildTextMap[key] || ""}
                onChange={(e) => setAddChildTextForPath(path, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddChildAtPath(path)
                  else if (e.key === "Escape") toggleAddChildForPath(path)
                }}
                autoFocus
              />
              <div className={styles.childActions}>
                <button
                  className={styles.confirmButton}
                  onClick={() => handleAddChildAtPath(path)}
                  disabled={!addChildTextMap[key]?.trim()}
                >
                  Add
                </button>
                <button
                  className={styles.cancelButton}
                  onClick={() => toggleAddChildForPath(path)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <ul className={styles.childList} style={{ marginLeft: `${depth * 20 + 20}px` }}>
            {node.children.map((child, i) => (
              <NodeItem key={i} node={child} path={[...path, i]} depth={depth + 1} />
            ))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerMain}>
            <Folder className={styles.headerIcon} size={24} />
            <div>
              <h2>{promptName ? `Custom Prompt: ${promptName}` : "Custom Prompt Builder"}</h2>
              <p>Create and manage your prompt hierarchy</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose} disabled={loading || isLoadingData}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {isLoadingData ? (
            <div className={styles.loaderContainer}>
              <div className={styles.loaderSpinner}>
                <Loader2 size={48} className={styles.spinnerIcon} />
              </div>
              <div className={styles.loaderText}>
                <h3>Loading Prompts</h3>
                <p>Please wait while we load your data...</p>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>{prompts.length}</span>
                  <span className={styles.statLabel}>Root Prompts</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>
                    {prompts.reduce((count, node) => count + node.children.length, 0)}
                  </span>
                  <span className={styles.statLabel}>Child Prompts</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>
                     {countAllSubChildPromptsSimple(prompts)}
                  </span>
                  <span className={styles.statLabel}>Sub-Child Prompt</span>
                </div>
              </div>

              {/* Root Prompts Section */}
              <div className={styles.section}>
                <h3>Add Root Prompt</h3>
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    value={newRootPrompt}
                    onChange={(e) => setNewRootPrompt(e.target.value)}
                    placeholder="Enter a new root prompt..."
                    onKeyDown={(e) => e.key === "Enter" && handleAddRootPrompt()}
                    className={styles.textInput}
                    disabled={loading}
                  />
                  <button
                    onClick={handleAddRootPrompt}
                    disabled={!newRootPrompt.trim() || loading}
                    className={styles.primaryButton}
                  >
                    <Plus size={18} />
                    Add Root
                  </button>
                </div>
              </div>

              {/* Prompt Tree Section */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3>Prompt Tree Structure</h3>
                  {prompts.length > 0 && (
                    <span className={styles.countBadge}>{prompts.length} items</span>
                  )}
                </div>
                
                <div className={styles.treeContainer}>
                  {prompts.length === 0 ? (
                    <div className={styles.emptyState}>
                      <FileText size={48} className={styles.emptyIcon} />
                      <h4>No prompts yet</h4>
                      <p>Start by adding your first root prompt above</p>
                    </div>
                  ) : (
                    <ul className={styles.tree}>
                      {prompts.map((node, i) => (
                        <NodeItem key={i} node={node} path={[i]} depth={0} />
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerActions}>
            {websiteId && promptName && isExistingRemote && (
              <button
                className={styles.deleteButton}
                onClick={handleDeleteRemote}
                disabled={loading || isLoadingData}
              >
                <Trash2 size={16} />
                Delete from Server
              </button>
            )}
            
            <button
              className={styles.useApiButton}
              onClick={() => setOpenUseApi(true)}
              disabled={loading || isLoadingData}
            >
              <SettingsIcon size={16} /> 
              Use Extra API
            </button>
            
            <div className={styles.buttonGroup}>
              <button
                className={styles.secondaryButton}
                onClick={onClose}
                disabled={loading || isLoadingData}
              >
                Cancel
              </button>
              <button
                className={styles.saveButton}
                onClick={handleSave}
                disabled={loading || isLoadingData}
              >
                {loading ? (
                  <>
                    <div className={styles.spinner}></div>
                    Saving...
                  </>
                ) : (
                  "✨ Save & Close"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <UseApiPopup 
        open={openUseApi} 
        onClose={() => setOpenUseApi(false)}
        prompts={getRootPrompts()}
        websiteId={websiteId}
        promptName={promptName}
      />
    </div>
  )
}

export default CustomPromptPopup