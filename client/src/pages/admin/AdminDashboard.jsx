import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardCheck, LogOut, Edit, Trash2, Settings, Clock, Trophy, BarChart3, BookOpen, GraduationCap, ArrowLeft, Plus } from 'lucide-react';
import { API_URL } from '../../config';
import SentinelWidget from '../../components/SentinelWidget';
import SurveillantLogo from '../../assets/Surveillant.jpeg';

const AdminDashboard = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newStudentName, setNewStudentName] = useState('');
    const [parentEmail, setParentEmail] = useState('');
    const [nsi, setNsi] = useState('');
    const [cycle, setCycle] = useState('Primaire');
    const [niveau, setNiveau] = useState('Classe 1');
    const [serie, setSerie] = useState('');
    const [photo, setPhoto] = useState(null);
    const [editPhoto, setEditPhoto] = useState(null);
    const [classList, setClassList] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [schoolInfo, setSchoolInfo] = useState(null);
    const [emailConfigured, setEmailConfigured] = useState(true);

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCycle, setFilterCycle] = useState('');
    const [filterLevel, setFilterLevel] = useState('');
    const [filterClass, setFilterClass] = useState('');

    // Edit Student State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    const toLatinDigits = (str) => {
        if (!str) return '';
        const arabic = '٠١٢٣٤٥٦٧٨٩';
        const farsi = '۰۱۲۳۴۵۶۷۸۹';
        return str.toString()
            .replace(/[٠-٩]/g, (d) => arabic.indexOf(d))
            .replace(/[۰-۹]/g, (d) => farsi.indexOf(d));
    };

    const navigate = useNavigate();

    useEffect(() => {
        const loadData = async () => {
            await fetchStudents();
            await fetchClasses();
            await fetchSchoolInfo();
            await fetchEmailStatus();
        };
        loadData();
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

    const fetchEmailStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/schools/email-settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmailConfigured(!!(res.data && res.data.smtp_user));
        } catch (error) {
            console.error(error);
            setEmailConfigured(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/students`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(response.data);
        } catch (error) {
            console.error('Error fetching students:', error);
            if (error.response?.status === 401 || error.response?.status === 403) navigate('/login');
        } finally {
            setLoading(false);
        }
    };


    const fetchClasses = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get(`${API_URL}/classes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClassList(res.data);
            if (res.data.length > 0) setSelectedClassId(res.data[0].id);
        } catch (error) { console.error(error); }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const selectedClass = classList.find(c => c.id == selectedClassId);

            const data = new FormData();
            data.append('name', newStudentName);
            data.append('class_id', selectedClassId);
            data.append('parent_email', parentEmail);
            data.append('cycle', selectedClass ? selectedClass.cycle : cycle);
            data.append('niveau', selectedClass ? selectedClass.niveau : niveau);
            data.append('serie', cycle === 'Lycée' ? serie : '');
            if (photo) data.append('photo', photo);

            await axios.post(`${API_URL}/students`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setNewStudentName('');
            setParentEmail('');
            setNsi('');
            setCycle('Primaire');
            setNiveau('Classe 1');
            setSerie('');
            setPhoto(null);
            fetchStudents();
            alert('Élève ajouté avec succès!');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || 'Erreur lors de l\'ajout de l\'élève');
        }
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            Object.keys(editingStudent).forEach(key => {
                if (key !== 'photo_url') data.append(key, editingStudent[key] || '');
            });
            if (editPhoto) data.append('photo', editPhoto);

            await axios.put(`${API_URL}/students/${editingStudent.id}`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setIsEditModalOpen(false);
            setEditingStudent(null);
            setEditPhoto(null);
            fetchStudents();
            alert('Élève mis à jour avec succès!');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || 'Erreur lors de la mise à jour');
        }
    };

    const handleDeleteStudent = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet élève ? Toutes ses notes seront également supprimées.')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/students/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchStudents();
            alert('Élève supprimé.');
        } catch (error) {
            console.error(error);
            alert('Erreur lors de la suppression');
        }
    };



    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20">
                        <div className="flex items-center gap-3">
                            <img src={SurveillantLogo} alt="Logo" className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                            <div className="flex flex-col">
                                <span className="text-xl font-black text-blue-600 tracking-tight leading-none">Surveillant</span>
                                {user.school_name && <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-1">{user.school_name}</span>}
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <button onClick={() => navigate('/admin/subjects')} className="flex items-center gap-2 group transition-all">
                                <div className="w-10 h-10 rounded-full border-2 border-blue-600 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600 hidden md:block uppercase tracking-wider">Matières</span>
                            </button>

                            <button onClick={() => navigate('/admin/classes')} className="flex items-center gap-2 group transition-all">
                                <div className="w-10 h-10 rounded-full border-2 border-blue-600 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                    <GraduationCap className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600 hidden md:block uppercase tracking-wider">Classes</span>
                            </button>

                            <button onClick={() => navigate('/admin/statistics')} className="flex items-center gap-2 group transition-all">
                                <div className="w-10 h-10 rounded-full border-2 border-blue-600 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600 hidden md:block uppercase tracking-wider">Statistique</span>
                            </button>

                            <button onClick={() => window.open('https://wa.me/22238310476', '_blank')} className="flex items-center gap-2 group transition-all">
                                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white group-hover:bg-green-600 transition-all shadow-sm">
                                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72 1.036 3.702 1.582 5.712 1.583h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                    </svg>
                                </div>
                                <span className="text-xs font-bold text-gray-600 group-hover:text-green-600 hidden md:block uppercase tracking-wider">WhatsApp</span>
                            </button>

                            <button onClick={() => navigate('/admin/settings')} className="flex items-center gap-2 group transition-all relative">
                                <div className={`w-10 h-10 rounded-full border-2 ${!emailConfigured ? 'border-amber-500 animate-pulse' : 'border-blue-600'} flex items-center justify-center ${!emailConfigured ? 'text-amber-500' : 'text-blue-600'} group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm`}>
                                    <Settings className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600 hidden md:block uppercase tracking-wider">Paramètres</span>
                                    {!emailConfigured && <span className="text-[9px] text-amber-600 font-bold hidden md:block whitespace-nowrap animate-bounce">Config. Email</span>}
                                </div>
                                {!emailConfigured && <div className="absolute -top-1 right-0 w-3 h-3 bg-amber-500 border-2 border-white rounded-full"></div>}
                            </button>

                            <button onClick={handleLogout} className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all ml-4">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">

                    {/* Module Sentinelle */}
                    {schoolInfo && <SentinelWidget schoolId={schoolInfo.id} />}

                    {/* Add Student Form */}
                    {classList.length === 0 && (
                        <div className="p-4 mb-6 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded shadow-sm">
                            <div className="flex items-center">
                                <span className="text-xl mr-3">⚠️</span>
                                <div>
                                    <p className="font-bold">Configuration requise</p>
                                    <p className="text-sm">Vous n'avez pas encore configuré de classes. Pour ajouter des élèves, vous devez d'abord créer vos classes (ex: 1 AS1, CM2-A, etc.).</p>
                                    <button
                                        onClick={() => navigate('/admin/classes')}
                                        className="mt-2 text-sm font-bold underline hover:no-underline"
                                    >
                                        Cliquez ici pour gérer vos classes →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Suspension / Expiry Block Banner */}
                    {schoolInfo && schoolInfo.status === 'suspended' && (
                        <div className="mb-8 p-6 bg-red-600 rounded-2xl shadow-xl animate-in slide-in-from-top-4 duration-500">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4 text-white text-center md:text-left">
                                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                                        <Clock className="w-8 h-8 text-white animate-pulse" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black uppercase tracking-tight">École Suspendue</h2>
                                        <p className="text-red-100 font-medium leading-tight">
                                            ⚠️ Votre école a été suspendue. <br className="hidden md:block" />
                                            Veuillez contacter l'administrateur du site.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3 w-full md:w-auto">
                                    <button
                                        onClick={() => window.open(`https://wa.me/${schoolInfo?.support_whatsapp || '22246473111'}`, '_blank')}
                                        className="flex-1 md:flex-none px-8 py-3 bg-white text-red-600 rounded-xl font-bold shadow-lg hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>Nous Contacter</span>
                                        <span className="text-xl">💬</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Subscription Banner (Only for warnings, not when suspended) */}
                    {schoolInfo && schoolInfo.status !== 'suspended' && (
                        (() => {
                            const end = schoolInfo.subscription_end_date ? new Date(schoolInfo.subscription_end_date) : null;
                            const now = new Date();
                            const diffDays = end ? Math.ceil((end - now) / (1000 * 60 * 60 * 24)) : 30; // Default to 30 if null

                            if (diffDays <= 7) {
                                return (
                                    <div className={`p-4 mb-8 rounded-2xl border-2 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg transition-all ${diffDays <= 0 ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                                        }`}>
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-white/50 rounded-lg">
                                                <Clock className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-extrabold uppercase text-sm">Attention : Expiration Proche</p>
                                                <p className="text-sm opacity-90">
                                                    {diffDays <= 0
                                                        ? "Votre abonnement a expiré aujourd'hui."
                                                        : `Votre abonnement expire dans ${diffDays} jour${diffDays > 1 ? 's' : ''}.`}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => window.open('https://wa.me/22246473111', '_blank')}
                                            className="px-6 py-2 bg-white rounded-xl font-bold shadow-sm hover:shadow-md transition-all text-sm"
                                        >
                                            Contacter le Support
                                        </button>
                                    </div>
                                );
                            }
                            return null;
                        })()
                    )}

                    <div className="p-6 mb-6 bg-white rounded-lg shadow">
                        <h2 className="mb-4 text-lg font-bold">Ajouter un Nouvel Élève</h2>
                        <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text" placeholder="Nom de l'élève"
                                className="p-2 border rounded"
                                value={newStudentName} onChange={e => setNewStudentName(e.target.value)} required
                            />
                            <div className="p-2 border rounded bg-gray-50 flex flex-col justify-center">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">NSI (Auto-généré)</span>
                                <span className="text-gray-400 italic text-sm">Sera généré automatiquement</span>
                            </div>
                            <select
                                className="p-2 border rounded bg-blue-50 border-blue-200 font-bold"
                                value={selectedClassId}
                                onChange={e => setSelectedClassId(e.target.value)}
                                required
                            >
                                <option value="">-- Sélectionner une Classe --</option>
                                {classList.map(cls => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.cycle} — {cls.niveau} ({cls.name})
                                    </option>
                                ))}
                            </select>

                            {/* Show Série only if selected class is Lycée */}
                            {classList.find(c => c.id == selectedClassId)?.cycle === 'Lycée' && (
                                <select
                                    className="p-2 border rounded"
                                    value={serie}
                                    onChange={e => setSerie(e.target.value)}
                                >
                                    <option value="">Série (Optionnel)</option>
                                    <option value="LM">LM (Lettres Modernes)</option>
                                    <option value="SN">SN (Sciences Naturelles)</option>
                                    <option value="SE">SE (Sciences Exactes)</option>
                                    <option value="LO">LO (Lettres Originelles)</option>
                                </select>
                            )}

                            <input
                                type="email" placeholder="Email Parent"
                                className="p-2 border rounded"
                                value={parentEmail} onChange={e => setParentEmail(e.target.value)} required
                            />
                            <div className="flex flex-col">
                                <label className="text-xs font-semibold text-gray-500 mb-1">Photo de l'élève</label>
                                <input
                                    type="file" accept="image/*"
                                    className="p-1 border rounded text-sm"
                                    onChange={e => setPhoto(e.target.files[0])}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={schoolInfo?.status === 'suspended'}
                                className={`md:col-span-2 px-4 py-2 text-white rounded font-bold tracking-wide transition-all ${schoolInfo?.status === 'suspended'
                                    ? 'bg-gray-400 cursor-not-allowed opacity-50'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {schoolInfo?.status === 'suspended' ? 'Modification Impossible' : "Ajouter l'Élève"}
                            </button>
                        </form>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="p-4 mb-6 bg-white rounded-lg shadow border-t-4 border-blue-500">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                            <h3 className="text-sm font-bold text-gray-700 uppercase flex items-center">
                                <span className="mr-2">🔍</span> Recherche et Filtres
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilterCycle('');
                                        setFilterLevel('');
                                        setFilterClass('');
                                    }}
                                    className="text-[10px] text-blue-600 font-bold uppercase hover:underline"
                                >
                                    Réinitialiser
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <input
                                    type="text"
                                    placeholder="Rechercher par Nom ou NSI..."
                                    className="w-full p-2 border rounded text-sm shadow-sm"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(toLatinDigits(e.target.value))}
                                />
                            </div>
                            <select
                                className="p-2 border rounded bg-gray-50 text-sm"
                                value={filterCycle}
                                onChange={e => {
                                    setFilterCycle(e.target.value);
                                    setFilterLevel('');
                                    setFilterClass('');
                                }}
                            >
                                <option value="">Tous les Cycles</option>
                                <option value="Primaire">Primaire</option>
                                <option value="Collège">Collège</option>
                                <option value="Lycée">Lycée</option>
                            </select>
                            <select
                                className="p-2 border rounded bg-gray-50 text-sm"
                                value={filterClass}
                                onChange={e => setFilterClass(e.target.value)}
                            >
                                <option value="">Toutes les Classes</option>
                                {classList
                                    .filter(c => !filterCycle || c.cycle === filterCycle)
                                    .filter(c => !filterLevel || c.niveau === filterLevel)
                                    .map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.niveau})</option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>

                    <h1 className="mb-6 text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                        <GraduationCap className="w-8 h-8 text-blue-600" />
                        Liste des Classes
                    </h1>

                    {
                        loading ? <div className="text-center py-20 animate-pulse text-gray-400 font-bold uppercase tracking-widest">Chargement des données...</div> : (
                            <div className="space-y-8">
                                {Object.keys(classList.filter(c => {
                                    const matchesSearch = !searchTerm ||
                                        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        students.filter(s => s.class_id == c.id).some(s =>
                                            s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (s.nsi && s.nsi.includes(searchTerm.trim()))
                                        );
                                    const matchesCycle = !filterCycle || c.cycle === filterCycle;
                                    return matchesSearch && matchesCycle;
                                }).reduce((acc, c) => {
                                    const key = c.cycle;
                                    if (!acc[key]) acc[key] = [];
                                    acc[key].push(c);
                                    return acc;
                                }, {})).sort().map(cycle => {
                                    const groupedClasses = classList.filter(c => {
                                        const matchesCycle = c.cycle === cycle;
                                        const matchesSearch = !searchTerm ||
                                            c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            students.filter(s => s.class_id == c.id).some(s =>
                                                s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                (s.nsi && s.nsi.includes(searchTerm.trim()))
                                            );
                                        const matchesCycleFilter = !filterCycle || c.cycle === filterCycle;
                                        return matchesCycle && matchesSearch && matchesCycleFilter;
                                    });
                                    return (
                                        <div key={cycle} className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">{cycle}</h2>
                                                <div className="h-px bg-gray-200 flex-1"></div>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                                {groupedClasses.map((cls) => {
                                                    const studentCount = students.filter(s => s.class_id == cls.id).length;
                                                    return (
                                                        <div
                                                            key={cls.id}
                                                            onClick={() => navigate(`/admin/class/${cls.id}/students`)}
                                                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between h-32"
                                                        >
                                                            <div>
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                                                                        <Users className="w-4 h-4" />
                                                                    </div>
                                                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                                        {cls.niveau}
                                                                    </span>
                                                                </div>
                                                                <h3 className="text-base font-black text-gray-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors leading-tight">{cls.name}</h3>
                                                            </div>
                                                            <div className="flex items-center justify-between mt-4">
                                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                                                                    {studentCount} Élève{studentCount > 1 ? 's' : ''}
                                                                </span>
                                                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                                                                    <ArrowLeft className="w-4 h-4 rotate-180" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                                {classList.length === 0 && (
                                    <div className="bg-white p-20 rounded-2xl border-2 border-dashed border-gray-200 text-center">
                                        <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500 font-bold">Aucune classe configurée pour le moment.</p>
                                        <button onClick={() => navigate('/admin/classes')} className="mt-4 text-blue-600 font-black uppercase text-xs hover:underline">Créer ma première classe →</button>
                                    </div>
                                )}
                            </div>
                        )
                    }
                </div >
            </main >

            {/* Edit Student Modal */}
            {
                isEditModalOpen && editingStudent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                        <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
                            <div className="px-6 py-4 bg-blue-600 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white">Modifier l'Élève</h2>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-white hover:text-blue-100">✕</button>
                            </div>
                            <form onSubmit={handleUpdateStudent} className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Nom Complet</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                            value={editingStudent.name}
                                            onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">NSI (Identifiant Scolaire)</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded font-mono bg-gray-50 text-gray-500 cursor-not-allowed"
                                            value={editingStudent.nsi}
                                            readOnly
                                        />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Classe / Division</label>
                                        <select
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-blue-50 font-bold"
                                            value={editingStudent.class_id || ''}
                                            onChange={e => {
                                                const selectedClass = classList.find(c => c.id == e.target.value);
                                                setEditingStudent({
                                                    ...editingStudent,
                                                    class_id: e.target.value,
                                                    cycle: selectedClass ? selectedClass.cycle : editingStudent.cycle,
                                                    niveau: selectedClass ? selectedClass.niveau : editingStudent.niveau
                                                });
                                            }}
                                            required
                                        >
                                            <option value="">-- Choisir Classe --</option>
                                            {classList.map(cls => (
                                                <option key={cls.id} value={cls.id}>{cls.cycle} — {cls.niveau} ({cls.name})</option>
                                            ))}
                                        </select>
                                    </div>
                                    {editingStudent.cycle === 'Lycée' && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Série</label>
                                            <select
                                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                                value={editingStudent.serie || ''}
                                                onChange={e => setEditingStudent({ ...editingStudent, serie: e.target.value })}
                                            >
                                                <option value="">Sans Série</option>
                                                <option value="LM">LM</option>
                                                <option value="SN">SN</option>
                                                <option value="SE">SE</option>
                                                <option value="LO">LO</option>
                                            </select>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Email Parent</label>
                                        <input
                                            type="email"
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                            value={editingStudent.parent_email || ''}
                                            onChange={e => setEditingStudent({ ...editingStudent, parent_email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Photo (Laisser vide pour garder l'actuelle)</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                                            onChange={e => setEditPhoto(e.target.files[0])}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-md"
                                    >
                                        Sauvegarder les modifications
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AdminDashboard;
