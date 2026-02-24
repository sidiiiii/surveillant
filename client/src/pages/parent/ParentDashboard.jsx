import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Plus, X, Bell, BookOpen } from 'lucide-react';
import { API_URL } from '../../config';
import ReportCard from './ReportCard';
import ParentStudentDocuments from './ParentStudentDocuments';
import ParentSentinelWidget from '../../components/ParentSentinelWidget';

const ParentDashboard = () => {
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [toastNotification, setToastNotification] = useState(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [loading, setLoading] = useState(true);

    // Link Student State
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkData, setLinkData] = useState({ schoolCode: '', nsi: '' });
    const [linkError, setLinkError] = useState('');

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchChildren();
        fetchNotifications();

        // Auto-refresh notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (toastNotification) {
            const timer = setTimeout(() => {
                setToastNotification(null);
            }, 10000); // 10 seconds auto dismiss
            return () => clearTimeout(timer);
        }
    }, [toastNotification]);



    const fetchChildren = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/students/my-children`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChildren(response.data);
            if (response.data.length > 0 && !selectedChild) {
                setSelectedChild(response.data[0]);
            }
        } catch (error) {
            console.error('Error fetching children:', error);
            if (error.response?.status === 401) navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);

            // If unread exists, show the most recent one in Toast
            const unread = res.data.filter(n => !n.is_read);
            if (unread.length > 0) {
                const lastToastId = sessionStorage.getItem('lastToastId');
                if (unread[0].id.toString() !== lastToastId) {
                    setToastNotification(unread[0]);
                    sessionStorage.setItem('lastToastId', unread[0].id.toString());
                }
            }
        } catch (error) { console.error(error); }
    };




    const handleLinkStudent = async (e) => {
        e.preventDefault();
        setLinkError('');
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/auth/link-student`, linkData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Élève lié avec succès!');
            setShowLinkModal(false);
            setLinkData({ schoolCode: '', nsi: '' });
            fetchChildren(); // Refresh list
        } catch (error) {
            setLinkError(error.response?.data?.error || 'Échec de liaison de l\'élève');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gradient-premium">
            {/* Header / Navbar */}
            <nav className="glass sticky top-0 z-50 px-4 sm:px-6 lg:px-8 border-b border-indigo-100/30">
                <div className="max-w-7xl mx-auto flex justify-between h-20 items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-200 shadow-lg">
                            <BookOpen className="text-white w-6 h-6" />
                        </div>
                        <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-blue-600 tracking-tight">
                            Surveillant
                        </span>
                    </div>

                    <div className="flex items-center space-x-6">
                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    if (!showNotifications) fetchNotifications();
                                    setShowNotifications(!showNotifications);
                                }}
                                className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all relative group"
                            >
                                <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white text-[10px] font-bold text-white items-center justify-center">
                                            {unreadCount}
                                        </span>
                                    </span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-4 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-fade-in-down">
                                    <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                                        <h3 className="font-bold text-slate-800">Centième d'annonces</h3>
                                        <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-slate-200 rounded-full">
                                            <X className="w-4 h-4 text-slate-500" />
                                        </button>
                                    </div>
                                    <div className="max-h-[30rem] overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-12 text-center">
                                                <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                                <p className="text-sm text-slate-400 font-medium">Aucune notification pour le moment</p>
                                            </div>
                                        ) : (
                                            notifications.map(n => (
                                                <div
                                                    key={n.id}
                                                    className={`p-4 border-b hover:bg-slate-50 transition-colors cursor-pointer group ${!n.is_read ? 'bg-indigo-50/50 border-l-4 border-indigo-500' : ''}`}
                                                    onClick={async () => {
                                                        if (!n.is_read) {
                                                            try {
                                                                const token = localStorage.getItem('token');
                                                                await axios.put(`${API_URL}/notifications/${n.id}/read`, {}, {
                                                                    headers: { Authorization: `Bearer ${token}` }
                                                                });
                                                                fetchNotifications();
                                                            } catch (error) { console.error(error); }
                                                        }
                                                    }}
                                                >
                                                    <p className="text-sm text-slate-700 leading-relaxed group-hover:text-indigo-900 transition-colors">{n.message}</p>

                                                    {n.media_url && (
                                                        <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                                                            {n.media_type === 'video' ? (
                                                                <video controls className="w-full h-32 object-cover">
                                                                    <source src={`${API_URL.replace('/api', '')}${n.media_url}`} />
                                                                </video>
                                                            ) : (
                                                                <img
                                                                    src={`${API_URL.replace('/api', '')}${n.media_url}`}
                                                                    alt="Attachment"
                                                                    className="w-full h-32 object-cover"
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                    <p className="text-[10px] font-medium text-slate-400 mt-3 uppercase tracking-wider">
                                                        {new Date(n.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={() => window.open('https://wa.me/22238310476', '_blank')}
                                title="Contacter le Support"
                                className="p-2.5 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-all group"
                            >
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current group-hover:scale-110 transition-transform">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72 1.036 3.702 1.582 5.712 1.583h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                            </button>
                        </div>

                        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block leading-tight">
                                <p className="text-sm font-bold text-slate-900">{user.name}</p>
                                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-tighter">Espace Parent</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Children Selector & Welcome */}
                <div className="mb-10">
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-6 flex items-center gap-3">
                        <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
                        Mes Enfants
                    </h1>

                    <div className="flex flex-wrap items-center gap-5">
                        {children.map(child => (
                            <button
                                key={child.id}
                                onClick={() => setSelectedChild(child)}
                                className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold transition-all group relative overflow-hidden ${selectedChild?.id === child.id
                                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100 shadow-sm'
                                    }`}
                            >
                                <div className="relative">
                                    {child.photo_url ? (
                                        <img
                                            src={`${API_URL.replace('/api', '')}${child.photo_url}`}
                                            alt={child.name}
                                            className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/20"
                                        />
                                    ) : (
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedChild?.id === child.id ? 'bg-indigo-500' : 'bg-slate-100 text-slate-400'}`}>
                                            <User className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>
                                <div className="text-left">
                                    <div className="text-base font-bold truncate max-w-[150px]">{child.name}</div>
                                    <div className={`text-xs uppercase tracking-widest font-medium opacity-70`}>{child.class_name || 'Sans Classe'}</div>
                                </div>
                            </button>
                        ))}

                        <button
                            onClick={() => setShowLinkModal(true)}
                            className="flex items-center gap-3 px-6 py-4 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 font-bold hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 group-hover:scale-110 transition-all">
                                <Plus className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                            </div>
                            Ajouter un enfant
                        </button>
                    </div>
                </div>

                {/* Latest Announcements Banner */}
                {notifications.length > 0 && (
                    <div className="mb-12 relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col md:flex-row shadow-indigo-100">
                            {notifications[0].media_url && (
                                <div className="md:w-1/3 lg:w-1/4 h-56 md:h-auto overflow-hidden bg-slate-100">
                                    {notifications[0].media_type === 'video' ? (
                                        <video className="w-full h-full object-cover">
                                            <source src={`${API_URL.replace('/api', '')}${notifications[0].media_url}`} />
                                        </video>
                                    ) : (
                                        <img
                                            src={`${API_URL.replace('/api', '')}${notifications[0].media_url}`}
                                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                                            onClick={() => setShowNotifications(true)}
                                            alt="Annonce"
                                        />
                                    )}
                                </div>
                            )}
                            <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                                        Annonce importante
                                    </span>
                                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                                        {new Date(notifications[0].created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-4 leading-tight">
                                    {notifications[0].message}
                                </h3>
                                <button
                                    onClick={() => setShowNotifications(true)}
                                    className="inline-flex items-center text-indigo-600 font-bold hover:gap-3 gap-2 transition-all group"
                                >
                                    Consulter toutes les actualités
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Bell className="w-32 h-32" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Dynamic Content */}
                <div className="animate-fade-in-up">
                    {children.length === 0 ? (
                        <div className="max-w-2xl mx-auto text-center py-20 bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-slate-50">
                            <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
                                <Plus className="w-10 h-10 text-indigo-600" />
                            </div>
                            <h3 className="text-3xl font-extrabold text-slate-900 mb-4">Connectez vos enfants</h3>
                            <p className="text-slate-500 leading-relaxed max-w-md mx-auto mb-10 font-medium">
                                Utilisez le code fourni par l'école pour accéder au suivi scolaire, aux notes et aux documents de vos enfants.
                            </p>
                            <button
                                onClick={() => setShowLinkModal(true)}
                                className="btn-primary"
                            >
                                Lier un élève maintenant
                            </button>
                        </div>
                    ) : (
                        selectedChild && (
                            <div className="space-y-8 animate-fade-in">
                                {/* Zone Sentinelle IA - Priorité Haute */}
                                <div className="max-w-4xl mx-auto w-full">
                                    <ParentSentinelWidget studentId={selectedChild.id} />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                                    <div className="lg:col-span-2">
                                        <ParentStudentDocuments
                                            studentId={selectedChild.id}
                                            studentName={selectedChild.name}
                                        />
                                    </div>
                                    <div className="space-y-8">
                                        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-indigo-100 border border-slate-50">
                                            <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                                <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                                                Statistiques Rapides
                                            </h4>
                                            <div className="space-y-4">
                                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Documents Total</p>
                                                    <p className="text-2xl font-black text-slate-800">12</p>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                                                    <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Dernière Note</p>
                                                    <p className="text-2xl font-black text-indigo-700">18/20</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </main>

            {/* Link Student Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowLinkModal(false)}></div>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden relative animate-fade-in-down">
                        <div className="p-10 border-b border-slate-50">
                            <h3 className="text-3xl font-black text-slate-900 mb-2">Relier un élève</h3>
                            <p className="text-slate-500 font-medium">Remplissez les informations fournies par l'administration.</p>
                        </div>
                        <form onSubmit={handleLinkStudent} className="p-10 space-y-6">
                            {linkError && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm font-bold animate-pulse">
                                    ⚠️ {linkError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Code École</label>
                                <input
                                    type="text"
                                    placeholder="Ex: SCH-2024-X"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 uppercase"
                                    value={linkData.schoolCode}
                                    onChange={e => setLinkData({ ...linkData, schoolCode: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">NSI de l'élève</label>
                                <input
                                    type="text"
                                    placeholder="Numéro Scolaire d'Identification (5 chiffres)"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                                    value={linkData.nsi}
                                    onChange={e => setLinkData({ ...linkData, nsi: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="pt-6">
                                <button type="submit" className="w-full btn-primary py-5 text-lg">
                                    Lier mon enfant
                                </button>
                            </div>
                        </form>
                        <button
                            onClick={() => setShowLinkModal(false)}
                            className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>
                </div>
            )}

            {/* Notification Toast */}
            {toastNotification && (
                <div className="fixed bottom-10 right-4 sm:right-10 z-[110] w-full max-w-md bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-indigo-50 overflow-hidden animate-fade-in-down">
                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200">
                                <Bell className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-slate-900">Nouvelle Annonce</h4>
                                    <button onClick={() => setToastNotification(null)} className="text-slate-300 hover:text-slate-500">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4">{toastNotification.message}</p>

                                {toastNotification.media_url && (
                                    <div className="mb-4 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                                        <img
                                            src={`${API_URL.replace('/api', '')}${toastNotification.media_url}`}
                                            alt="Preview"
                                            className="w-full h-32 object-cover"
                                        />
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => { setShowNotifications(true); setToastNotification(null); }}
                                        className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors"
                                    >
                                        Consulter
                                    </button>
                                    <button
                                        onClick={() => setToastNotification(null)}
                                        className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                                    >
                                        Ignorer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-indigo-600 h-1.5 w-full">
                        <div className="h-full bg-white/30 animate-shrink" style={{ animationDuration: '10s' }}></div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default ParentDashboard;
