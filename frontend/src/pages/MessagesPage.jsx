
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import {
    Mail, Send, Archive, Trash2, Plus, Search, Paperclip,
    MoreVertical, ChevronLeft, Inbox, FileText, User, X,
    Reply, ReplyAll, Forward
} from 'lucide-react';
import { cn } from "../lib/utils";

const MessagesPage = () => {
    const { t } = useTranslation();
    const [activeFolder, setActiveFolder] = useState('inbox'); // 'inbox', 'sent', 'archive'
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);

    // New Message State
    const [showComposeModal, setShowComposeModal] = useState(false);
    const [composeParams, setComposeParams] = useState({ recipientId: '', subject: '', content: '' });
    const [employees, setEmployees] = useState([]);
    const [employeeSearch, setEmployeeSearch] = useState('');

    // File Upload
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const token = localStorage.getItem('token');
    const currentUser = token ? JSON.parse(atob(token.split('.')[1])) : { id: 0 };

    useEffect(() => {
        fetchConversations();
        fetchEmployees(); // Pre-fetch for compose
    }, []);

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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchConversations = async () => {
        setLoading(true);
        try {
            // We fetch ALL conversations (both archived and active) and filter client-side for "Sent" logic
            // But API requires archived flag. We might need to fetch both or just toggle.
            // For Outlook style, it's better to fetch everything or handle properly. 
            // Current backend: ?archived=true/false. 
            // Let's fetch active first, and if folder is archive, fetch archived.
            const isArchivedReq = activeFolder === 'archive';
            const res = await axios.get(`http://localhost:5000/api/messages/conversations?archived=${isArchivedReq}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch conversations", error);
            setLoading(false);
        }
    };

    // Re-fetch when folder changes (especially for archive toggle)
    useEffect(() => {
        setActiveConversation(null);
        fetchConversations();
    }, [activeFolder]);

    const fetchMessages = async (convId) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/messages/${convId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data);
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/employees', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmployees(res.data);
        } catch (error) { console.error(error); }
    };

    // --- Actions ---

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !activeConversation) return;

        try {
            const formData = new FormData();
            formData.append('content', newMessage);
            if (selectedFile) formData.append('file', selectedFile);

            await axios.post(`http://localhost:5000/api/messages/${activeConversation.id}`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });

            setNewMessage('');
            setSelectedFile(null);
            fetchMessages(activeConversation.id);
            // Update last message in list
            fetchConversations();
        } catch (error) {
            alert('Failed to send message');
        }
    };

    const handleComposeSend = async () => {
        if (!composeParams.recipientId) return alert("Please select a recipient");

        try {
            // 1. Start Conversation (or get existing)
            const res = await axios.post('http://localhost:5000/api/messages/conversations', {
                recipientId: composeParams.recipientId,
                subject: composeParams.subject
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const convId = res.data.id;

            // 2. Send Message if content exists OR file exists
            if (composeParams.content || composeParams.file) {
                const formData = new FormData();
                if (composeParams.content) formData.append('content', composeParams.content);
                if (composeParams.file) formData.append('file', composeParams.file);

                await axios.post(`http://localhost:5000/api/messages/${convId}`, formData, {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
            }

            setShowComposeModal(false);
            setComposeParams({ recipientId: '', subject: '', content: '' });
            setActiveFolder('inbox'); // Go to inbox
            fetchConversations();

        } catch (error) {
            console.error(error);
            alert("Failed to send message");
        }
    };

    const handleForward = (msg) => {
        setComposeParams({
            recipientId: '',
            subject: `Fwd: ${activeConversation.name || t('messages.no_subject')}`,
            content: `\n\n\n---------- Forwarded message ---------\nFrom: ${msg.first_name} ${msg.last_name}\nDate: ${new Date(msg.created_at).toLocaleString()}\nSubject: ${activeConversation.name}\n\n${msg.content}`
        });
        setShowComposeModal(true);
    };

    const handleDeleteMessage = async (msgId) => {
        if (!confirm(t('messages.confirm_delete'))) return;
        try {
            await axios.delete(`http://localhost:5000/api/messages/${msgId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchMessages(activeConversation.id);
        } catch (e) { alert("Failed to delete"); }
    };

    const handleArchive = async (convId, isArchiving) => {
        try {
            await axios.put(`http://localhost:5000/api/messages/conversations/${convId}/archive`, { archive: isArchiving }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchConversations();
            if (activeConversation?.id === convId) setActiveConversation(null);
        } catch (e) { alert("Failed to action"); }
    };

    // --- Filtering ---
    const getFilteredConversations = () => {
        if (activeFolder === 'sent') {
            // "Sent" logic: Last message was sent by ME.
            // Backend update added `last_message_sender_id`
            return conversations.filter(c => c.last_message_sender_id === currentUser.id);
        }
        if (activeFolder === 'inbox') {
            // Inbox: All active conversations (minus ones where I sent the LAST message? strictly? No, Outlook Inbox shows my replies too usually. 
            // But users often want "Sent" separate. Let's exclude "Sent" from Inbox? 
            // Standard email: Inbox = Received. Sent = Sent.
            // But this is chat. Let's just show ALL in Inbox for simplicity, filtering Sent only for "Sent" folder.
            return conversations;
        }
        return conversations; // Archive is handled by API param
    };

    const displayList = getFilteredConversations();

    const filteredEmployees = employees.filter(e =>
        (e.first_name + ' ' + e.last_name).toLowerCase().includes(employeeSearch.toLowerCase())
    );

    return (
        <Layout>
            <div className="flex h-[calc(100vh-80px)] bg-white rounded-lg shadow-sm border border-secondary-200 overflow-hidden">

                {/* 1. Left Sidebar (Navigation) */}
                <div className="w-64 bg-secondary-50 border-r border-secondary-200 flex flex-col p-4 gap-4">
                    <Button
                        onClick={() => setShowComposeModal(true)}
                        className="w-full justify-start gap-2 h-12 text-base font-semibold shadow-sm"
                    >
                        <Plus className="w-5 h-5" /> {t('messages.new_message') || "New Message"}
                    </Button>

                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveFolder('inbox')}
                            className={cn(
                                "w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors",
                                activeFolder === 'inbox' ? "bg-primary-100 text-primary-900" : "text-secondary-600 hover:bg-secondary-100"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Inbox className="w-4 h-4" />
                                {t('messages.inbox') || "Inbox"}
                            </div>
                            {activeFolder === 'inbox' && <span className="text-xs font-bold">{conversations.length}</span>}
                        </button>
                        <button
                            onClick={() => setActiveFolder('sent')}
                            className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors",
                                activeFolder === 'sent' ? "bg-primary-100 text-primary-900" : "text-secondary-600 hover:bg-secondary-100"
                            )}
                        >
                            <Send className="w-4 h-4" />
                            {t('messages.sent') || "Sent Items"}
                        </button>
                        <button
                            onClick={() => setActiveFolder('archive')}
                            className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors",
                                activeFolder === 'archive' ? "bg-primary-100 text-primary-900" : "text-secondary-600 hover:bg-secondary-100"
                            )}
                        >
                            <Archive className="w-4 h-4" />
                            {t('messages.archive') || "Archive"}
                        </button>
                    </nav>
                </div>

                {/* 2. Middle Column (Thread List) */}
                <div className="w-80 border-r border-secondary-200 flex flex-col bg-white">
                    <div className="p-4 border-b border-secondary-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-secondary-400" />
                            <input
                                type="text"
                                className="w-full pl-9 py-2 bg-secondary-50 border-none rounded-md text-sm focus:ring-1 focus:ring-primary-500"
                                placeholder={t('messages.search') || "Search messages"}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <p className="p-4 text-center text-sm text-secondary-500">Loading...</p>
                        ) : displayList.length === 0 ? (
                            <div className="p-8 text-center text-secondary-400">
                                <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No messages found</p>
                            </div>
                        ) : (
                            displayList.map(conv => (
                                <div
                                    key={conv.id}
                                    onClick={() => setActiveConversation(conv)}
                                    className={cn(
                                        "p-4 border-b border-secondary-50 cursor-pointer hover:bg-secondary-50 transition-colors group",
                                        activeConversation?.id === conv.id ? "bg-primary-50 border-l-4 border-l-primary-500 pl-3" : "pl-4"
                                    )}
                                >
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className={cn("text-sm font-semibold truncate max-w-[70%]", !conv.name && "italic text-secondary-500")}>
                                            {conv.name || (conv.other_user ? `${conv.other_user.first_name} ${conv.other_user.last_name}` : 'Unknown')}
                                        </h4>
                                        <span className="text-[10px] text-secondary-400">
                                            {conv.last_message_time ? new Date(conv.last_message_time).toLocaleDateString() : ''}
                                        </span>
                                    </div>
                                    <div className="text-xs font-medium text-secondary-800 mb-1 truncate">
                                        {/* Show Subject if exists, else show 'No Subject' or participants names again */}
                                        {conv.name && conv.name !== (conv.other_user ? `${conv.other_user.first_name} ${conv.other_user.last_name}` : '')
                                            ? conv.name
                                            : (t('messages.no_subject') || "No Subject")}
                                    </div>
                                    <p className="text-xs text-secondary-500 truncate line-clamp-1">
                                        {conv.last_message_content || 'No messages'}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 3. Right Column (Reading Pane) */}
                <div className="flex-1 flex flex-col bg-secondary-50/50">
                    {activeConversation ? (
                        <>
                            {/* Header */}
                            <div className="p-6 bg-white border-b border-secondary-200 flex justify-between items-start shadow-sm">
                                <div>
                                    <h2 className="text-xl font-bold text-secondary-900 mb-1">
                                        {activeConversation.name || (t('messages.no_subject') || "No Subject")}
                                    </h2>
                                    <div className="flex items-center gap-2 text-sm text-secondary-500">

                                        <div className="flex -space-x-2 mr-2">
                                            {/* Avatars dummy */}
                                            <div className="w-6 h-6 rounded-full bg-primary-100 border border-white flex items-center justify-center text-[10px] font-bold text-primary-700">
                                                {activeConversation.name?.[0]}
                                            </div>
                                        </div>
                                        <span>
                                            {activeConversation.other_user
                                                ? `${activeConversation.other_user.first_name} ${activeConversation.other_user.last_name}`
                                                : 'Participants'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleArchive(activeConversation.id, !activeFolder.includes('archive'))}
                                        className="p-2 hover:bg-secondary-100 rounded text-secondary-500"
                                        title={activeFolder === 'archive' ? "Restore" : "Archive"}
                                    >
                                        <Archive className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!confirm(t('messages.confirm_delete'))) return;
                                            try {
                                                await axios.delete(`http://localhost:5000/api/messages/conversations/${activeConversation.id}`, {
                                                    headers: { Authorization: `Bearer ${token}` }
                                                });
                                                setActiveConversation(null);
                                                fetchConversations();
                                            } catch (e) { alert("Failed to delete thread"); }
                                        }}
                                        className="p-2 hover:bg-red-50 rounded text-red-400"
                                        title={t('common.delete') || "Delete"}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Message List - Email Style */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
                                {messages.map((msg, index) => {
                                    const isMe = msg.sender_id === currentUser.id;
                                    return (
                                        <div key={msg.id} className="border-b border-secondary-100 pb-6 last:border-0 relative group">
                                            {/* Email Header */}
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center font-bold text-secondary-600">
                                                        {msg.first_name[0]}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="font-bold text-secondary-900 text-sm">{msg.first_name} {msg.last_name}</span>
                                                        </div>
                                                        <div className="text-xs text-secondary-500">
                                                            {new Date(msg.created_at).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => { document.querySelector('textarea#reply-box')?.focus(); }}
                                                        className="p-2 text-secondary-500 hover:bg-secondary-100 rounded"
                                                        title={t('messages.reply') || "Reply"}
                                                    >
                                                        <Reply className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => { document.querySelector('textarea#reply-box')?.focus(); }}
                                                        className="p-2 text-secondary-500 hover:bg-secondary-100 rounded"
                                                        title={t('messages.reply_all') || "Reply All"}
                                                    >
                                                        <ReplyAll className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleForward(msg)}
                                                        className="p-2 text-secondary-500 hover:bg-secondary-100 rounded"
                                                        title={t('messages.forward') || "Forward"}
                                                    >
                                                        <Forward className="w-4 h-4" />
                                                    </button>

                                                    {isMe && !msg.is_deleted && (
                                                        <button
                                                            onClick={() => handleDeleteMessage(msg.id)}
                                                            className="p-2 text-secondary-400 hover:text-red-500 rounded-full hover:bg-secondary-50"
                                                            title={t('common.delete')}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Email Body */}
                                            <div className="pl-14 text-sm text-secondary-800 leading-relaxed whitespace-pre-wrap font-sans">
                                                {msg.is_deleted ? (
                                                    <div className="italic text-secondary-400 bg-secondary-50 p-2 rounded w-fit text-xs">
                                                        🚫 {t('messages.deleted_msg') || 'Message deleted'}
                                                    </div>
                                                ) : (
                                                    <>
                                                        {msg.content}

                                                        {/* Attachments */}
                                                        {msg.attachment_url && (
                                                            <div className="mt-4 pt-4 border-t border-secondary-50">
                                                                <a
                                                                    href={`http://localhost:5000${msg.attachment_url}`}
                                                                    target="_blank" rel="noreferrer"
                                                                    className="inline-flex items-center gap-3 p-3 bg-secondary-50 border border-secondary-200 rounded-lg hover:bg-secondary-100 transition-colors group/file"
                                                                >
                                                                    <div className="p-2 bg-white rounded shadow-sm text-primary-600">
                                                                        <FileText className="w-5 h-5" />
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <p className="text-xs font-semibold text-secondary-900">Attachment</p>
                                                                        <p className="text-[10px] text-secondary-500 group-hover/file:underline">Click to download</p>
                                                                    </div>
                                                                </a>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Box */}
                            <div className="p-4 bg-white border-t border-secondary-200">
                                {selectedFile && (
                                    <div className="flex items-center gap-2 mb-2 p-2 bg-secondary-50 border rounded text-xs w-fit">
                                        <Paperclip className="w-3 h-3" /> {selectedFile.name}
                                        <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => setSelectedFile(null)} />
                                    </div>
                                )}
                                <form onSubmit={handleSendMessage} className="flex flex-col gap-3">
                                    <textarea
                                        id="reply-box"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder={t('messages.type_reply') || "Click here to reply..."}
                                        className="w-full h-24 p-3 border border-secondary-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-none text-sm"
                                    ></textarea>

                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current.click()}
                                                className="p-2 rounded hover:bg-secondary-100 text-secondary-500 flex items-center gap-2 text-sm"
                                            >
                                                <Paperclip className="w-4 h-4" /> {t('form.attachment') || "Attach"}
                                            </button>
                                            <input type="file" ref={fileInputRef} className="hidden" onChange={e => setSelectedFile(e.target.files[0])} />
                                        </div>
                                        <Button type="submit" className="px-6 h-9">{t('messages.send') || "Send"}</Button>
                                    </div>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-secondary-400">
                            <Mail className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">Select an item to read</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Compose Modal */}
            {showComposeModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-secondary-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-secondary-900">{t('messages.new_message')}</h3>
                            <button onClick={() => setShowComposeModal(false)}><X className="w-5 h-5 text-secondary-500" /></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            {/* To: Select */}
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">{t('messages.to') || "To"}</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search employee..."
                                        className="w-full text-sm border-secondary-300 rounded-md mb-2"
                                        value={employeeSearch}
                                        onChange={e => setEmployeeSearch(e.target.value)}
                                    />
                                    <select
                                        className="w-full border-secondary-300 rounded-md text-sm p-2 bg-white"
                                        value={composeParams.recipientId}
                                        onChange={e => setComposeParams({ ...composeParams, recipientId: e.target.value })}
                                        size={5}
                                    >
                                        {filteredEmployees.map(emp => (
                                            <option key={emp.id} value={emp.id} className="p-2 cursor-pointer hover:bg-blue-50">
                                                {emp.first_name} {emp.last_name} - {emp.job_title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">{t('messages.subject') || "Subject"}</label>
                                <input
                                    type="text"
                                    className="w-full border-secondary-300 rounded-md text-sm"
                                    value={composeParams.subject}
                                    onChange={e => setComposeParams({ ...composeParams, subject: e.target.value })}
                                    placeholder="Enter conversation subject..."
                                />
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">{t('messages.message') || "Message"}</label>
                                <textarea
                                    rows={5}
                                    className="w-full border-secondary-300 rounded-md text-sm"
                                    value={composeParams.content}
                                    onChange={e => setComposeParams({ ...composeParams, content: e.target.value })}
                                ></textarea>
                            </div>

                            {/* Attachment */}
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">{t('form.attachment') || "Attachment"}</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        className="text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                        onChange={e => setComposeParams({ ...composeParams, file: e.target.files[0] })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-secondary-100 flex justify-end gap-2 bg-gray-50">
                            <Button variant="outline" onClick={() => setShowComposeModal(false)}>{t('common.cancel') || "Cancel"}</Button>
                            <Button onClick={handleComposeSend} icon={Send}>{t('messages.send') || "Send"}</Button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default MessagesPage;
