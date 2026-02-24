import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import SurveillantLogo from '../../assets/Surveillant.jpeg';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Mail, Send, Loader, LayoutDashboard, User, Lock, ShieldCheck } from 'lucide-react';

const AdminSettings = () => {
    const navigate = useNavigate();

    // SMTP Settings State
    const [emailSettings, setEmailSettings] = useState({
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: '',
        smtp_pass: ''
    });

    // Account Settings State
    const [profileData, setProfileData] = useState({
        email: '',
        name: '',
        password: '',
        confirmPassword: '',
        currentPassword: ''
    });

    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [schoolInfo, setSchoolInfo] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            setProfileData(prev => ({
                ...prev,
                email: user.email || '',
                name: user.name || ''
            }));

            try {
                // Fetch SMTP settings
                const res = await axios.get(`${API_URL}/schools/email-settings`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data) {
                    setEmailSettings({
                        smtp_host: res.data.smtp_host || 'smtp.gmail.com',
                        smtp_port: res.data.smtp_port || 587,
                        smtp_user: res.data.smtp_user || '',
                        smtp_pass: res.data.has_password ? '********' : ''
                    });
                }

                // Fetch School Info
                const schoolRes = await axios.get(`${API_URL}/schools/my-school`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSchoolInfo(schoolRes.data);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        setEmailSettings({ ...emailSettings, [e.target.name]: e.target.value });
    };

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleSaveSMTP = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        const payload = { ...emailSettings };
        if (payload.smtp_pass === '********') {
            delete payload.smtp_pass;
        } else {
            payload.smtp_pass = payload.smtp_pass.replace(/\s/g, '');
        }

        try {
            await axios.post(`${API_URL}/schools/email-settings`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Configuration SMTP sauvegardée !');
        } catch (error) {
            alert('Erreur lors de la sauvegarde SMTP');
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        if (!profileData.currentPassword) {
            return alert('Veuillez entrer votre mot de passe actuel pour confirmer les changements.');
        }

        if (profileData.password && profileData.password !== profileData.confirmPassword) {
            return alert('Les nouveaux mots de passe ne correspondent pas.');
        }

        setSavingProfile(true);
        const token = localStorage.getItem('token');

        try {
            const res = await axios.put(`${API_URL}/auth/update-profile`, {
                email: profileData.email,
                name: profileData.name,
                password: profileData.password || undefined,
                currentPassword: profileData.currentPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local storage user info
            const updatedUser = { ...JSON.parse(localStorage.getItem('user') || '{}'), ...res.data.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Clear passwords
            setProfileData(prev => ({
                ...prev,
                password: '',
                confirmPassword: '',
                currentPassword: ''
            }));

            alert('Profil mis à jour avec succès !');
        } catch (error) {
            alert(error.response?.data?.error || 'Erreur lors de la mise à jour du profil');
        } finally {
            setSavingProfile(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100 mb-8">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20">
                        <div className="flex items-center gap-3">
                            <img src={SurveillantLogo} alt="Logo" className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                            <div className="flex flex-col">
                                <span className="text-xl font-black text-blue-600 tracking-tight leading-none">Surveillant</span>
                                {schoolInfo && <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-1">{schoolInfo.name}</span>}
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <button onClick={() => navigate('/admin')} className="flex items-center gap-2 group transition-all">
                                <div className="w-10 h-10 rounded-full border-2 border-blue-600 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                    <LayoutDashboard className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600 hidden md:block uppercase tracking-wider">Dashboard</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 space-y-8">

                {/* Suspension Banner */}
                {schoolInfo && schoolInfo.status === 'suspended' && (
                    <div className="mb-6 p-4 bg-red-600 rounded-xl shadow text-white flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <Mail className="w-8 h-8" />
                            <div>
                                <h3 className="font-bold">⚠️ Votre école a été suspendue</h3>
                                <p className="text-sm text-red-100">Veuillez contacter l'administrateur du site.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => window.open(`https://wa.me/${schoolInfo?.support_whatsapp || '22246473111'}`, '_blank')}
                            className="px-4 py-2 bg-white text-red-600 rounded-lg font-bold text-sm shadow-sm hover:bg-red-50"
                        >
                            Contacter le Support
                        </button >
                    </div >
                )}

                {/* SMTP Configuration Section (Originally Main Section) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-800 px-6 py-4 flex items-center gap-3">
                        <Mail className="text-white w-6 h-6" />
                        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Configuration Email (SMTP)</h2>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-xl">
                            <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2 italic">
                                💡 Guide Rapide Gmail
                            </h3>
                            <p className="text-xs text-blue-700 mt-2 leading-relaxed">
                                1. Activez la <strong>Validation en 2 étapes</strong> sur Google.<br />
                                2. Créez un <strong>Mot de passe d'application</strong> (16 caractères).<br />
                                3. Copiez ce mot de passe ci-dessous.
                            </p>
                            <div className="mt-3 flex gap-3">
                                <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase text-blue-600 hover:underline">Accéder à Google App Passwords →</a>
                            </div>
                        </div>

                        <form onSubmit={handleSaveSMTP} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Serveur SMTP</label>
                                <input
                                    type="text" name="smtp_host"
                                    value={emailSettings.smtp_host} onChange={handleChange}
                                    className="w-full p-2 bg-gray-50 border rounded-lg focus:ring-1 focus:ring-blue-400 outline-none text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Port</label>
                                <input
                                    type="number" name="smtp_port"
                                    value={emailSettings.smtp_port} onChange={handleChange}
                                    className="w-full p-2 bg-gray-50 border rounded-lg focus:ring-1 focus:ring-blue-400 outline-none text-sm"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Utilisateur SMTP (Gmail)</label>
                                <input
                                    type="email" name="smtp_user"
                                    value={emailSettings.smtp_user} onChange={handleChange}
                                    className="w-full p-2 bg-gray-50 border rounded-lg focus:ring-1 focus:ring-blue-400 outline-none text-sm"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Mot de Passe d'Application</label>
                                <input
                                    type="password" name="smtp_pass"
                                    value={emailSettings.smtp_pass} onChange={handleChange}
                                    placeholder="Ex: abcd efgh ijkl mnop"
                                    className="w-full p-2 bg-gray-50 border rounded-lg focus:ring-1 focus:ring-blue-400 outline-none text-sm"
                                />
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-gray-800 hover:bg-black text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-2"
                                >
                                    <Save className="w-3 h-3" /> Sauvegarder SMTP
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Account Credentials Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center gap-3">
                        <User className="text-white w-6 h-6" />
                        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Paramètres du Compte</h2>
                    </div>

                    {/* School Code Badge */}
                    <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Code Unique de l'Établissement</span>
                            <span className="text-2xl font-mono font-black text-blue-700 tracking-wider">
                                {schoolInfo?.unique_code || '---'}
                            </span>
                        </div>
                        <div className="px-3 py-1 bg-blue-600 rounded-lg text-white text-[10px] font-bold uppercase cursor-help" title="Partagez ce code avec les parents">
                            ID École
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                    <User className="w-3 h-3" /> Nom de l'Administrateur
                                </label>
                                <input
                                    type="text" name="name"
                                    value={profileData.name} onChange={handleProfileChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                    <Mail className="w-3 h-3" /> Email de Connexion
                                </label>
                                <input
                                    type="email" name="email"
                                    value={profileData.email} onChange={handleProfileChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                    <Lock className="w-3 h-3" /> Nouveau Mot de Passe
                                </label>
                                <input
                                    type="password" name="password"
                                    value={profileData.password} onChange={handleProfileChange}
                                    placeholder="Laisser vide pour ne pas changer"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3" /> Confirmer Mot de Passe
                                </label>
                                <input
                                    type="password" name="confirmPassword"
                                    value={profileData.confirmPassword} onChange={handleProfileChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium text-sm"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4 rounded-r-xl">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="text-amber-600 w-5 h-5 flex-shrink-0" />
                                    <p className="text-xs text-amber-800 font-medium">
                                        Pour valider ces changements, veuillez entrer votre <strong>mot de passe actuel</strong> ci-dessous.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row items-end gap-4">
                                <div className="w-full md:w-64 space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Mot de Passe Actuel</label>
                                    <input
                                        type="password" name="currentPassword"
                                        value={profileData.currentPassword} onChange={handleProfileChange}
                                        className="w-full p-3 bg-white border-2 border-blue-100 rounded-xl focus:border-blue-500 outline-none transition-all font-bold"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={savingProfile}
                                    className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:bg-gray-400"
                                >
                                    {savingProfile ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    <span>Sauvegarder mon Profil</span>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

            </div >
        </div >
    );
};

export default AdminSettings;
