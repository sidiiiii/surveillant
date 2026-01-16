import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Mail, Send, Loader } from 'lucide-react';

const AdminSettings = () => {
    const navigate = useNavigate();
    const [emailSettings, setEmailSettings] = useState({
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: '',
        smtp_pass: ''
    });
    const [originalSettings, setOriginalSettings] = useState({});
    const [testEmail, setTestEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState(false);
    const [schoolInfo, setSchoolInfo] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get(`${API_URL}/schools/email-settings`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data) {
                    const settings = {
                        smtp_host: res.data.smtp_host || 'smtp.gmail.com',
                        smtp_port: res.data.smtp_port || 587,
                        smtp_user: res.data.smtp_user || '',
                        smtp_pass: res.data.has_password ? '********' : ''
                    };
                    setEmailSettings(settings);
                    setOriginalSettings(settings);
                    // Default test email to current user email if available
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    if (user.email) setTestEmail(user.email);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
        fetchSchoolInfo();
    }, []);

    const fetchSchoolInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/schools/my-school`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSchoolInfo(res.data);
        } catch (error) { console.error(error); }
    };

    const handleChange = (e) => {
        setEmailSettings({ ...emailSettings, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        // Check if password is "********", if so, don't send it (means unchanged)
        const payload = { ...emailSettings };
        if (payload.smtp_pass === '********') {
            delete payload.smtp_pass;
        } else {
            // Strip spaces from password just in case user copy-pasted 'xxxx xxxx xxxx'
            payload.smtp_pass = payload.smtp_pass.replace(/\s/g, '');
        }

        try {
            await axios.post(`${API_URL}/schools/email-settings`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Configuration email sauvegardée avec succès !');
        } catch (error) {
            console.error(error);
            alert('Erreur lors de la sauvegarde');
        }
    };

    const handleTest = async () => {
        if (!testEmail) return alert('Veuillez entrer une adresse email de test');
        setTesting(true);
        const token = localStorage.getItem('token');

        // Prepare config to test (use current form state)
        const payload = { ...emailSettings, test_email: testEmail };

        // If password is masked, we can't test unless it's saved in DB. 
        // But for testing 'live' changes, user must re-enter password if they changed it.
        // If they didn't change it (masked), backend should use saved one? 
        // Our backend test route currently expects password. 
        // Let's modify logic: if masked, user must have saved first or we rely on backend to fetch?
        // Actually, backend test route currently takes params. If password is '********', backend can't verify it.
        // Warning: We can't test '********'. User must save first or enter real password.

        if (payload.smtp_pass === '********') {
            alert("Veuillez d'abord sauvegarder les paramètres ou entrer le mot de passe réel pour tester.");
            setTesting(false);
            return;
        } else {
            payload.smtp_pass = payload.smtp_pass.replace(/\s/g, '');
        }

        try {
            const res = await axios.post(`${API_URL}/schools/test-email-config`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(res.data.message);
        } catch (error) {
            alert(error.response?.data?.error || 'Erreur lors du test');
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate('/admin')} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Configuration Email de l'École</h1>
                </div>

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
                        </button>
                    </div>
                )}

                <div className="space-y-6">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <Mail className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-bold text-blue-800">Configuration Email (SMTP) - Guide Gmail</h3>
                                <div className="mt-2 text-sm text-blue-700 space-y-2">
                                    <p>Pour utiliser votre adresse Gmail comme expéditeur, vous devez suivre ces deux étapes obligatoires :</p>
                                    <ol className="list-decimal pl-5 space-y-1">
                                        <li>
                                            Activer la <strong>Validation en 2 étapes</strong> sur votre compte Google :<br />
                                            <a href="https://myaccount.google.com/signinoptions/two-step-verification" target="_blank" rel="noopener noreferrer" className="underline font-bold text-blue-900 hover:text-blue-600">
                                                Cliquez ici pour activer la Validation en 2 étapes
                                            </a>
                                        </li>
                                        <li>
                                            Générer un <strong>Mot de passe d'application</strong> (c'est ce mot de passe que vous devrez coller ci-dessous) :<br />
                                            <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-bold text-blue-900 hover:text-blue-600">
                                                Cliquez ici pour générer un Mot de passe d'application
                                            </a>
                                            <br /><span className="text-xs text-blue-600 italic">(Sélectionnez "Messagerie" et "Ordinateur Windows" si demandé)</span>
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Serveur SMTP</label>
                                <input
                                    type="text"
                                    name="smtp_host"
                                    value={emailSettings.smtp_host}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Port</label>
                                <input
                                    type="number"
                                    name="smtp_port"
                                    value={emailSettings.smtp_port}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Utilisateur SMTP (Votre Email Gmail)</label>
                                <input
                                    type="email"
                                    name="smtp_user"
                                    value={emailSettings.smtp_user}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Mot de passe d'application (Généré à l'étape 2)</label>
                                <input
                                    type="password"
                                    name="smtp_pass"
                                    value={emailSettings.smtp_pass}
                                    onChange={handleChange}
                                    placeholder="Ex: abcd efgh ijkl mnop"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                />
                                <p className="text-xs text-gray-500 mt-1">Laissez vide ou '********' pour ne pas changer le mot de passe actuel.</p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={schoolInfo?.status === 'suspended'}
                                className={`inline-flex justify-center py-2 px-4 shadow-sm text-sm font-medium rounded-md text-white transition-all ${schoolInfo?.status === 'suspended'
                                    ? 'bg-gray-400 cursor-not-allowed opacity-70'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {schoolInfo?.status === 'suspended' ? 'Action Restreinte' : 'Sauvegarder la Configuration Email'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
