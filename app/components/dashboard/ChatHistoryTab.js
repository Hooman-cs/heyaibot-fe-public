import { useState, useEffect } from "react";
import config from "../utils/config";

export default function ChatHistoryTab({ bots }) {
  const [activeBotKey, setActiveBotKey] = useState(bots.length > 0 ? bots[0].apiKey : null);
  
  // Chat List State
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const chatsPerPage = 15;

  // Selected Chat Messages State
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatDetails, setChatDetails] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Sync state if bots prop loads late
  useEffect(() => {
    if (!activeBotKey && bots.length > 0) setActiveBotKey(bots[0].apiKey);
  }, [bots, activeBotKey]);

  // Fetch Chat List
  useEffect(() => {
    if (!activeBotKey) return;
    setLoadingChats(true);
    setSelectedChat(null);
    setChatDetails(null);
    
    fetch(`${config.apiBaseUrl}/api/chats/apikey/${activeBotKey}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          // Sort newest chats first
          const sortedChats = data.data.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          setChats(sortedChats);
        } else {
          setChats([]);
        }
        setLoadingChats(false);
      })
      .catch(() => {
        setChats([]);
        setLoadingChats(false);
      });
  }, [activeBotKey]);

  // Fetch Specific Chat Messages
  useEffect(() => {
    if (!selectedChat) return;
    setLoadingMessages(true);

    fetch(`${config.apiBaseUrl}/api/chats/${selectedChat.chatId}/messages`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setChatDetails(data.data);
        } else {
          setChatDetails(null);
        }
        setLoadingMessages(false);
      })
      .catch(() => {
        setChatDetails(null);
        setLoadingMessages(false);
      });
  }, [selectedChat]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(chats.length / chatsPerPage));
  const currentChats = chats.slice((currentPage - 1) * chatsPerPage, currentPage * chatsPerPage);

  const formatTime = (timeValue) => {
    if (!timeValue) return "";
    try {
      return new Date(timeValue).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
      });
    } catch { return ""; }
  };

  if (bots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm border-dashed m-4">
        <div className="text-4xl mb-4">🤖</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">No Bots Found</h2>
        <p className="text-slate-500 text-center max-w-md">You need to create a bot in the Studio before you can view chat history.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[750px] max-h-[85vh]">
      
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT PANE: Chat List */}
        <div className={`w-full md:w-1/3 border-r border-slate-200 bg-white flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Bot Selector Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Bot</label>
            <select 
              value={activeBotKey || ""} 
              onChange={(e) => { setActiveBotKey(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 bg-white shadow-sm mb-2"
            >
              {bots.map(b => (
                <option key={b.apiKey} value={b.apiKey}>{b.websiteName}</option>
              ))}
            </select>
            
            <div className="inline-block bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-black tracking-wide">
              Total Chats: {chats.length}
            </div>
          </div>

          {/* List View */}
          <div className="flex-1 overflow-y-auto">
            {loadingChats ? (
              <div className="p-8 text-center text-slate-500 animate-pulse">Loading chats...</div>
            ) : chats.length === 0 ? (
              <div className="p-8 text-center text-slate-400 mt-10">
                <span className="text-3xl block mb-2">📭</span>
                No conversations yet.
              </div>
            ) : (
              currentChats.map((chat) => {
                const isSelected = selectedChat?.chatId === chat.chatId;
                const lastMsgText = chat.lastUserMessage?.text || chat.lastBotMessage?.text || "Started conversation...";
                
                // CREATE PROPER NAME
                const visitorName = `Visitor #${chat.chatId?.slice(-5).toUpperCase() || "0000"}`;

                return (
                  <div 
                    key={chat.chatId}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-4 sm:p-5 border-b border-slate-100 cursor-pointer transition-all ${isSelected ? 'bg-indigo-50/50 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      {/* UPDATED: Proper Name Display */}
                      <span className="font-bold text-slate-900 text-sm">{visitorName}</span>
                      <span className="text-[10px] font-bold text-slate-400">{formatTime(chat.createdAt)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center gap-2">
                      <div className="text-xs text-slate-500 truncate italic flex-1">"{lastMsgText}"</div>
                      {chat.totalMessages > 0 && (
                        <div className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded shrink-0">
                          {chat.totalMessages} msgs
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-slate-200 bg-slate-50 p-3 flex justify-between items-center shrink-0">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-white border border-slate-200 rounded text-sm text-slate-600 disabled:opacity-50">&larr;</button>
              <span className="text-xs font-bold text-slate-500">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 bg-white border border-slate-200 rounded text-sm text-slate-600 disabled:opacity-50">&rarr;</button>
            </div>
          )}
        </div>

        {/* RIGHT PANE: Messages View */}
        <div className={`w-full md:w-2/3 bg-slate-50 overflow-hidden flex-col relative ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
          {!selectedChat ? (
            <div className="m-auto flex flex-col items-center justify-center text-slate-400 p-10 text-center">
               <div className="text-6xl mb-4 opacity-50">💬</div>
               <h3 className="text-xl font-bold text-slate-600 mb-2">Select a Conversation</h3>
               <p>Click on a chat session from the list to view the full message history.</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-white border-b border-slate-200 p-4 shrink-0 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedChat(null)} className="md:hidden text-slate-500 hover:text-slate-800 bg-slate-100 p-1.5 rounded-lg">
                     &larr;
                  </button>
                  <div>
                    {/* UPDATED: Shows Visitor Name and Session ID in header */}
                    <h3 className="text-sm font-bold text-slate-900">
                      Visitor #{selectedChat.chatId?.slice(-5).toUpperCase() || "0000"}
                    </h3>
                    <div className="text-xs text-slate-400 font-mono">Session: {selectedChat.sessionId?.slice(0, 12)}...</div>
                  </div>
                </div>
                {chatDetails && (
                  <div className="hidden sm:flex gap-3 text-xs font-bold text-slate-500">
                    <span className="bg-slate-100 px-2 py-1 rounded-md">User Msgs: {chatDetails.totalUserMessages || 0}</span>
                    <span className="bg-slate-100 px-2 py-1 rounded-md">Bot Msgs: {chatDetails.totalBotMessages || 0}</span>
                    <span className="bg-slate-100 px-2 py-1 rounded-md">Tokens: {chatDetails.totalTokens || 0}</span>
                  </div>
                )}
              </div>

              {/* Chat Bubbles Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center items-center h-full text-slate-400 animate-pulse">Loading messages...</div>
                ) : !chatDetails || !chatDetails.messages || chatDetails.messages.length === 0 ? (
                  <div className="text-center text-slate-400 mt-10">No messages found in this chat.</div>
                ) : (
                  chatDetails.messages.map((msg, i) => {
                    const isBot = msg.role === 'bot' || msg.role === 'assistant';
                    
                    return (
                      <div key={i} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm ${
                          isBot ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm' : 'bg-indigo-600 text-white rounded-tr-sm'
                        }`}>
                          <div className="text-sm whitespace-pre-wrap">{msg.text}</div>
                          <div className={`text-[10px] mt-2 font-medium flex justify-between items-center ${isBot ? 'text-slate-400' : 'text-indigo-200'}`}>
                            <span>{formatTime(msg.time || msg.date)}</span>
                            {msg.tokens > 0 && <span>Tokens: {msg.tokens}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}