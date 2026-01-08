import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next'; // Added hook
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MessageSquare, Send, Plus, Search, MoreVertical, Paperclip, Trash2, Archive, X } from 'lucide-react';
import { cn } from "../lib/utils";

const MessagesPage = () => {
    const { t } = useTranslation(); // Init hook
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showArchived, setShowArchived] = useState(false);

    // File Upload State
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    // New Chat Modal State
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const messagesEndRef = useRef(null);
    // Safe check for token existence before parsing
    const token = localStorage.getItem('token');
    const currentUser = token ? JSON.parse(atob(token.split('.')[1])) : { id: 0 };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        fetchConversations();
    }, [showArchived]); // Refetch when filter changes

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.id);
            const interval = setInterval(() => fetchMessages(activeConversation.id), 5000);
            return () => clearInterval(interval);
        }
    }, [activeConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchConversations = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/messages/conversations?archived=${showArchived}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch conversations", error);
        }
    };

    const fetchMessages = async (convId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/messages/${convId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data);
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !activeConversation) return;

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('content', newMessage);
            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };

            await axios.post(`http://localhost:5000/api/messages/${activeConversation.id}`, formData, config);

            setNewMessage('');
            setSelectedFile(null);
            fetchMessages(activeConversation.id);
            fetchConversations();
        } catch (error) {
            alert('Failed to send message');
        }
    };

    const downloadFile = async (url, filename) => {
        try {
            const response = await axios.get(`http://localhost:5000${url}`, {
                responseType: 'blob',
            });
            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Download failed", error);
            // Fallback to opening in new tab
            window.open(`http://localhost:5000${url}`, '_blank');
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!confirm(t('messages.confirm_delete'))) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/messages/${messageId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchMessages(activeConversation.id);
        } catch (error) {
            alert("Failed to delete message");
        }
    };

    const handleArchiveConversation = async (convId, archive) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/messages/conversations/${convId}/archive`, { archive }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchConversations();
            if (activeConversation?.id === convId) setActiveConversation(null);
        } catch (error) {
            alert("Failed to action");
        }
    };

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/employees', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmployees(res.data);
        } catch (error) {
            console.error("Failed to fetch employees", error);
        }
    };

    const openNewChatModal = () => {
        setShowNewChatModal(true);
        fetchEmployees();
    };

    const startNewChat = async (recipientId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/messages/conversations', { recipientId }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await fetchConversations();
            const newConvId = res.data.id;
            setShowNewChatModal(false);

            const updatedList = await axios.get(`http://localhost:5000/api/messages/conversations?archived=${showArchived}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(updatedList.data);
            const createdConv = updatedList.data.find(c => c.id === newConvId);
            if (createdConv) setActiveConversation(createdConv);

        } catch (error) {
            console.error("Failed to start chat", error);
            alert("Could not start chat");
        }
    };

    const filteredEmployees = employees.filter(emp =>
        (emp.first_name + ' ' + emp.last_name).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <div className="flex h-[calc(100vh-100px)] gap-6">
                {/* Sidebar */}
                <Card className="w-1/3 flex flex-col p-0 overflow-hidden">
                    <div className="p-4 border-b border-secondary-100 bg-secondary-50">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="font-bold text-lg text-secondary-900">{t('messages.title')}</h2>
                            <Button size="sm" icon={Plus} onClick={openNewChatModal}></Button>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowArchived(false)}
                                className={cn("flex-1 py-1 text-xs rounded font-medium transition-colors", !showArchived ? "bg-white shadow text-secondary-900" : "text-secondary-500 hover:bg-secondary-100")}
                            >
                                {t('messages.active')}
                            </button>
                            <button
                                onClick={() => setShowArchived(true)}
                                className={cn("flex-1 py-1 text-xs rounded font-medium transition-colors", showArchived ? "bg-white shadow text-secondary-900" : "text-secondary-500 hover:bg-secondary-100")}
                            >
                                {t('messages.archived')}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <p className="p-4 text-center text-secondary-500">{t('messages.loading')}</p>
                        ) : conversations.length === 0 ? (
                            <p className="p-8 text-center text-secondary-500 text-sm">{showArchived ? t('messages.no_archived') : t('messages.no_active')}</p>
                        ) : (
                            conversations.map(conv => (
                                <div
                                    key={conv.id}
                                    onClick={() => setActiveConversation(conv)}
                                    className={cn(
                                        "p-4 border-b border-secondary-50 cursor-pointer hover:bg-secondary-50 transition-colors flex items-center gap-3 group",
                                        activeConversation?.id === conv.id ? "bg-primary-50 border-l-4 border-l-primary-600" : ""
                                    )}
                                >
                                    <div className="w-10 h-10 rounded-full bg-secondary-200 flex items-center justify-center text-secondary-600 font-bold">
                                        {conv.name ? conv.name[0] : '#'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="font-semibold text-secondary-900 truncate">{conv.name || 'Unknown'}</h3>
                                            {conv.last_message_time && (
                                                <span className="text-xs text-secondary-400">
                                                    {new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-secondary-500 truncate">
                                            {conv.last_message_content || <span className="italic">No messages yet</span>}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleArchiveConversation(conv.id, !showArchived); }}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-secondary-400 hover:text-secondary-600"
                                        title={showArchived ? "Unarchive" : "Archive"}
                                    >
                                        <Archive className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Chat Area */}
                <Card className="flex-1 flex flex-col p-0 overflow-hidden">
                    {activeConversation ? (
                        <>
                            <div className="p-4 border-b border-secondary-100 flex justify-between items-center bg-white shadow-sm z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                                        {activeConversation.name ? activeConversation.name[0] : '?'}
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-secondary-900">{activeConversation.name}</h2>
                                        {showArchived && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{t('messages.archived_badge')}</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleArchiveConversation(activeConversation.id, !showArchived)}
                                        className="p-2 hover:bg-secondary-100 rounded text-secondary-500"
                                        title={showArchived ? "Unarchive" : "Archive"}
                                    >
                                        <Archive className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary-50/30">
                                {messages.map((msg, idx) => {
                                    const isMe = msg.sender_id === currentUser.id;
                                    const isDeleted = msg.is_deleted;
                                    return (
                                        <div key={msg.id} className={cn("flex group", isMe ? "justify-end" : "justify-start")}>
                                            <div className="flex items-end gap-2 max-w-[70%]">
                                                {/* Delete Button (Left for Me) */}
                                                {isMe && !isDeleted && (
                                                    <button
                                                        onClick={() => handleDeleteMessage(msg.id)}
                                                        className="opacity-0 group-hover:opacity-100 bg-white p-1 rounded-full shadow-sm text-red-400 hover:text-red-600 border border-secondary-200 transition-opacity"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                )}

                                                <div className={cn(
                                                    "rounded-2xl px-4 py-3 shadow-sm",
                                                    isMe
                                                        ? "bg-primary-600 text-white rounded-br-none"
                                                        : "bg-white text-secondary-900 border border-secondary-100 rounded-bl-none",
                                                    isDeleted && "bg-secondary-100 text-secondary-500 italic"
                                                )}>
                                                    {!isMe && !isDeleted && <p className="text-xs font-semibold text-secondary-400 mb-1">{msg.first_name}</p>}

                                                    {isDeleted ? (
                                                        <p className="text-sm">🚫 {t('messages.deleted_msg') || 'This message was deleted'}</p>
                                                    ) : (
                                                        <>
                                                            {msg.attachment_url && (
                                                                <div className="mb-2">
                                                                    {msg.attachment_type?.startsWith('image/') ? (
                                                                        <div className="relative group/img">
                                                                            <img
                                                                                src={`http://localhost:5000${msg.attachment_url}`}
                                                                                alt="Image Attachment"
                                                                                className="max-w-[250px] max-h-[250px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity bg-secondary-100 min-w-[100px] min-h-[100px] object-cover"
                                                                                onClick={() => window.open(`http://localhost:5000${msg.attachment_url}`, '_blank')}
                                                                                onError={(e) => {
                                                                                    e.target.style.display = 'none'; // Hide if broken
                                                                                }}
                                                                            />
                                                                            {/* Download overlay */}
                                                                            <button
                                                                                onClick={() => downloadFile(msg.attachment_url, `image-${msg.id}`)}
                                                                                className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                                                title={t('messages.download')}
                                                                            >
                                                                                <Paperclip className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => downloadFile(msg.attachment_url, `file-${msg.id}`)}
                                                                            className="flex items-center gap-2 bg-black/5 hover:bg-black/10 p-3 rounded-lg text-sm text-secondary-700 w-full transition-colors border border-secondary-200"
                                                                        >
                                                                            <div className="bg-white p-2 rounded-full shadow-sm">
                                                                                <Paperclip className="w-4 h-4 text-primary-600" />
                                                                            </div>
                                                                            <span className="truncate flex-1 text-left">{t('messages.download')}</span>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {/* Only show content if it's NOT just the placeholder */}
                                                            {msg.content && msg.content !== '📎 Attachment' && (
                                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                            )}
                                                        </>
                                                    )}

                                                    <p className={cn("text-[10px] mt-1 text-right opacity-70", isMe ? "text-primary-100" : "text-secondary-400")}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-4 bg-white border-t border-secondary-100">
                                {/* File Preview */}
                                {selectedFile && (
                                    <div className="flex items-center gap-2 mb-2 p-2 bg-secondary-50 rounded-lg border border-secondary-200 w-fit">
                                        <span className="text-xs text-secondary-600 truncate max-w-[200px]">{selectedFile.name}</span>
                                        <button onClick={() => setSelectedFile(null)} className="text-secondary-400 hover:text-red-500">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 text-secondary-400 hover:text-primary-600 transition-colors"
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={(e) => setSelectedFile(e.target.files[0])}
                                    />

                                    <input
                                        type="text"
                                        className="flex-1 input-field bg-secondary-50 border-0 focus:ring-2 ring-primary-100 px-4 rounded-full"
                                        placeholder={t('messages.type_message')}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        autoFocus
                                    />
                                    <Button type="submit" size="icon" className="rounded-full w-10 h-10 flex items-center justify-center pl-1">
                                        <Send className="w-5 h-5" />
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-secondary-400 p-8">
                            <div className="w-20 h-20 bg-secondary-50 rounded-full flex items-center justify-center mb-4">
                                <MessageSquare className="w-10 h-10 opacity-50" />
                            </div>
                            <h3 className="text-lg font-semibold text-secondary-600">{t('messages.your_messages')}</h3>
                            <p className="max-w-xs mt-2">{t('messages.select_conv')}</p>
                            <Button className="mt-6" onClick={openNewChatModal} icon={Plus}>{t('messages.start_chat')}</Button>
                            {showArchived && <p className="mt-4 text-xs text-amber-600">({t('messages.viewing_archived')})</p>}
                        </div>
                    )}
                </Card>

                {/* New Chat Modal */}
                {showNewChatModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
                        <Card className="w-full max-w-md mx-4 h-[500px] flex flex-col p-0 overflow-hidden">
                            <div className="p-4 border-b border-secondary-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg">{t('messages.new_message')}</h3>
                                <button onClick={() => setShowNewChatModal(false)} className="text-secondary-400 hover:text-secondary-600">✕</button>
                            </div>
                            <div className="p-3 border-b border-secondary-100">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-secondary-400" />
                                    <input
                                        type="text"
                                        placeholder={t('messages.search_people')}
                                        className="w-full pl-9 py-2 bg-secondary-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-primary-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2">
                                {filteredEmployees.length === 0 ? (
                                    <p className="text-center text-secondary-500 py-8 text-sm">{t('messages.no_employees')}</p>
                                ) : (
                                    filteredEmployees.map(emp => (
                                        <div
                                            key={emp.id}
                                            onClick={() => startNewChat(emp.id)}
                                            className="p-3 hover:bg-secondary-50 rounded-lg cursor-pointer flex items-center gap-3 transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                                {emp.first_name[0]}{emp.last_name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-secondary-900">{emp.first_name} {emp.last_name}</p>
                                                <p className="text-xs text-secondary-500">{emp.job_title || 'Employee'}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default MessagesPage;
