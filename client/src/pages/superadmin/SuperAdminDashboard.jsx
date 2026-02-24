import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import { useNavigate }
    from 'react-router-dom';
import SurveillantLogo from '../../assets/Surveillant.jpeg';

const SubscriptionTimer = ({ endDate, isPaused, remainingMs }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            if (isPaused) {
                const totalMinutes = Math.floor(parseInt(remainingMs || 0) / (1000 * 60));
                return `⏸️ PAUSE (${formatMinutes(totalMinutes)})`;
            }
            if (!endDate) return "⏳ Non défini";
            const end = new Date(endDate);
            const now = new Date();
            const diff = end - now;

            if (diff <= 0) return "❌ Expiré";

            const totalMinutes = Math.floor(diff / (1000 * 60));
            return formatMinutes(totalMinutes);
        };

        const formatMinutes = (totalMinutes) => {
            const minutes = totalMinutes % 60;
            const hours = Math.floor((totalMinutes / 60) % 24);
            const days = Math.floor((totalMinutes / (60 * 24)) % 30);
            const months = Math.floor(totalMinutes / (60 * 24 * 30));

            const parts = [];
            if (months > 0) parts.push(`${months}m`);
            if (days > 0 || months > 0) parts.push(`${days}j`);
            if (hours > 0 || days > 0 || months > 0) parts.push(`${hours}h`);
            parts.push(`${minutes}min`);

            return parts.join(' ');
        };

        const updateTimer = () => setTimeLeft(calculateTimeLeft());
        updateTimer();
        const interval = setInterval(updateTimer, 60000); // Mettre à jour chaque minute

        return () => clearInterval(interval);
    }, [endDate, isPaused, remainingMs]);

    const isExpired = timeLeft.includes('Expiré');
    const isPausedDisplay = timeLeft.includes('⏸️');
    const isWarning = !isPausedDisplay && (timeLeft.match(/^[0-4]j/) || timeLeft.match(/^[0-9]+h/));

    return (
        <div className={`flex flex-col gap-1`}>
            <div className={`font-mono text-[11px] font-black px-2 py-1 rounded border shadow-inner ${isExpired ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                isPausedDisplay ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' :
                    isWarning ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 animate-pulse' :
                        'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}>
                {timeLeft}
            </div>
            {endDate && !isExpired && !isPaused && (
                <div className="text-[9px] text-slate-500 flex items-center gap-1 opacity-60">
                    📅 {new Date(endDate).toLocaleDateString()}
                </div>
            )}
        </div>
    );
};

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [schools, setSchools] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const BASE_URL = API_URL.replace('/api', '');
    const [globalMessage, setGlobalMessage] = useState('');
    const [notificationMedia, setNotificationMedia] = useState([]);
    const [sending, setSending] = useState(false);
    const [showOnHome, setShowOnHome] = useState(true);
    const [showOnStudent, setShowOnStudent] = useState(true);
    const [notificationHistory, setNotificationHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModal, setConfirmModal] = useState({ show: false, type: '', school: null, input: '', loading: false });

    // Video Ad State
    const [videoAdFile, setVideoAdFile] = useState(null);
    const [videoAdEnabled, setVideoAdEnabled] = useState(false);
    const [videoAdUrl, setVideoAdUrl] = useState('');
    const [videoAdLocations, setVideoAdLocations] = useState({ home: true, student: true });
    const [savingAd, setSavingAd] = useState(false);
    const [editingSchoolId, setEditingSchoolId] = useState(null);
    const [editData, setEditData] = useState({ name: '', unique_code: '', admin_email: '' });
    const [showProfile, setShowProfile] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState(user.email || '');
    const [newPassword, setNewPassword] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('22246473111');
    const [savingWhatsApp, setSavingWhatsApp] = useState(false);

    useEffect(() => {
        if (!user.is_superadmin) {
            navigate('/login');
            return;
        }
        fetchData();
        fetchSettings();
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${API_URL}/superadmin/notifications-history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotificationHistory(res.data);
        } catch (err) {
            console.error("Erreur lors du chargement de l'historique:", err);
        }
    };

    const deleteHistoryItem = async (id) => {
        if (!window.confirm("Voulez-vous supprimer cette notification de l'historique ?")) return;
        try {
            await axios.delete(`${API_URL}/superadmin/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchHistory();
        } catch (err) {
            alert("Erreur lors de la suppression de l'historique");
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await axios.get(`${API_URL}/superadmin/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.global_news) setGlobalMessage(res.data.global_news);
            if (res.data.global_news_display_locations) {
                const locs = res.data.global_news_display_locations;
                setShowOnHome(locs.includes('home'));
                setShowOnStudent(locs.includes('student'));
            }
            if (res.data.video_ad_url) setVideoAdUrl(res.data.video_ad_url);
            if (res.data.video_ad_enabled) setVideoAdEnabled(res.data.video_ad_enabled === 'true');
            if (res.data.video_ad_locations) {
                const locs = res.data.video_ad_locations.split(',');
                setVideoAdLocations({
                    home: locs.includes('home'),
                    student: locs.includes('student')
                });
            }
            if (res.data.support_whatsapp) setWhatsappNumber(res.data.support_whatsapp);
        } catch (err) {
            console.error(err);
        }
    };

    const deleteNotification = async () => {
        if (!window.confirm("Voulez-vous vraiment supprimer la notification actuelle ? Cela effacera le message et les images pour tous les utilisateurs.")) {
            return;
        }

        setSending(true);
        try {
            await axios.delete(`${API_URL}/superadmin/delete-notification`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Notification supprimée avec succès');
            setGlobalMessage('');
            setNotificationMedia([]);
            fetchSettings();
            fetchHistory(); // Refresh history
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || 'Erreur inconnue';
            alert(`Erreur lors de la suppression: ${errorMsg}`);
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    const saveWhatsAppNumber = async () => {
        setSavingWhatsApp(true);
        try {
            await axios.post(`${API_URL}/superadmin/settings`, {
                key: 'support_whatsapp',
                value: whatsappNumber
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Numéro WhatsApp de support mis à jour !');
        } catch (err) {
            alert('Erreur: ' + (err.response?.data?.error || err.message));
        } finally {
            setSavingWhatsApp(false);
        }
    };

    const sendParentNotification = async () => {
        if (!globalMessage && notificationMedia.length === 0) {
            alert("Veuillez entrer un message ou sélectionner un fichier.");
            return;
        }

        setSending(true);
        try {
            const formData = new FormData();
            formData.append('message', globalMessage);
            if (notificationMedia && notificationMedia.length > 0) {
                notificationMedia.forEach(file => {
                    formData.append('media', file);
                });
            }

            const locations = [];
            if (showOnHome) locations.push('home');
            if (showOnStudent) locations.push('student');
            formData.append('display_locations', locations.join(','));

            await axios.post(`${API_URL}/superadmin/notify-parents`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            alert('Notification envoyée à tous les parents avec succès');
            setGlobalMessage('');
            setNotificationMedia([]);
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || 'Erreur inconnue';
            alert(`Erreur lors de l'envoi: ${errorMsg}`);
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    const saveVideoAd = async () => {
        if (!videoAdFile && !videoAdUrl) {
            alert("Veuillez sélectionner une vidéo.");
            return;
        }

        setSavingAd(true);
        try {
            const formData = new FormData();
            if (videoAdFile) formData.append('video', videoAdFile);
            formData.append('enabled', videoAdEnabled ? 'true' : 'false');

            const locs = [];
            if (videoAdLocations.home) locs.push('home');
            if (videoAdLocations.student) locs.push('student');
            formData.append('locations', locs.join(','));

            await axios.post(`${API_URL}/superadmin/video-ad`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert('Publicité vidéo mise à jour !');
            fetchSettings();
            setVideoAdFile(null);
        } catch (err) {
            alert('Erreur lors de la sauvegarde de la pub vidéo');
        } finally {
            setSavingAd(false);
        }
    };

    const deleteVideoAd = async () => {
        if (!window.confirm("Supprimer la vidéo publicitaire ?")) return;
        setSavingAd(true);
        try {
            await axios.delete(`${API_URL}/superadmin/video-ad`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVideoAdUrl('');
            setVideoAdEnabled(false);
            alert('Publicité supprimée');
        } catch (err) {
            alert('Erreur lors de la suppression');
        } finally {
            setSavingAd(false);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');

            // Fetch schools
            try {
                const res = await axios.get(`${API_URL}/superadmin/schools?refresh=${Date.now()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ Schools Loaded:', res.data.length, res.data);
                setSchools(res.data);
            } catch (err) {
                console.error("Schools fetch error:", err);
                setError('Impossible de charger la liste des écoles.');
            }

            // Fetch stats
            try {
                const res = await axios.get(`${API_URL}/superadmin/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(res.data);
            } catch (err) {
                console.error("Stats fetch error:", err);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openConfirmModal = (type, school) => {
        setConfirmModal({ show: true, type, school, input: '', loading: false });
    };

    const handleConfirmAction = async () => {
        const { type, school, input } = confirmModal;
        if (!school) return;

        if (type === 'delete' && input !== school.name) {
            alert("Erreur: Le nom saisi ne correspond pas au nom de l'école.");
            return;
        }

        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
            if (type === 'delete') {
                await axios.delete(`${API_URL}/superadmin/schools/${school.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSearchTerm('');
                fetchData();
                alert('École supprimée avec succès');
            } else {
                const newStatus = type === 'suspend' ? 'suspended' : 'active';
                await axios.patch(`${API_URL}/superadmin/schools/${school.id}/status`,
                    { status: newStatus },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                fetchData();
            }
            setConfirmModal({ show: false, type: '', school: null, input: '', loading: false });
        } catch (err) {
            console.error('Confirm action error:', err);
            alert('Erreur: ' + (err.response?.data?.error || err.message));
            setConfirmModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleEditSchool = (school) => {
        setEditingSchoolId(school.id);
        setEditData({
            name: school.name,
            unique_code: school.unique_code,
            admin_email: school.admin_email,
            subscription_extension: ''
        });
    };

    const saveSchoolDetails = async (id) => {
        try {
            // Update Details
            await axios.patch(`${API_URL}/superadmin/schools/${id}/details`, editData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update Subscription if value entered
            if (editData.subscription_extension && !isNaN(editData.subscription_extension)) {
                await axios.patch(`${API_URL}/superadmin/schools/${id}/subscription`, { days: parseInt(editData.subscription_extension) }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            setEditingSchoolId(null);
            fetchData();
            alert('Informations mises à jour !');
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la mise à jour : ' + (err.response?.data?.error || err.message));
        }
    };

    const handlePause = async (id) => {
        if (!window.confirm('Voulez-vous mettre en pause l\'abonnement de cette école ?')) return;
        try {
            await axios.post(`${API_URL}/superadmin/schools/${id}/pause`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Erreur lors de la pause');
        }
    };

    const handleResume = async (id) => {
        try {
            await axios.post(`${API_URL}/superadmin/schools/${id}/resume`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Erreur lors de la reprise');
        }
    };

    const restart30Days = async (id) => {
        if (!window.confirm('Voulez-vous réinitialiser l\'abonnement à 30 jours (à partir de maintenant) ?')) return;
        try {
            await axios.patch(`${API_URL}/superadmin/schools/${id}/subscription`, { days: 30 }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Erreur lors de la réinitialisation');
        }
    };

    const addSubscriptionDays = async (id, days) => {
        const customDays = prompt("Prolonger de combien de jours ? (Saisir un nombre) :", days);
        if (customDays === null) return; // Cancelled
        if (!customDays || isNaN(customDays)) {
            alert("Veuillez entrer un nombre valide.");
            return;
        }

        try {
            const res = await axios.patch(`${API_URL}/superadmin/schools/${id}/subscription`, { days: parseInt(customDays) }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(res.data.message || 'Abonnement mis à jour !');
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Erreur: ' + (err.response?.data?.error || err.message));
        }
    };



    const updateAdminProfileEmail = async () => {
        try {
            await axios.patch(`${API_URL}/superadmin/profile/email`, { email: newAdminEmail }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const newUser = { ...user, email: newAdminEmail };
            localStorage.setItem('user', JSON.stringify(newUser));
            alert('Votre email a été mis à jour !');
        } catch (err) {
            alert('Erreur: ' + (err.response?.data?.error || err.message));
        }
    };

    const updateAdminPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            alert('Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }
        try {
            await axios.patch(`${API_URL}/superadmin/profile/password`, { password: newPassword }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewPassword('');
            alert('Votre mot de passe a été mis à jour !');
        } catch (err) {
            alert('Erreur: ' + (err.response?.data?.error || err.message));
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    const filteredSchools = schools.filter(school => {
        const searchLower = searchTerm.toLowerCase();
        const name = (school.name || '').toLowerCase();
        const phone = (school.phone || '').toLowerCase();
        const code = (school.unique_code || '').toLowerCase();
        const adminEmail = (school.admin_email || '').toLowerCase();
        const schoolEmail = (school.email || '').toLowerCase();

        return (
            name.includes(searchLower) ||
            phone.includes(searchLower) ||
            code.includes(searchLower) ||
            adminEmail.includes(searchLower) ||
            schoolEmail.includes(searchLower)
        );
    });

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 p-6 font-['Outfit',sans-serif]">
            {/* Header */}
            <header className="flex justify-between items-center mb-10 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-md">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <img src={SurveillantLogo} alt="Surveillant" className="w-10 h-10 rounded-full object-cover border-2 border-blue-400" />
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                            Panel SuperAdmin
                        </h1>
                    </div>
                    <p className="text-slate-400 ml-14">Gestion globale de la plateforme Surveillant / المراقب</p>
                    <div className="ml-14 mt-2 inline-flex flex-col gap-1">
                        <div className="flex items-center px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
                            Total chargé: {schools.length} écoles
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                            IDs: {schools.map(s => s.id).join(', ')}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setShowProfile(!showProfile)}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-700 transition-all group"
                    >
                        <span className="text-xl">⚙️</span>
                        <span className="text-sm font-medium text-slate-300 group-hover:text-white">Profile</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-6 py-2 rounded-xl border border-red-500/20 transition-all font-bold"
                    >
                        Quitter
                    </button>
                </div>
            </header>

            {showProfile && (
                <div className="mb-8 p-6 bg-slate-800/80 border border-blue-500/30 rounded-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        👤 Mon Profil SuperAdmin
                    </h2>
                    <div className="flex flex-wrap gap-4 items-end mb-6 border-b border-slate-700 pb-6">
                        <div className="flex-1 max-w-sm">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mon Email de Connexion</label>
                            <input
                                type="email"
                                value={newAdminEmail}
                                onChange={(e) => setNewAdminEmail(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                            />
                        </div>
                        <button
                            onClick={updateAdminProfileEmail}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all"
                        >
                            Enregistrer mon email
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 max-w-sm">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nouveau Mot de passe</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min. 6 caractères"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                            />
                        </div>
                        <button
                            onClick={updateAdminPassword}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all"
                        >
                            Modifier le mot de passe
                        </button>
                        <button
                            onClick={() => setShowProfile(false)}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold px-6 py-3 rounded-xl transition-all ml-auto"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard title="Total Écoles" value={stats?.total_schools} icon="🏫" color="blue" />
                <StatCard title="Total Élevés" value={stats?.total_students} icon="👨‍🎓" color="indigo" />
                <StatCard title="Revenu Estimé" value={`${stats?.total_revenue} MRU`} icon="💰" color="emerald" subtitle="10 MRU / élève" />
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex justify-between items-center">
                    <span>{error}</span>
                    <button onClick={fetchData} className="text-xs underline">Réessayer</button>
                </div>
            )}

            {/* Schools Table */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden backdrop-blur-md">
                <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-semibold text-white">Écoles Inscrites</h2>

                    <div className="flex-1 max-w-md w-full relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Rechercher par Nom, Téléphone, Code ou Email..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <button onClick={fetchData} className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2">
                        <span>🔄</span> Actualiser
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 text-sm uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">École</th>
                                <th className="px-6 py-4 font-medium">Téléphone</th>
                                <th className="px-6 py-4 font-medium">Code</th>
                                <th className="px-6 py-4 font-medium">Élevés</th>
                                <th className="px-6 py-4 font-medium">Facturation</th>
                                <th className="px-6 py-4 font-medium">Abonnement</th>
                                <th className="px-6 py-4 font-medium">Statut</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredSchools.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                                        <div className="text-4xl mb-4 text-slate-600">🏫</div>
                                        {searchTerm ? (
                                            <div>
                                                <p className="text-white font-medium">Aucun résultat pour "{searchTerm}"</p>
                                                <button onClick={() => setSearchTerm('')} className="text-blue-400 mt-2 hover:underline">Effacer la recherche</button>
                                            </div>
                                        ) : (
                                            <p className="text-white font-medium">Aucune école enregistrée</p>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                filteredSchools.map((school) => (
                                    <tr key={school.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-blue-400 border border-slate-600">
                                                    {school.logo_url ? (
                                                        <img src={`${BASE_URL}${school.logo_url}`} alt="" className="w-full h-full object-cover rounded-lg" />
                                                    ) : (
                                                        school.name?.substring(0, 1) || '?'
                                                    )}
                                                </div>
                                                <div>
                                                    {editingSchoolId === school.id ? (
                                                        <div className="space-y-2">
                                                            <input
                                                                type="text"
                                                                value={editData.name}
                                                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                                className="w-full bg-slate-900 border border-blue-500/50 rounded-lg px-2 py-1 text-sm text-white"
                                                                placeholder="Nom de l'école"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="font-semibold text-white">{school.name}</div>
                                                    )}

                                                    <div className="text-xs text-slate-400 mt-1">
                                                        {editingSchoolId === school.id ? (
                                                            <input
                                                                type="email"
                                                                value={editData.admin_email}
                                                                onChange={(e) => setEditData({ ...editData, admin_email: e.target.value })}
                                                                className="w-full bg-slate-900 border border-blue-500/50 rounded-lg px-2 py-1 text-xs text-white"
                                                                placeholder="Email Admin"
                                                            />
                                                        ) : (
                                                            school.admin_email ? (
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="flex items-center gap-1 text-slate-300">
                                                                        <span className="text-blue-400">📧 Login:</span> {school.admin_email}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span>{school.email || "Pas d'email"}</span>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-300">
                                            {school.phone || <span className="text-slate-500 italic">Non renseigné</span>}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-blue-400">
                                            {editingSchoolId === school.id ? (
                                                <input
                                                    type="text"
                                                    value={editData.unique_code}
                                                    onChange={(e) => setEditData({ ...editData, unique_code: e.target.value })}
                                                    className="w-full bg-slate-900 border border-blue-500/50 rounded-lg px-2 py-1 text-xs text-blue-400 font-mono"
                                                />
                                            ) : (
                                                school.unique_code
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                                                {school.student_count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-emerald-400">{school.billing_amount} MRU</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium min-w-[150px]">
                                            {editingSchoolId === school.id ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] text-slate-400 uppercase">Prolonger (jours)</span>
                                                    <input
                                                        type="number"
                                                        value={editData.subscription_extension}
                                                        onChange={(e) => setEditData({ ...editData, subscription_extension: e.target.value })}
                                                        className="w-20 bg-slate-900 border border-blue-500/50 rounded-lg px-2 py-1 text-xs text-white"
                                                        placeholder="+Jours"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-2">
                                                    <SubscriptionTimer
                                                        endDate={school.subscription_end_date}
                                                        isPaused={school.is_paused}
                                                        remainingMs={school.subscription_remaining_ms}
                                                    />
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => restart30Days(school.id)}
                                                            className="flex-[2] text-[8px] bg-blue-600 text-white px-1 py-1 rounded border border-blue-700 hover:bg-blue-700 transition-all font-bold uppercase shadow-sm"
                                                            title="Réinitialiser à 30 jours"
                                                        >
                                                            🔄 30J
                                                        </button>
                                                        <button
                                                            onClick={() => addSubscriptionDays(school.id, 10)}
                                                            className="flex-1 text-[8px] bg-slate-700 text-slate-300 px-1 py-1 rounded border border-slate-600 hover:bg-slate-600 hover:text-white transition-all font-bold"
                                                            title="Ajouter jours personnalisés"
                                                        >
                                                            +
                                                        </button>
                                                        {school.is_paused ? (
                                                            <button
                                                                onClick={() => handleResume(school.id)}
                                                                className="flex-1 text-[8px] bg-emerald-500/10 text-emerald-400 px-1 py-1 rounded border border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all font-bold uppercase"
                                                            >
                                                                ▶️ Repr
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handlePause(school.id)}
                                                                className="flex-1 text-[8px] bg-amber-500/10 text-amber-400 px-1 py-1 rounded border border-amber-500/20 hover:bg-amber-600 hover:text-white transition-all font-bold uppercase"
                                                                disabled={!school.subscription_end_date}
                                                            >
                                                                ⏸️ Pose
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${school.status === 'active'
                                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                }`}>
                                                {school.status === 'active' ? 'Actif' : 'Suspendu'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {editingSchoolId === school.id ? (
                                                    <>
                                                        <button
                                                            onClick={() => saveSchoolDetails(school.id)}
                                                            className="p-2 bg-emerald-500 text-white rounded-lg transition-all shadow-lg"
                                                            title="Enregistrer"
                                                        >
                                                            💾
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingSchoolId(null)}
                                                            className="p-2 bg-slate-700 text-white rounded-lg transition-all"
                                                            title="Annuler"
                                                        >
                                                            ❌
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleEditSchool(school)}
                                                            className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-all border border-blue-500/20"
                                                            title="Modifier"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => openConfirmModal(school.status === 'active' ? 'suspend' : 'activate', school)}
                                                            className={`p-2 rounded-lg transition-all ${school.status === 'active'
                                                                ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20'
                                                                : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20'
                                                                }`}
                                                            title={school.status === 'active' ? 'Suspendre' : 'Activer'}
                                                        >
                                                            {school.status === 'active' ? '⏸️' : '▶️'}
                                                        </button>
                                                        <button
                                                            onClick={() => openConfirmModal('delete', school)}
                                                            className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-all border border-red-500/20"
                                                            title="Supprimer"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Site Updates Section */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-2xl text-white shadow-xl">
                    <h2 className="text-2xl font-bold mb-4">Mises à jour du site</h2>
                    <p className="text-indigo-100 mb-6">
                        Déployez de nouvelles fonctionnalités et corrections. Surveillez l'état du serveur en temps réel.
                    </p>
                    <div className="flex flex-wrap gap-3 mb-6">
                        <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-6 py-3 rounded-xl font-semibold transition-all border border-white/10 text-sm">
                            Vérifier les logs
                        </button>
                        <button className="bg-emerald-500 hover:bg-emerald-400 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg text-sm">
                            Lancer Backup DB
                        </button>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                            📱 Support WhatsApp
                        </h3>
                        <p className="text-indigo-100 text-sm mb-4">
                            Ce numéro apparaîtra sur le bandeau de suspension des écoles.
                        </p>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">+</span>
                                <input
                                    type="text"
                                    value={whatsappNumber}
                                    onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                                    placeholder="222XXXXXXXX"
                                    className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-7 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                                />
                            </div>
                            <button
                                onClick={saveWhatsAppNumber}
                                disabled={savingWhatsApp}
                                className="bg-white text-indigo-700 hover:bg-indigo-50 px-6 rounded-xl font-bold transition-all disabled:opacity-50"
                            >
                                {savingWhatsApp ? '...' : 'OK'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Video Ad Section */}
                <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">🎬</span>
                    </div>

                    <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-3">
                        Publicité Vidéo (10s)
                    </h2>
                    <p className="text-slate-400 mb-6 leading-relaxed">
                        Partagez une vidéo courte qui apparaîtra au milieu de la page avec un fond flou. L'utilisateur pourra la fermer.
                    </p>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Fichier Vidéo (MP4, Max 50MB)</label>
                            <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => setVideoAdFile(e.target.files[0])}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm"
                            />
                            {videoAdUrl && !videoAdFile && (
                                <p className="text-xs text-blue-400 mt-2">Vidéo actuelle: {videoAdUrl.split('/').pop()}</p>
                            )}
                        </div>

                        <div className="space-y-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-1">Configuration</h3>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={videoAdEnabled}
                                        onChange={(e) => setVideoAdEnabled(e.target.checked)}
                                    />
                                    <div className="w-10 h-6 bg-slate-700 rounded-full peer peer-checked:bg-emerald-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                                </div>
                                <span className="text-slate-400 font-medium group-hover:text-white transition-colors">Activer la publicité</span>
                            </label>

                            <div className="pt-2 border-t border-slate-700 mt-2">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Emplacements</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={videoAdLocations.home}
                                            onChange={(e) => setVideoAdLocations({ ...videoAdLocations, home: e.target.checked })}
                                            className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500/20"
                                        />
                                        <span className="text-sm text-slate-400">Accueil</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={videoAdLocations.student}
                                            onChange={(e) => setVideoAdLocations({ ...videoAdLocations, student: e.target.checked })}
                                            className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500/20"
                                        />
                                        <span className="text-sm text-slate-400">Page Élève</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={saveVideoAd}
                                disabled={savingAd}
                                className={`flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg ${savingAd ? 'opacity-50' : ''}`}
                            >
                                {savingAd ? 'Chargement...' : 'Sauvegarder Pub'}
                            </button>
                            {videoAdUrl && (
                                <button
                                    onClick={deleteVideoAd}
                                    className="px-6 bg-red-500/10 hover:bg-red-500 border border-red-500/50 text-white font-bold py-4 rounded-xl transition-all"
                                >
                                    🗑️
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">📣</span>
                    </div>

                    <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-3">
                        Notifications Images
                    </h2>
                    <p className="text-slate-400 mb-6 leading-relaxed">
                        Uploadez jusqu'à 3 images qui s'afficheront automatiquement en carrousel plein écran sur la page d'accueil.
                    </p>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Média (Images ou Vidéo) - Max 3</label>
                            <div className="flex flex-col gap-4">
                                <input
                                    type="file"
                                    id="media-upload"
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={(e) => {
                                        const newFiles = Array.from(e.target.files);
                                        const combined = [...(notificationMedia || []), ...newFiles];
                                        setNotificationMedia(combined.slice(0, 3));
                                        e.target.value = '';
                                    }}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="media-upload"
                                    className="flex flex-col items-center justify-center gap-3 w-full py-6 px-6 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all text-slate-400 font-medium"
                                >
                                    <span className="text-3xl">📎</span>
                                    <div className="text-center">
                                        <p className="font-bold text-white mb-1">
                                            {notificationMedia && notificationMedia.length > 0
                                                ? `${notificationMedia.length} fichier(s) sélectionné(s)`
                                                : "Cliquez pour choisir des fichiers"}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Maintenez Ctrl (Windows) ou Cmd (Mac) pour sélectionner plusieurs fichiers (Max 3)
                                        </p>
                                    </div>
                                </label>

                                {notificationMedia && notificationMedia.length > 0 && (
                                    <>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {notificationMedia.map((file, index) => (
                                                <div key={index} className="relative rounded-xl overflow-hidden border border-slate-600 bg-slate-900 group">
                                                    {file.type.startsWith('image/') ? (
                                                        <img
                                                            src={URL.createObjectURL(file)}
                                                            className="w-full h-32 object-cover"
                                                            alt="Preview"
                                                        />
                                                    ) : (
                                                        <div className="h-32 flex items-center justify-center bg-slate-900">
                                                            <span className="text-blue-400 font-bold text-xs p-2 text-center">▶️ Vidéo</span>
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => setNotificationMedia(notificationMedia.filter((_, i) => i !== index))}
                                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <span className="p-0.5 text-xs">✕</span>
                                                    </button>
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center">
                                                        Image {index + 1}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {notificationMedia.length < 3 && (
                                            <label
                                                htmlFor="media-upload"
                                                className="text-center py-2 px-4 bg-blue-600/20 text-blue-400 rounded-lg cursor-pointer hover:bg-blue-600/30 transition-all text-sm font-bold border border-blue-500/30"
                                            >
                                                + Ajouter plus de fichiers ({3 - notificationMedia.length} restant{3 - notificationMedia.length > 1 ? 's' : ''})
                                            </label>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-1">Affichage</h3>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={showOnHome}
                                        onChange={(e) => setShowOnHome(e.target.checked)}
                                    />
                                    <div className="w-10 h-6 bg-slate-700 rounded-full peer peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                                </div>
                                <span className="text-slate-400 font-medium group-hover:text-white transition-colors">Sur la page de Recherche (Accueil)</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={showOnStudent}
                                        onChange={(e) => setShowOnStudent(e.target.checked)}
                                    />
                                    <div className="w-10 h-6 bg-slate-700 rounded-full peer peer-checked:bg-indigo-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                                </div>
                                <span className="text-slate-400 font-medium group-hover:text-white transition-colors">Sur la page Élève (Résultats)</span>
                            </label>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={sendParentNotification}
                                disabled={sending}
                                className={`flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl transition-all transform active:scale-95 shadow-lg shadow-blue-900/20 ${sending ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {sending ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Envoi en cours...
                                    </div>
                                ) : 'Diffuser la Notification'}
                            </button>

                            <button
                                onClick={deleteNotification}
                                disabled={sending}
                                className={`px-6 bg-red-500/10 hover:bg-red-500 border-2 border-red-500/50 text-white font-bold py-4 rounded-xl transition-all transform active:scale-95 shadow-lg ${sending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Supprimer la notification"
                            >
                                🗑️
                            </button>
                        </div>

                        {/* Notifications History Section */}
                        <div className="mt-8 pt-8 border-t border-slate-700">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                📜 Historique des Diffusions
                                <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-1 rounded-full">{notificationHistory.length}</span>
                            </h3>
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                {notificationHistory.length === 0 ? (
                                    <p className="text-slate-500 italic text-center py-4">Aucune notification envoyée récemment</p>
                                ) : (
                                    notificationHistory.map((notif) => (
                                        <div key={notif.id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 flex justify-between items-start gap-4 hover:border-slate-500 transition-colors group">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-slate-300 text-sm line-clamp-2 break-words">
                                                    {notif.message || <span className="italic text-slate-500">Média seulement</span>}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                                        📅 {new Date(notif.created_at).toLocaleDateString()}
                                                    </span>
                                                    {notif.media_url && (
                                                        <span className="text-[10px] text-blue-400 font-bold uppercase">
                                                            🖼️ {notif.media_type}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-green-500 font-bold uppercase">
                                                        👥 Portée: {notif.reach}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteHistoryItem(notif.id)}
                                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Supprimer de l'historique"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className={`p-6 ${confirmModal.type === 'delete' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">
                                    {confirmModal.type === 'delete' ? '🗑️' : confirmModal.type === 'suspend' ? '⏸️' : '▶️'}
                                </span>
                                <h3 className="text-xl font-bold text-white">
                                    {confirmModal.type === 'delete' ? 'Suppression Définitive' : confirmModal.type === 'suspend' ? 'Suspension' : 'Réactivation'}
                                </h3>
                            </div>
                            <p className="text-slate-300 text-sm">
                                {confirmModal.type === 'delete'
                                    ? `Êtes-vous sûr de vouloir supprimer l'école "${confirmModal.school?.name}" ? Cette action est irréversible.`
                                    : `Voulez-vous vraiment ${confirmModal.type === 'suspend' ? 'suspendre' : 'réactiver'} l'accès pour l'école "${confirmModal.school?.name}" ?`
                                }
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            {confirmModal.type === 'delete' && (
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Tapez le nom de l'école pour confirmer :
                                    </label>
                                    <input
                                        type="text"
                                        value={confirmModal.input}
                                        onChange={(e) => setConfirmModal({ ...confirmModal, input: e.target.value })}
                                        placeholder={confirmModal.school?.name}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition-all font-bold"
                                        autoFocus
                                    />
                                    <p className="text-[10px] text-red-400 italic">Attention: Toutes les données seront effacées.</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setConfirmModal({ show: false, type: '', school: null, input: '', loading: false })}
                                    className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl transition-all"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleConfirmAction}
                                    disabled={confirmModal.loading || (confirmModal.type === 'delete' && confirmModal.input !== confirmModal.school?.name)}
                                    className={`flex-1 px-4 py-3 text-white font-bold rounded-xl transition-all ${confirmModal.type === 'delete'
                                        ? 'bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:grayscale'
                                        : 'bg-blue-600 hover:bg-blue-500 disabled:opacity-30'
                                        }`}
                                >
                                    {confirmModal.loading ? 'En cours...' : 'Confirmer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, icon, color, subtitle }) => {
    const colors = {
        blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400',
        indigo: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/30 text-indigo-400',
        emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400',
        green: 'from-green-500/20 to-green-600/5 border-green-500/30 text-green-400',
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} border p-6 rounded-2xl backdrop-blur-md`}>
            <div className="flex justify-between items-start mb-4">
                <span className="text-2xl">{icon}</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
        </div>
    );
};

export default SuperAdminDashboard;
