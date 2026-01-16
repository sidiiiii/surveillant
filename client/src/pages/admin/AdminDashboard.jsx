import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardCheck, LogOut, Edit, Trash2, Settings, Clock } from 'lucide-react';
import { API_URL } from '../../config';

const AdminDashboard = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newStudentName, setNewStudentName] = useState('');
    const [parentEmail, setParentEmail] = useState('');
    const [nni, setNni] = useState('');
    const [cycle, setCycle] = useState('Primaire');
    const [niveau, setNiveau] = useState('Classe 1');
    const [serie, setSerie] = useState('');
    const [photo, setPhoto] = useState(null);
    const [editPhoto, setEditPhoto] = useState(null);
    const [classList, setClassList] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [schoolInfo, setSchoolInfo] = useState(null);

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
            .replace(/\s/g, '')
            .replace(/[٠-٩]/g, (d) => arabic.indexOf(d))
            .replace(/[۰-۹]/g, (d) => farsi.indexOf(d));
    };

    const navigate = useNavigate();

    useEffect(() => {
        const loadData = async () => {
            await fetchStudents();
            await fetchSubjects();
            await fetchClasses();
            await fetchSchoolInfo();
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

    const fetchSubjects = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get(`${API_URL}/subjects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubjects(res.data);
            if (res.data.length > 0) setSelectedSubject(res.data[0].id);
        } catch (error) { console.error(error); }
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
            data.append('nni', nni);
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
            setNni('');
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



    const markAttendance = async (studentId, status) => {
        const token = localStorage.getItem('token');
        try {
            await axios.post(`${API_URL}/attendance`, {
                student_id: studentId,
                date: new Date().toISOString().split('T')[0],
                status
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Marked ${status} for student ${studentId}`);
        } catch (error) {
            console.error('Attendance Error:', error);
            console.error('Error Response:', error.response?.data);
            alert('Error marking attendance: ' + (error.response?.data?.error || error.message));
        }
    };

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                                <span className="text-xl font-bold text-blue-600">School Admin</span>
                                {user.school_name && <span className="text-xs text-gray-500 font-medium tracking-wider uppercase">{user.school_name}</span>}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/admin/subjects')} className="text-gray-600 font-medium hover:text-blue-600">Ajouter Matière</button>
                            <button onClick={() => navigate('/admin/classes')} className="text-gray-600 font-medium hover:text-blue-600">Ajouter Classe</button>
                            <button onClick={() => navigate('/admin/settings')} className="text-gray-600 font-medium hover:text-blue-600 flex items-center">
                                <Settings className="w-5 h-5 mr-1" /> Email
                            </button>
                            <button onClick={handleLogout} className="flex items-center text-gray-600 hover:text-gray-900 border-l pl-4 ml-2">
                                <LogOut className="w-5 h-5 mr-2" /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">

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
                            <input
                                type="text" placeholder="NNI (ex: 1234567890)"
                                className="p-2 border rounded font-mono"
                                value={nni} onChange={e => setNni(toLatinDigits(e.target.value))} required
                            />
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
                                    placeholder="Rechercher par Nom ou NNI..."
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

                    <h1 className="mb-6 text-2xl font-bold text-gray-900">Student List</h1>

                    {
                        loading ? <div className="text-center">Loading...</div> : (
                            <div className="overflow-scroll bg-white shadow sm:rounded-lg">
                                {Object.keys(students.filter(s => {
                                    const matchesSearch = !searchTerm ||
                                        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        (s.nni && s.nni.includes(searchTerm));
                                    const matchesCycle = !filterCycle || s.cycle === filterCycle;
                                    const matchesLevel = !filterLevel || s.niveau === filterLevel;
                                    const matchesClass = !filterClass || s.class_id == filterClass;
                                    return matchesSearch && matchesCycle && matchesLevel && matchesClass;
                                }).reduce((acc, s) => {
                                    const key = `${s.cycle} — ${s.niveau}`;
                                    if (!acc[key]) acc[key] = [];
                                    acc[key].push(s);
                                    return acc;
                                }, {})).sort().map(levelKey => {
                                    const groupedStudents = students.filter(s => {
                                        const matchesKey = `${s.cycle} — ${s.niveau}` === levelKey;
                                        const matchesSearch = !searchTerm ||
                                            s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (s.nni && s.nni.includes(searchTerm));
                                        const matchesCycle = !filterCycle || s.cycle === filterCycle;
                                        const matchesLevel = !filterLevel || s.niveau === filterLevel;
                                        const matchesClass = !filterClass || s.class_id == filterClass;
                                        return matchesKey && matchesSearch && matchesCycle && matchesLevel && matchesClass;
                                    });
                                    return (
                                        <div key={levelKey} className="border-b last:border-b-0">
                                            <div className="bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 border-b uppercase flex justify-between items-center">
                                                <span>{levelKey}</span>
                                                <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                                                    {groupedStudents.length} {groupedStudents.length > 1 ? 'Élèves' : 'Élève'}
                                                </span>
                                            </div>
                                            <ul className="divide-y divide-gray-100">
                                                {groupedStudents.map((student) => (
                                                    <li key={student.id} className="p-4 hover:bg-gray-50 border-l-4 border-transparent hover:border-blue-500 transition-colors">
                                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                            <div
                                                                className="flex items-center flex-1 cursor-pointer hover:bg-blue-50 -mx-4 -my-4 px-4 py-4 rounded transition-colors"
                                                                onClick={() => navigate(`/admin/student/${student.id}/documents`)}
                                                                title="Cliquez pour voir les documents (exercices, devoirs, examens)"
                                                            >
                                                                <div className="flex-shrink-0">
                                                                    {student.photo_url ? (
                                                                        <img
                                                                            src={`${API_URL.replace('/api', '')}${student.photo_url}`}
                                                                            alt={student.name}
                                                                            className="w-12 h-12 rounded-full object-cover border-2 border-blue-100 shadow-sm"
                                                                        />
                                                                    ) : (
                                                                        <span className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full shadow-sm text-blue-600">
                                                                            <Users className="w-6 h-6" />
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{student.name}</h3>
                                                                        <span className="px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-100 rounded border border-blue-200 uppercase tracking-tighter">
                                                                            {student.class_name || 'Sans Classe'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                                                        <span className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">NNI: {student.nni}</span>
                                                                        <span>•</span>
                                                                        <span className="italic">Parent: {student.parent_email || 'Non renseigné'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (schoolInfo?.status === 'suspended') return;
                                                                            setEditingStudent({ ...student });
                                                                            setIsEditModalOpen(true);
                                                                        }}
                                                                        disabled={schoolInfo?.status === 'suspended'}
                                                                        className={`p-1.5 rounded-full transition-colors ${schoolInfo?.status === 'suspended'
                                                                            ? 'text-gray-300 cursor-not-allowed'
                                                                            : 'text-blue-600 hover:bg-blue-100'
                                                                            }`}
                                                                        title={schoolInfo?.status === 'suspended' ? 'Restriction' : "Modifier"}
                                                                    >
                                                                        <Edit className="w-5 h-5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (schoolInfo?.status === 'suspended') return;
                                                                            handleDeleteStudent(student.id);
                                                                        }}
                                                                        disabled={schoolInfo?.status === 'suspended'}
                                                                        className={`p-1.5 rounded-full transition-colors ${schoolInfo?.status === 'suspended'
                                                                            ? 'text-gray-300 cursor-not-allowed'
                                                                            : 'text-red-500 hover:bg-red-100'
                                                                            }`}
                                                                        title={schoolInfo?.status === 'suspended' ? 'Restriction' : "Supprimer"}
                                                                    >
                                                                        <Trash2 className="w-5 h-5" />
                                                                    </button>
                                                                </div>
                                                                <div className="h-4 w-px bg-gray-200 hidden sm:block mx-1"></div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex flex-wrap gap-1">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (schoolInfo?.status === 'suspended') return;
                                                                                markAttendance(student.id, 'present');
                                                                            }}
                                                                            disabled={schoolInfo?.status === 'suspended'}
                                                                            className={`p-1 px-1.5 text-[9px] font-bold rounded border transition-colors uppercase ${schoolInfo?.status === 'suspended'
                                                                                ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                                                                                : 'text-green-600 border-green-200 hover:bg-green-50'
                                                                                }`}
                                                                            title="Présent"
                                                                        >
                                                                            P
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (schoolInfo?.status === 'suspended') return;
                                                                                markAttendance(student.id, 'late');
                                                                            }}
                                                                            disabled={schoolInfo?.status === 'suspended'}
                                                                            className={`p-1 px-1.5 text-[9px] font-bold rounded border transition-colors uppercase ${schoolInfo?.status === 'suspended'
                                                                                ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                                                                                : 'text-yellow-600 border-yellow-200 hover:bg-yellow-50'
                                                                                }`}
                                                                            title="En retard"
                                                                        >
                                                                            R
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (schoolInfo?.status === 'suspended') return;
                                                                                markAttendance(student.id, 'absent');
                                                                            }}
                                                                            disabled={schoolInfo?.status === 'suspended'}
                                                                            className={`p-1 px-1.5 text-[9px] font-bold rounded border transition-colors uppercase font-black ${schoolInfo?.status === 'suspended'
                                                                                ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                                                                                : 'text-red-700 border-red-200 hover:bg-red-50'
                                                                                }`}
                                                                            title="Absent toute la journée"
                                                                        >
                                                                            A
                                                                        </button>
                                                                        <div className="flex bg-gray-50 rounded p-0.5 border border-gray-100 italic">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (schoolInfo?.status === 'suspended') return;
                                                                                    markAttendance(student.id, 'absent_8h_10h');
                                                                                }}
                                                                                disabled={schoolInfo?.status === 'suspended'}
                                                                                className={`p-1 px-1 text-[9px] font-bold rounded transition-colors uppercase ${schoolInfo?.status === 'suspended'
                                                                                    ? 'text-gray-300 cursor-not-allowed'
                                                                                    : 'text-red-600 hover:bg-red-50'
                                                                                    }`}
                                                                                title="Absent 08:00 - 10:00"
                                                                            >
                                                                                8-10
                                                                            </button>
                                                                            <div className="w-px bg-gray-200 mx-0.5"></div>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (schoolInfo?.status === 'suspended') return;
                                                                                    markAttendance(student.id, 'absent_10h_12h');
                                                                                }}
                                                                                disabled={schoolInfo?.status === 'suspended'}
                                                                                className={`p-1 px-1 text-[9px] font-bold rounded transition-colors uppercase ${schoolInfo?.status === 'suspended'
                                                                                    ? 'text-gray-300 cursor-not-allowed'
                                                                                    : 'text-red-600 hover:bg-red-50'
                                                                                    }`}
                                                                                title="Absent 10:00 - 12:00"
                                                                            >
                                                                                10-12
                                                                            </button>
                                                                            <div className="w-px bg-gray-200 mx-0.5"></div>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (schoolInfo?.status === 'suspended') return;
                                                                                    markAttendance(student.id, 'absent_12h_14h');
                                                                                }}
                                                                                disabled={schoolInfo?.status === 'suspended'}
                                                                                className={`p-1 px-1 text-[9px] font-bold rounded transition-colors uppercase ${schoolInfo?.status === 'suspended'
                                                                                    ? 'text-gray-300 cursor-not-allowed'
                                                                                    : 'text-red-600 hover:bg-red-50'
                                                                                    }`}
                                                                                title="Absent 12:00 - 14:00"
                                                                            >
                                                                                12-14
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                </div>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })}
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
                                        <label className="text-xs font-semibold text-gray-500 uppercase">NNI</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded font-mono focus:ring-2 focus:ring-blue-500"
                                            value={editingStudent.nni}
                                            onChange={e => setEditingStudent({ ...editingStudent, nni: toLatinDigits(e.target.value) })}
                                            required
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
