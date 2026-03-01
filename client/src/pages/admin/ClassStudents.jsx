
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, LogOut, Edit, Trash2, Settings, Clock, LayoutDashboard, ArrowLeft, BarChart3, BookOpen, GraduationCap, X, Save, AlertTriangle } from 'lucide-react';
import { API_URL } from '../../config';
import SurveillantLogo from '../../assets/Surveillant.jpeg';

const ClassStudents = () => {
    const { classId } = useParams();
    const [students, setStudents] = useState([]);
    const [classInfo, setClassInfo] = useState(null);
    const [schoolInfo, setSchoolInfo] = useState(null);
    const [classList, setClassList] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [editPhoto, setEditPhoto] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Delete Confirm State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingStudent, setDeletingStudent] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            await fetchClassInfo();
            await fetchStudents();
            await fetchSchoolInfo();
            await fetchClasses();
        };
        loadData();
    }, [classId]);

    const fetchSchoolInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/schools/my-school`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSchoolInfo(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchClasses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/classes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClassList(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchClassInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/classes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const cls = res.data.find(c => c.id == classId);
            setClassInfo(cls);
        } catch (error) { console.error(error); }
    };

    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/students`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(response.data.filter(s => s.class_id == classId));
        } catch (error) {
            console.error('Error fetching students:', error);
            if (error.response?.status === 401 || error.response?.status === 403) navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
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
            alert(`Marqué ${status} pour l'élève`);
        } catch (error) {
            alert('Erreur: ' + (error.response?.data?.error || error.message));
        }
    };

    // ─── Edit Handlers ────────────────────────────────────────────────────────
    const openEditModal = (student) => {
        setEditingStudent({ ...student });
        setEditPhoto(null);
        setIsEditModalOpen(true);
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            Object.keys(editingStudent).forEach(key => {
                if (key !== 'photo_url' && key !== 'class_name' && key !== 'parent_name') {
                    data.append(key, editingStudent[key] || '');
                }
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
            await fetchStudents();
            await fetchClassInfo();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || 'Erreur lors de la mise à jour');
        } finally {
            setIsSaving(false);
        }
    };

    // ─── Delete Handlers ──────────────────────────────────────────────────────
    const openDeleteModal = (student) => {
        setDeletingStudent(student);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteStudent = async () => {
        if (!deletingStudent) return;
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/students/${deletingStudent.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsDeleteModalOpen(false);
            setDeletingStudent(null);
            await fetchStudents();
        } catch (error) {
            console.error(error);
            alert('Erreur lors de la suppression');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ─── Navbar ─────────────────────────────────────────────────────── */}
            <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/admin')}>
                            <img src={SurveillantLogo} alt="Logo" className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                            <div className="flex flex-col">
                                <span className="text-xl font-black text-blue-600 tracking-tight leading-none">Surveillant</span>
                                {user.school_name && <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-1">{user.school_name}</span>}
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <button onClick={() => navigate('/admin')} className="flex items-center gap-2 group transition-all">
                                <div className="w-10 h-10 rounded-full border-2 border-blue-600 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                    <LayoutDashboard className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600 hidden md:block uppercase tracking-wider">Dashboard</span>
                            </button>

                            <button onClick={handleLogout} className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all ml-4">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ─── Main Content ────────────────────────────────────────────────── */}
            <main className="py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="px-4 pb-6 sm:px-0">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/admin')} className="p-2 bg-white rounded-full shadow-sm border border-gray-200 text-gray-400 hover:text-blue-600 transition-all">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                                    {classInfo ? `${classInfo.name} (${classInfo.niveau})` : 'Chargement...'}
                                </h1>
                                <p className="text-gray-500 text-sm font-medium">Liste des étudiants inscrits</p>
                            </div>
                        </div>
                        <div className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md">
                            {students.length} Élève{students.length > 1 ? 's' : ''}
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-gray-400 font-bold animate-pulse">Chargement des élèves...</div>
                    ) : (
                        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                            <ul className="divide-y divide-gray-100">
                                {students.map((student) => (
                                    <li key={student.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            {/* Student Info (clickable) */}
                                            <div
                                                className="flex items-center flex-1 cursor-pointer group min-w-0"
                                                onClick={() => navigate(`/admin/student/${student.id}/documents`)}
                                            >
                                                <div className="flex-shrink-0">
                                                    {student.photo_url ? (
                                                        <img
                                                            src={`${API_URL.replace('/api', '')}${student.photo_url}`}
                                                            className="w-14 h-14 rounded-full object-cover border-2 border-blue-100 shadow-sm"
                                                            alt=""
                                                        />
                                                    ) : (
                                                        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                                            <Users className="w-7 h-7" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4 min-w-0">
                                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight truncate">{student.name}</h3>
                                                    <div className="text-xs text-gray-500 flex items-center gap-3 mt-1 flex-wrap">
                                                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">NSI: {student.nsi}</span>
                                                        {student.parent_email && <span className="italic truncate">{student.parent_email}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {/* Attendance */}
                                                <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); markAttendance(student.id, 'absent'); }}
                                                        title="Marquer Absent"
                                                        className="px-4 py-1 text-[10px] font-black uppercase text-red-600 hover:bg-red-600 hover:text-white rounded transition-all flex items-center gap-1"
                                                    >
                                                        <span className="w-2 h-2 bg-red-600 rounded-full group-hover:bg-white"></span>
                                                        Absent (A)
                                                    </button>
                                                </div>

                                                {/* Edit */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openEditModal(student); }}
                                                    title="Modifier l'élève"
                                                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openDeleteModal(student); }}
                                                    title="Supprimer l'élève"
                                                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                                {students.length === 0 && (
                                    <li className="p-20 text-center text-gray-400 italic">Aucun élève dans cette classe.</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </main>

            {/* ─── Edit Modal ──────────────────────────────────────────────────── */}
            {isEditModalOpen && editingStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                    <Edit className="w-4 h-4 text-white" />
                                </div>
                                <h2 className="text-lg font-black text-white uppercase tracking-tight">Modifier l'Élève</h2>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Photo preview */}
                        <div className="flex justify-center pt-5 pb-2">
                            {editingStudent.photo_url && !editPhoto ? (
                                <img
                                    src={`${API_URL.replace('/api', '')}${editingStudent.photo_url}`}
                                    className="w-20 h-20 rounded-full object-cover border-4 border-blue-100 shadow-md"
                                    alt=""
                                />
                            ) : editPhoto ? (
                                <img
                                    src={URL.createObjectURL(editPhoto)}
                                    className="w-20 h-20 rounded-full object-cover border-4 border-blue-100 shadow-md"
                                    alt=""
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-blue-300 border-4 border-blue-100 shadow-md">
                                    <Users className="w-10 h-10" />
                                </div>
                            )}
                        </div>

                        {/* Form */}
                        <form onSubmit={handleUpdateStudent} className="px-6 pb-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Nom */}
                                <div className="sm:col-span-2 space-y-1">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nom Complet</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-semibold text-gray-800 transition-all"
                                        value={editingStudent.name}
                                        onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* NSI (read-only) */}
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">NSI (Auto)</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 font-mono text-sm cursor-not-allowed"
                                        value={editingStudent.nsi || ''}
                                        readOnly
                                    />
                                </div>

                                {/* Classe */}
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Classe</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-semibold bg-blue-50 transition-all"
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

                                {/* Série (Lycée only) */}
                                {editingStudent.cycle === 'Lycée' && (
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Série</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold transition-all"
                                            value={editingStudent.serie || ''}
                                            onChange={e => setEditingStudent({ ...editingStudent, serie: e.target.value })}
                                        >
                                            <option value="">Sans Série</option>
                                            <option value="LM">LM (Lettres Modernes)</option>
                                            <option value="SN">SN (Sciences Naturelles)</option>
                                            <option value="SE">SE (Sciences Exactes)</option>
                                            <option value="LO">LO (Lettres Originelles)</option>
                                        </select>
                                    </div>
                                )}

                                {/* Email Parent */}
                                <div className={`space-y-1 ${editingStudent.cycle === 'Lycée' ? '' : 'sm:col-span-2'}`}>
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Email du Parent</label>
                                    <input
                                        type="email"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
                                        value={editingStudent.parent_email || ''}
                                        onChange={e => setEditingStudent({ ...editingStudent, parent_email: e.target.value })}
                                        placeholder="email@parent.com"
                                    />
                                </div>

                                {/* Photo */}
                                <div className="sm:col-span-2 space-y-1">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nouvelle Photo (laisser vide pour conserver)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600 file:font-bold hover:file:bg-blue-100 transition-all"
                                        onChange={e => setEditPhoto(e.target.files[0])}
                                    />
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-5 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Sauvegarde...</>
                                    ) : (
                                        <><Save className="w-4 h-4" /> Sauvegarder</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Delete Confirmation Modal ───────────────────────────────────── */}
            {isDeleteModalOpen && deletingStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-4 bg-red-600 flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tight">Confirmer la Suppression</h2>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-6">
                            <p className="text-gray-700 text-sm font-medium leading-relaxed">
                                Vous êtes sur le point de supprimer l'élève :
                            </p>
                            <div className="my-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-400 flex-shrink-0">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-black text-gray-900 uppercase text-sm">{deletingStudent.name}</p>
                                    <p className="text-xs text-gray-500 font-mono">NSI: {deletingStudent.nsi}</p>
                                </div>
                            </div>
                            <p className="text-xs text-red-600 font-semibold">
                                ⚠️ Cette action est irréversible. Toutes les notes et présences associées seront également supprimées.
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 px-6 pb-6">
                            <button
                                onClick={() => { setIsDeleteModalOpen(false); setDeletingStudent(null); }}
                                className="flex-1 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDeleteStudent}
                                disabled={isDeleting}
                                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? (
                                    <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Suppression...</>
                                ) : (
                                    <><Trash2 className="w-4 h-4" /> Supprimer</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassStudents;
