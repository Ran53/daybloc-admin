import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { Moon, Sun, LogOut, Send, User, Info, X, Copy, Smartphone, CreditCard, Trash2, ArrowLeft } from 'lucide-react'
import './App.css'

const firebaseConfig = {
  apiKey: "AIzaSyD_VU2rmgNCbBKet0tvdVOQvFmyEYBoKPQ",
  authDomain: "penzen-prj.firebaseapp.com",
  projectId: "penzen-prj",
  storageBucket: "penzen-prj.firebasestorage.app",
  messagingSenderId: "961311504951",
  appId: "1:961311504951:android:afb790734f0dd45ba91db2"
};

const firebaseApp = initializeApp(firebaseConfig);

function App() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('dayblocapp@gmail.com')
  const [password, setPassword] = useState('admin@53101')
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const [showInfo, setShowInfo] = useState(false)
  // Replace the current unreadRooms state with this:
  const [unreadRooms, setUnreadRooms] = useState(() => {
    const saved = localStorage.getItem('daybloc_unread_rooms');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const messagesEndRef = useRef(null)
  const selectedRoomRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    document.body.className = isDark ? 'dark' : 'light'
  }, [isDark])

    useEffect(() => {
    // Save unread rooms to localStorage whenever it changes
    localStorage.setItem('daybloc_unread_rooms', JSON.stringify(Array.from(unreadRooms)));
  }, [unreadRooms]);

  useEffect(() => {
    if (!session) return
    fetchRooms()
  }, [session])

  useEffect(() => {
    if (!session) return;

    const setupWebPush = async () => {
      try {
        const messaging = getMessaging(firebaseApp);
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const currentToken = await getToken(messaging, { 
            vapidKey: 'BMdo7-8Mh82Rv1UiYG8oyeLFbVP-wNz3FSd2xoOy4o0qxpNLCQ6mMIEYrD8U5DUwj8JYnFkI6gJxs738eX8nubo' 
          });

          if (currentToken) {
            await supabase.from('fcm_tokens').upsert({
              user_id: session.user.id,
              token: currentToken,
              platform: 'web'
            }, { onConflict: 'user_id, token' });
          }
        }
      } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
      }
    };

    setupWebPush();

    const messaging = getMessaging(firebaseApp);
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground push notification:", payload);
    });

    return () => unsubscribe();
  }, [session]);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .order('last_message_at', { ascending: false })
    if (error) console.error(error)
    else setRooms(data)
  }

  const loadMessages = async (roomId) => {
    setSelectedRoom(roomId)
    selectedRoomRef.current = roomId;
    
    setUnreadRooms((prev) => {
      const next = new Set(prev);
      next.delete(roomId);
      return next;
    });

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
    if (error) console.error(error)
    else {
      setMessages(data)
      scrollToBottom()
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('all-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMsg = payload.new;
          const currentActiveRoom = selectedRoomRef.current;
          
          if (newMsg.room_id === currentActiveRoom) {
            setMessages((prev) => [...prev, newMsg]);
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 100);
          } 
          
          if (newMsg.sender_role === 'user' && newMsg.room_id !== currentActiveRoom) {
            setUnreadRooms((prev) => new Set(prev).add(newMsg.room_id));
          }
          
          fetchRooms();
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [session])

  const sendReply = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedRoom) return
    const { error } = await supabase.from('chat_messages').insert({
      room_id: selectedRoom,
      sender_id: session.user.id,
      sender_role: 'developer',
      content: newMessage.trim(),
    })
    if (error) alert(error.message)
    else {
      setNewMessage('')
      await supabase.from('chat_rooms').update({ last_message_at: new Date().toISOString() }).eq('id', selectedRoom)
      fetchRooms()
    }
  }

    const handleDeleteRoom = async (e) => {
    e.stopPropagation(); // Prevent the Info modal from opening
    
    if (!window.confirm("Are you sure you want to resolve this chat? All messages will be permanently deleted.")) {
      return;
    }

    const { error } = await supabase.from('chat_rooms').delete().eq('id', selectedRoom);

    if (error) {
      alert(error.message);
    } else {
      // 1. Remove from sidebar
      setRooms((prev) => prev.filter((r) => r.id !== selectedRoom));
      
      // 2. Clear active chat
      setSelectedRoom(null);
      setMessages([]);
      
      // 3. Remove unread badge if it existed
      setUnreadRooms((prev) => {
        const next = new Set(prev);
        next.delete(selectedRoom);
        return next;
      });
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
    setLoading(false)
  }

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  // ✅ NEW: Helper function to render messages with Date Dividers
  const renderMessagesWithDividers = () => {
    if (!messages || messages.length === 0) return null;

    const elements = [];
    let previousDateStr = null;

    messages.forEach((msg, index) => {
      const msgDate = new Date(msg.created_at);
      const dateStr = msgDate.toDateString(); // e.g., "Mon Oct 24 2023"

      // If the day changes, insert a divider
      if (dateStr !== previousDateStr) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let dateText = '';
        if (dateStr === today.toDateString()) {
          dateText = 'Today';
        } else if (dateStr === yesterday.toDateString()) {
          dateText = 'Yesterday';
        } else {
          dateText = msgDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }

        elements.push(
          <div key={`date-divider-${dateStr}`} className="date-divider">
            <span>{dateText}</span>
          </div>
        );

        previousDateStr = dateStr;
      }

      const isDev = msg.sender_role === 'developer';
      elements.push(
        <div key={msg.id} className={`message-row ${isDev ? 'dev' : 'user'}`}>
          {!isDev && <div className="avatar-small"><User size={14} /></div>}
          <div className="message-content">
            <div className="bubble">{msg.content}</div>
            <div className="timestamp">{formatTime(msg.created_at)}</div>
          </div>
        </div>
      );
    });

    return elements;
  };

  if (!session) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <h2>DayBloc Admin</h2>
          <p className="subtitle">Sign in to manage developer chats</p>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
          </form>
        </div>
      </div>
    )
  }

  const activeRoomData = rooms.find(r => r.id === selectedRoom)

  return (
    <div className={`app-container ${selectedRoom ? 'mobile-chat-open' : ''}`}>
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <h3>Conversations</h3>

          </div>
          <div className="header-actions">
            <button className="icon-btn" onClick={() => setIsDark(!isDark)} title="Toggle Theme">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
                        <button 
              className="icon-btn logout" 
              onClick={() => {
                localStorage.removeItem('daybloc_unread_rooms');
                supabase.auth.signOut();
              }} 
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
        
        <div className="room-list">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`room-item ${selectedRoom === room.id ? 'active' : ''}`}
              onClick={() => loadMessages(room.id)}
            >
              <div className="avatar">
                <User size={20} />
              </div>
              <div className="room-info">
                <div className="room-name">
                  {room.username || 'Anonymous User'}
                  {unreadRooms.has(room.id) && <span className="unread-dot" />}
                </div>
                <div className="room-preview">
                  {room.revenuecat_id ? `RC: ${room.revenuecat_id.split('_').pop().substring(0,8)}...` : 'No RC ID'}
                </div>
              </div>
            </div>
          ))}
          {rooms.length === 0 && <p className="empty-state">No conversations yet</p>}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {selectedRoom ? (
          <>
                                   <div className="chat-header">
              {/* ✅ MOBILE BACK BUTTON */}
              <button 
                className="icon-btn mobile-back-btn" 
                onClick={() => {
                  setSelectedRoom(null);
                  setMessages([]);
                  selectedRoomRef.current = null;
                }}
              >
                <ArrowLeft size={20} />
              </button>

              <div 
                className="chat-header-info" 
                onClick={() => setShowInfo(true)} 
                title="Click to view user details"
                style={{ flex: 1, cursor: 'pointer', minWidth: 0 }}
              >
                <h3>{activeRoomData?.username || 'Anonymous User'} <Info size={14} className="info-icon" /></h3>
                <span className="device-id">Device: {activeRoomData?.device_id}</span>
              </div>
              
              <button 
                className="icon-btn delete-btn" 
                onClick={handleDeleteRoom} 
                title="Resolve & Delete Chat"
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="messages-container">
              {/* ✅ USE THE NEW HELPER FUNCTION HERE */}
              {renderMessagesWithDividers()}
              <div ref={messagesEndRef} />
            </div>

            <form className="reply-form" onSubmit={sendReply}>
              <input
                type="text"
                placeholder="Type your reply..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                autoFocus
              />
              <button type="submit" className="send-btn">
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="empty-chat">
            <div className="empty-chat-icon">
              <User size={48} opacity={0.2} />
            </div>
            <h3>Select a conversation</h3>
            <p>Choose a user from the sidebar to start chatting.</p>
          </div>
        )}
      </div>

      {/* --- USER INFO MODAL --- */}
      {showInfo && activeRoomData && (
        <div className="modal-overlay" onClick={() => setShowInfo(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Details</h2>
              <button className="icon-btn" onClick={() => setShowInfo(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="info-group">
                <label>Username</label>
                <div className="info-value">
                  <User size={16} className="info-icon-left" />
                  <span>{activeRoomData.username || 'Not provided'}</span>
                </div>
              </div>

              <div className="info-group">
                <label>Device ID</label>
                <div className="info-value clickable" onClick={() => copyToClipboard(activeRoomData.device_id)}>
                  <Smartphone size={16} className="info-icon-left" />
                  <span className="mono">{activeRoomData.device_id || 'Not provided'}</span>
                  <Copy size={14} className="copy-icon" />
                </div>
              </div>

              <div className="info-group">
                <label>RevenueCat ID</label>
                <div className="info-value clickable" onClick={() => copyToClipboard(activeRoomData.revenuecat_id)}>
                  <CreditCard size={16} className="info-icon-left" />
                  <span className="mono">{activeRoomData.revenuecat_id || 'Not provided'}</span>
                  <Copy size={14} className="copy-icon" />
                </div>
              </div>
              
              <div className="info-group">
                <label>First Contact</label>
                <div className="info-value">
                  <span>{new Date(activeRoomData.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App