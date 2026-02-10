'use client';
import { useState, useEffect } from 'react';
import styles from '../../pages/Chatpanel/AdminChatRequests.module.css';
import config from './utils/config';
import { useRouter, useParams } from 'next/navigation';

const AdminChatRequests = ({
  backendApiKey = null,
  apiBaseUrl = config.apiBaseUrl,
}) => {
  const router = useRouter();
  const params = useParams();
  
  const urlBackendApiKey = params.backendApiKey;
  const finalBackendApiKey = urlBackendApiKey || backendApiKey;

  const [chatRequests, setChatRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('checking');

  const goToAdminPanel = () => {
    router.push(`/Admin/AdminManagement/${encodeURIComponent(finalBackendApiKey)}`);
  };

  const testApiConnection = async () => {
    try {
      setConnectionStatus('checking');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${apiBaseUrl}/api/chat-requests/test`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${finalBackendApiKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setConnectionStatus('connected');
        return true;
      } else {
        setConnectionStatus('error');
        return false;
      }
    } catch (error) {
      console.error('API connection test failed:', error);
      
      if (error.name === 'AbortError') {
        setConnectionStatus('timeout');
      } else {
        setConnectionStatus('error');
      }
      
      return false;
    }
  };

  const fetchChatRequests = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 Fetching chat requests...');
      console.log('Using APP ID:', finalBackendApiKey);
      
      if (!finalBackendApiKey) {
        throw new Error('Backend APP ID is required. Please provide it in the URL.');
      }

      const isConnected = await testApiConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to server. Please check if the backend is running.');
      }

      const urlParams = new URLSearchParams();
      if (finalBackendApiKey) {
        urlParams.append('backendApiKey', finalBackendApiKey);
      }
      
      const url = `${apiBaseUrl}/api/chat-requests?${urlParams.toString()}`;
      console.log('API URL:', url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${finalBackendApiKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `Server returned ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('API Response:', result);
      
      if (result.success) {
        const sortedData = (result.data || []).sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        // ✅ Check if count is 0 and show page not found
        if (sortedData.length === 0) {
          setError(`📭 No chat requests found for this APP ID. Please check if you have the correct APP ID.`);
          setChatRequests([]);
          setConnectionStatus('no_data');
        } else {
          setChatRequests(sortedData);
          setConnectionStatus('connected');
        }
      } else {
        throw new Error(result.message || 'API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Error fetching chat requests:', error);
      
      let errorMessage = 'Failed to load chat requests. ';
      
      if (error.name === 'AbortError') {
        errorMessage += 'Request timeout. Please check your network connection.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage += 'Network error. Please check:';
        errorMessage += '\n• Backend server is running';
        errorMessage += '\n• CORS is configured';
        errorMessage += '\n• API URL is correct: ' + apiBaseUrl;
      } else {
        errorMessage += error.message;
      }
      
      setError(errorMessage);
      setChatRequests([]);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (requestId, newStatus) => {
    try {
      setError('');
      
      console.log('Updating status for:', requestId, 'to:', newStatus);
      
      const url = `${apiBaseUrl}/api/chat-requests/${requestId}/status`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${finalBackendApiKey}`
        },
        body: JSON.stringify({ status: newStatus }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `Server returned ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Update result:', result);
      
      if (result.success) {
        const updatedRequest = result.data;
        
        setChatRequests(prev => 
          prev.map(req => 
            req.id === requestId ? updatedRequest : req
          ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        );
        
        if (selectedRequest && selectedRequest.id === requestId) {
          setSelectedRequest(updatedRequest);
        }
        
        setError('');
       
      } else {
        throw new Error(result.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMsg = `Failed to update status: ${error.message}`;
      setError(errorMsg);
      alert(errorMsg);
    }
  };

  const deleteChatRequest = async (requestId) => {
    if (!confirm('Are you sure you want to delete this chat request? This action cannot be undone.')) {
      return;
    }

    try {
      setError('');
      
      const url = `${apiBaseUrl}/api/chat-requests/${requestId}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${finalBackendApiKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `Server returned ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (result.success) {
        setChatRequests(prev => prev.filter(req => req.id !== requestId));
        
        if (selectedRequest && selectedRequest.id === requestId) {
          setSelectedRequest(null);
        }
        
    
      } else {
        throw new Error(result.message || 'Failed to delete request');
      }
    } catch (error) {
      console.error('Error deleting chat request:', error);
      const errorMsg = `Failed to delete request: ${error.message}`;
      setError(errorMsg);
      alert(errorMsg);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      console.log('🚀 Initializing Admin Chat Requests...');
      console.log('API Base URL:', apiBaseUrl);
      console.log('Backend APP ID from URL:', finalBackendApiKey);
      
      await fetchChatRequests();
    };

    initializeData();
  }, [finalBackendApiKey, apiBaseUrl]);

  const filteredRequests = chatRequests.filter(request => {
    const matchesFilter = filter === 'all' || request.status === filter;
    
    if (searchTerm === '') return matchesFilter;
    
    const searchLower = searchTerm.toLowerCase();
    
    return (
      request.id.toLowerCase().includes(searchLower) ||
      (request.websiteId && request.websiteId.toLowerCase().includes(searchLower)) ||
      (request.backendApiKey && request.backendApiKey.toLowerCase().includes(searchLower)) ||
      (request.collectedData && 
        JSON.stringify(request.collectedData).toLowerCase().includes(searchLower)) ||
      (request.status && request.status.toLowerCase().includes(searchLower))
    );
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffa726';
      case 'confirmed': return '#66bb6a';
      case 'cancelled': return '#ef5350';
      case 'completed': return '#42a5f5';
      default: return '#9e9e9e';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return { text: '🟢 Connected', color: '#66bb6a' };
      case 'checking': return { text: '🟡 Checking...', color: '#ffa726' };
      case 'timeout': return { text: '🔴 Timeout', color: '#ef5350' };
      case 'error': return { text: '🔴 Error', color: '#ef5350' };
      case 'no_data': return { text: '🟠 No Data', color: '#ff9800' };
      default: return { text: '⚪ Unknown', color: '#9e9e9e' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusCount = (status) => {
    return chatRequests.filter(req => req.status === status).length;
  };

  const connectionStatusInfo = getConnectionStatusText();

  // ✅ Loading State
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading chat requests...</p>
        <p className={styles.connectionStatus} style={{ color: connectionStatusInfo.color }}>
          {connectionStatusInfo.text}
        </p>
        <div className={styles.loadingDetails}>
          <p>API: {apiBaseUrl}</p>
          <p>Key: {finalBackendApiKey ? `***${finalBackendApiKey.slice(-4)}` : 'Not provided'}</p>
          {!finalBackendApiKey && (
            <p className={styles.errorText}>Error: Backend APP ID is required in URL</p>
          )}
        </div>
      </div>
    );
  }

  // ✅ Page Not Found State - No chat requests
  if (!loading && chatRequests.length === 0 && connectionStatus === 'no_data') {
    return (
      <div className={styles.notFoundContainer}>
        <div className={styles.notFoundContent}>
          <div className={styles.notFoundIcon}>📭</div>
          <h1>No Chat Requests Found</h1>
          <p className={styles.notFoundMessage}>
            No chat requests were found for the provided APP ID. Please check if you have the correct APP ID.
          </p>
          <div className={styles.notFoundDetails}>
            <p><strong>APP ID:</strong> {finalBackendApiKey ? `***${finalBackendApiKey.slice(-4)}` : 'Not provided'}</p>
            <p><strong>API URL:</strong> {apiBaseUrl}</p>
            <p><strong>Status:</strong> <span style={{ color: connectionStatusInfo.color }}>{connectionStatusInfo.text}</span></p>
          </div>
          <div className={styles.notFoundActions}>
            <button 
              onClick={fetchChatRequests}
              className={styles.retryButton}
            >
              🔄 Try Again
            </button>
            <button 
              onClick={goToAdminPanel}
              className={styles.adminButton}
            >
              ⚙️ Go to Admin Panel
            </button>
       
          </div>
          <div className={styles.troubleshooting}>
            <h3>💡 Troubleshooting Tips:</h3>
            <ul>
              <li>Make sure you have the correct APP ID</li>
              <li>Check if chat requests have been created with this APP ID</li>
              <li>Verify that the backend server is running properly</li>
              <li>Ensure the APP ID has proper permissions</li>
              <li>Try creating a new chat request using the chat widget</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Main Content - Only show if there are chat requests
  return (
    <div className={styles.adminContainer}>
      <div className={styles.header}>
        <div className={styles.smallheader}>
          <h1>Chat Requests Management</h1>
          <button 
            onClick={goToAdminPanel}
            className={styles.adminPanelButton}
          >
            Admin Panel
          </button>
        </div>
        <p>Manage and update customer chat requests</p>
        
        <div className={styles.apiStatus} style={{ borderLeftColor: connectionStatusInfo.color }}>
          <span className={styles.statusIndicator} style={{ color: connectionStatusInfo.color }}>
            {connectionStatusInfo.text}
          </span>
          <span>API: {apiBaseUrl}</span>
          <span className={styles.apiKeyInfo}>
            Key: {finalBackendApiKey ? `***${finalBackendApiKey.slice(-4)}` : 'Not provided'}
          </span>
          {urlBackendApiKey && (
            <span className={styles.urlKeyInfo}>
              (From URL)
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <div className={styles.errorContent}>
            <div className={styles.errorMessage}>
              <strong>⚠️ {!finalBackendApiKey ? 'Missing APP ID' : 'Connection Issue'}</strong>
              <pre className={styles.errorDetails}>{error}</pre>
            </div>
            <div className={styles.errorActions}>
              {finalBackendApiKey && (
                <button onClick={fetchChatRequests} className={styles.retryButton}>
                  🔄 Retry Connection
                </button>
              )}
              <button 
                onClick={() => {
                  console.log('Current state:', {
                    apiBaseUrl,
                    finalBackendApiKey: finalBackendApiKey ? `***${finalBackendApiKey.slice(-4)}` : 'missing',
                    urlBackendApiKey,
                    chatRequestsCount: chatRequests.length,
                    connectionStatus
                  });
                }}
                className={styles.debugButton}
              >
                🔍 Debug Info
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <h3>Total</h3>
          <span className={styles.statNumber}>{chatRequests.length}</span>
        </div>
        <div className={styles.statCard}>
          <h3>Pending</h3>
          <span className={styles.statNumber} style={{ color: '#ffa726' }}>
            {getStatusCount('pending')}
          </span>
        </div>
        <div className={styles.statCard}>
          <h3>Confirmed</h3>
          <span className={styles.statNumber} style={{ color: '#66bb6a' }}>
            {getStatusCount('confirmed')}
          </span>
        </div>
        <div className={styles.statCard}>
          <h3>Cancelled</h3>
          <span className={styles.statNumber} style={{ color: '#ef5350' }}>
            {getStatusCount('cancelled')}
          </span>
        </div>
        <div className={styles.statCard}>
          <h3>Completed</h3>
          <span className={styles.statNumber} style={{ color: '#42a5f5' }}>
            {getStatusCount('completed')}
          </span>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search by ID, website, APP ID, or data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterGroup}>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
          <button 
            onClick={fetchChatRequests}
            className={styles.refreshButton}
            disabled={loading}
          >
            {loading ? '🔄 Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.requestsList}>
          <div className={styles.listHeader}>
            <h3>Chat Requests ({filteredRequests.length})</h3>
            <span className={styles.listSubtitle}>
              Showing {filteredRequests.length} of {chatRequests.length} requests
              {finalBackendApiKey && ` for APP ID: ***${finalBackendApiKey.slice(-4)}`}
            </span>
          </div>
          
          {filteredRequests.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No chat requests found</p>
              {searchTerm || filter !== 'all' ? (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setFilter('all');
                  }}
                  className={styles.clearFiltersButton}
                >
                  Clear filters
                </button>
              ) : (
                <p className={styles.noDataMessage}>
                  {connectionStatus === 'connected' 
                    ? 'No chat requests available for this APP ID.' 
                    : 'Unable to load chat requests. Please check your connection.'}
                </p>
              )}
            </div>
          ) : (
            <div className={styles.requestsGrid}>
              {filteredRequests.map((request) => (
                <div 
                  key={request.id}
                  className={`${styles.requestCard} ${
                    selectedRequest?.id === request.id ? styles.selected : ''
                  }`}
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.requestId}>
                      #{request.id.slice(-8)}
                    </span>
                    <span 
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusColor(request.status) }}
                    >
                      {request.status}
                    </span>
                  </div>
                  
                  <div className={styles.cardContent}>
                    <div className={styles.websiteInfo}>
                      <strong>Website:</strong> {request.websiteId || 'N/A'}
                    </div>
                    {request.backendApiKey && (
                      <div className={styles.apiKeyInfo}>
                        <strong>APP ID:</strong> ***{request.backendApiKey.slice(-4)}
                      </div>
                    )}
                    <div className={styles.dataPreview}>
                      {request.collectedData && Object.entries(request.collectedData).slice(0, 2).map(([key, value]) => (
                        <div key={key} className={styles.dataItem}>
                          <strong>{key}:</strong> {String(value).slice(0, 30)}
                          {String(value).length > 30 ? '...' : ''}
                        </div>
                      ))}
                      {request.collectedData && Object.keys(request.collectedData).length > 2 && (
                        <div className={styles.moreItems}>
                          +{Object.keys(request.collectedData).length - 2} more fields
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className={styles.cardFooter}>
                    <span className={styles.date}>
                      {formatDate(request.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.detailsPanel}>
          {selectedRequest ? (
            <div className={styles.detailsContent}>
              <div className={styles.detailsHeader}>
                <h3>Request Details</h3>
                <div className={styles.detailsActions}>
                  <button 
                    onClick={() => deleteChatRequest(selectedRequest.id)}
                    className={styles.deleteButton}
                    title="Delete this request"
                  >
                    🗑️ Delete
                  </button>
                  <button 
                    onClick={() => setSelectedRequest(null)}
                    className={styles.closeButton}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className={styles.detailsSection}>
                <h4>Basic Information</h4>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <label>Request ID:</label>
                    <span className={styles.idValue}>{selectedRequest.id}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Website ID:</label>
                    <span>{selectedRequest.websiteId || 'N/A'}</span>
                  </div>
                  {selectedRequest.backendApiKey && (
                    <div className={styles.infoItem}>
                      <label>APP ID:</label>
                      <span className={styles.apiKeyValue}>
                        ***{selectedRequest.backendApiKey.slice(-4)}
                      </span>
                    </div>
                  )}
                  <div className={styles.infoItem}>
                    <label>Type:</label>
                    <span>{selectedRequest.type || 'chat-request'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Created:</label>
                    <span>{formatDate(selectedRequest.createdAt)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Updated:</label>
                    <span>{formatDate(selectedRequest.updatedAt)}</span>
                  </div>
                </div>
              </div>

              <div className={styles.detailsSection}>
                <h4>Status Management</h4>
                <div className={styles.statusControl}>
                  <label>Current Status:</label>
                  <div className={styles.statusSelectContainer}>
                    <select 
                      value={selectedRequest.status}
                      onChange={(e) => updateStatus(selectedRequest.id, e.target.value)}
                      className={styles.statusSelect}
                      style={{ borderColor: getStatusColor(selectedRequest.status) }}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                    <div 
                      className={styles.statusIndicator}
                      style={{ backgroundColor: getStatusColor(selectedRequest.status) }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className={styles.detailsSection}>
                <div className={styles.sectionHeader}>
                  <h4>Collected Data</h4>
                  <span className={styles.dataCount}>
                    {selectedRequest.collectedData ? Object.keys(selectedRequest.collectedData).length : 0} fields
                  </span>
                </div>
                <div className={styles.dataGrid}>
                  {selectedRequest.collectedData ? (
                    Object.entries(selectedRequest.collectedData).map(([key, value]) => (
                      <div key={key} className={styles.dataField}>
                        <label>{key}:</label>
                        <div className={styles.dataValue}>
                          {value ? String(value) : <em className={styles.emptyValue}>Empty</em>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.noData}>
                      No data collected for this request
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.actionButtons}>
                <button 
                  onClick={() => updateStatus(selectedRequest.id, 'confirmed')}
                  className={styles.confirmButton}
                  disabled={selectedRequest.status === 'confirmed'}
                >
                  ✅ Confirm Request
                </button>
                <button 
                  onClick={() => updateStatus(selectedRequest.id, 'cancelled')}
                  className={styles.cancelButton}
                  disabled={selectedRequest.status === 'cancelled'}
                >
                  ❌ Cancel Request
                </button>
                <button 
                  onClick={() => updateStatus(selectedRequest.id, 'completed')}
                  className={styles.completeButton}
                  disabled={selectedRequest.status === 'completed'}
                >
                  ✅ Mark Complete
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.noSelection}>
              <div className={styles.noSelectionContent}>
                <h3>Select a Request</h3>
                <p>Click on a chat request from the list to view details and update status</p>
                <div className={styles.noSelectionTips}>
                  <div className={styles.tip}>
                    <strong>💡 Tip:</strong> Use search to find specific requests
                  </div>
                  <div className={styles.tip}>
                    <strong>💡 Tip:</strong> Filter by status to focus on specific types
                  </div>
                  <div className={styles.tip}>
                    <strong>🔑 APP ID:</strong> Currently using: {finalBackendApiKey ? `***${finalBackendApiKey.slice(-4)}` : 'All requests'}
                  </div>
                  {urlBackendApiKey && (
                    <div className={styles.tip}>
                      <strong>🌐 Source:</strong> APP ID from URL parameter
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatRequests;