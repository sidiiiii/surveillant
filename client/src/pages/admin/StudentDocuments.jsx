import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';
import { ArrowLeft, Upload, Trash2, FileText, BookOpen, ClipboardList, GraduationCap, ClipboardCheck } from 'lucide-react';

const StudentDocuments = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadType, setUploadType] = useState('exercice');
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadDescription, setUploadDescription] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [gradeValue, setGradeValue] = useState('');
    const [gradeType, setGradeType] = useState('devoir');
    const [gradePeriod, setGradePeriod] = useState('T1');
    const [gradeComment, setGradeComment] = useState('');
    const [isGradeFormOpen, setIsGradeFormOpen] = useState(false);
    const [schoolInfo, setSchoolInfo] = useState(null);

    useEffect(() => {
        fetchStudentData();
        fetchDocuments();
        fetchSubjects();
        fetchGrades();
        fetchAttendance();
        fetchSchoolInfo();
    }, [studentId]);

    const fetchSchoolInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/schools/my-school`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSchoolInfo(res.data);
        } catch (error) { console.error(error); }
    };

    const [grades, setGrades] = useState([]);
    const [attendance, setAttendance] = useState([]);

    const fetchSubjects = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/subjects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubjects(res.data);
            if (res.data.length > 0) setSelectedSubject(res.data[0].id);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchStudentData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/students`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const foundStudent = response.data.find(s => s.id == studentId);
            setStudent(foundStudent);
        } catch (error) {
            console.error('Error fetching student:', error);
        }
    };

    const fetchDocuments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/students/${studentId}/documents`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDocuments(response.data);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGrades = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/grades/${studentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGrades(response.data);
        } catch (error) {
            console.error('Error fetching grades:', error);
        }
    };

    const fetchAttendance = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/attendance/${studentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAttendance(response.data);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        }
    };

    const handleDeleteAttendance = async (id) => {
        if (!window.confirm('Supprimer cet enregistrement de présence ?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/attendance/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAttendance();
        } catch (error) {
            console.error('Error deleting attendance:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) {
            alert('Veuillez sélectionner un fichier');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', uploadFile);
            formData.append('type', uploadType);
            formData.append('description', uploadDescription);

            await axios.post(`${API_URL}/students/${studentId}/documents`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert('Document téléchargé avec succès!');
            setUploadFile(null);
            setUploadDescription('');
            fetchDocuments();
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Erreur lors du téléchargement');
        }
    };

    const handleDelete = async (docId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/students/${studentId}/documents/${docId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Document supprimé');
            fetchDocuments();
        } catch (error) {
            console.error('Error deleting document:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const handleAddGrade = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await axios.post(`${API_URL}/grades`, {
                student_id: studentId,
                subject_id: selectedSubject,
                grade: gradeValue,
                type: gradeType,
                period: gradePeriod,
                comment: gradeComment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Note enregistrée avec succès ! Notification envoyée au parent.');
            setGradeValue('');
            setGradeComment('');
            setIsGradeFormOpen(false);
            fetchGrades(); // Refresh grades list
        } catch (error) {
            console.error('Error adding grade:', error);
            alert('Erreur lors de l\'ajout de la note');
        }
    };

    const handleDeleteGrade = async (gradeId) => {
        if (!window.confirm('Supprimer cette note ?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/grades/${gradeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchGrades();
        } catch (error) {
            console.error('Error deleting grade:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'exercice':
                return <FileText className="w-5 h-5 text-blue-600" />;
            case 'devoir':
                return <BookOpen className="w-5 h-5 text-green-600" />;
            case 'examen':
                return <ClipboardList className="w-5 h-5 text-red-600" />;
            default:
                return <FileText className="w-5 h-5 text-gray-600" />;
        }
    };

    const getTypeBadgeColor = (type) => {
        switch (type) {
            case 'exercice':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'devoir':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'examen':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const groupedDocuments = documents.reduce((acc, doc) => {
        if (!acc[doc.type]) acc[doc.type] = [];
        acc[doc.type].push(doc);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Suspension Banner */}
                {schoolInfo && schoolInfo.status === 'suspended' && (
                    <div className="mb-6 p-4 bg-red-600 rounded-xl shadow text-white flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <Plus className="w-8 h-8 rotate-45" />
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
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/admin')}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 shadow shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="shrink-0">
                            {student?.photo_url ? (
                                <img
                                    src={`${API_URL.replace('/api', '')}${student.photo_url}`}
                                    alt={student.name}
                                    className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
                                />
                            ) : (
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 shadow-inner">
                                    <GraduationCap className="w-8 h-8" />
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                Documents de {student?.name}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {student?.cycle} - {student?.niveau} {student?.class_name ? `(${student.class_name})` : ''}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Grade Entry Form */}
                <div className="bg-white rounded-lg shadow overflow-hidden mb-6 border-l-4 border-green-500">
                    <button
                        onClick={() => setIsGradeFormOpen(!isGradeFormOpen)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="p-2 bg-green-100 rounded-lg text-green-600">
                                <ClipboardList className="w-5 h-5" />
                            </span>
                            <div className="text-left">
                                <h2 className="text-lg font-bold text-gray-800">Enregistrer une Note</h2>
                                <p className="text-sm text-gray-500">Ajouter une évaluation ou un résultat d'examen</p>
                            </div>
                        </div>
                        <span className={`transform transition-transform ${isGradeFormOpen ? 'rotate-180' : ''}`}>
                            <span className="text-xs text-gray-400">▼</span>
                        </span>
                    </button>

                    {isGradeFormOpen && (
                        <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                            <form onSubmit={handleAddGrade} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-600 mb-1">Matière</label>
                                        <select
                                            value={selectedSubject}
                                            onChange={e => setSelectedSubject(e.target.value)}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                            required
                                        >
                                            <option value="">Sélectionner une matière</option>
                                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1">Nature de la Note</label>
                                        <select
                                            value={gradeType}
                                            onChange={e => setGradeType(e.target.value)}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        >
                                            <option value="devoir">Devoir</option>
                                            <option value="examen">Examen</option>
                                            <option value="exercice_maison">Exercice à la maison</option>
                                            <option value="exercice_ecole">Exercice à l'école</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1">Note / 20</label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            max="20"
                                            value={gradeValue}
                                            onChange={e => setGradeValue(e.target.value)}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-bold"
                                            placeholder="Ex: 15.5"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1">Période</label>
                                        <select
                                            value={gradePeriod}
                                            onChange={e => setGradePeriod(e.target.value)}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        >
                                            <option value="T1">1er Trimestre</option>
                                            <option value="T2">2ème Trimestre</option>
                                            <option value="T3">3ème Trimestre</option>
                                            <option value="S1">1er Semestre</option>
                                            <option value="S2">2ème Semestre</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-600 mb-1">Commentaire (Optionnel)</label>
                                        <input
                                            type="text"
                                            value={gradeComment}
                                            onChange={e => setGradeComment(e.target.value)}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                            placeholder="Ex: Très bon travail, continuez ainsi."
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={schoolInfo?.status === 'suspended'}
                                        className={`px-8 py-2.5 text-white rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 ${schoolInfo?.status === 'suspended'
                                            ? 'bg-gray-400 cursor-not-allowed opacity-70'
                                            : 'bg-green-600 hover:bg-green-700'
                                            }`}
                                    >
                                        <ClipboardList className="w-5 h-5" />
                                        {schoolInfo?.status === 'suspended' ? 'Action Restreinte' : 'Enregistrer la Note'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* Grades List Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden mb-6 border-l-4 border-indigo-500">
                    <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <GraduationCap className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-lg font-bold text-gray-800">Notes & Bulletins</h2>
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{grades.length} Notes</span>
                    </div>
                    <div className="overflow-auto max-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-bold sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-3 bg-gray-50">Matière</th>
                                    <th className="px-6 py-3 bg-gray-50">Type</th>
                                    <th className="px-6 py-3 bg-gray-50">Note</th>
                                    <th className="px-6 py-3 bg-gray-50">Période</th>
                                    <th className="px-6 py-3 bg-gray-50 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {grades.map((grade) => (
                                    <tr key={grade.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-800">{grade.subject_name}</div>
                                            {grade.comment && <div className="text-xs text-gray-400 italic">{grade.comment}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getTypeBadgeColor(grade.type)}`}>
                                                {grade.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-black ${grade.grade >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                                                {grade.grade}/20
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-500">
                                            {grade.period}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    if (schoolInfo?.status === 'suspended') return;
                                                    handleDeleteGrade(grade.id);
                                                }}
                                                disabled={schoolInfo?.status === 'suspended'}
                                                className={`p-2 rounded-lg transition-colors ${schoolInfo?.status === 'suspended'
                                                    ? 'text-gray-300 cursor-not-allowed'
                                                    : 'text-red-500 hover:bg-red-50'
                                                    }`}
                                                title={schoolInfo?.status === 'suspended' ? 'Restreint' : "Supprimer la note"}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {grades.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-gray-400 italic">
                                            Aucune note enregistrée pour le moment.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Attendance List Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden mb-6 border-l-4 border-orange-500">
                    <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ClipboardCheck className="w-5 h-5 text-orange-600" />
                            <h2 className="text-lg font-bold text-gray-800">Présences / Absences</h2>
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{attendance.length} Enregistrements</span>
                    </div>
                    <div className="overflow-auto max-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-bold sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-3 bg-gray-50">Date</th>
                                    <th className="px-6 py-3 bg-gray-50">Status</th>
                                    <th className="px-6 py-3 bg-gray-50">Notification</th>
                                    <th className="px-6 py-3 bg-gray-50 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {attendance.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-800">
                                            {new Date(entry.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${entry.status === 'present' ? 'bg-green-100 text-green-700' :
                                                entry.status.startsWith('absent') ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {
                                                    entry.status === 'present' ? 'Présent' :
                                                        entry.status === 'absent' ? 'Absent' :
                                                            entry.status === 'absent_8h_10h' ? 'Absent (8h-10h)' :
                                                                entry.status === 'absent_10h_12h' ? 'Absent (10h-12h)' :
                                                                    entry.status === 'absent_12h_14h' ? 'Absent (12h-14h)' :
                                                                        'En retard'
                                                }
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {entry.notification_sent ? (
                                                <span className="text-xs text-green-600 flex items-center gap-1">
                                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                    Email Envoyé
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Aucune</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    if (schoolInfo?.status === 'suspended') return;
                                                    handleDeleteAttendance(entry.id);
                                                }}
                                                disabled={schoolInfo?.status === 'suspended'}
                                                className={`p-2 rounded-lg transition-colors ${schoolInfo?.status === 'suspended'
                                                    ? 'text-gray-300 cursor-not-allowed'
                                                    : 'text-red-500 hover:bg-red-50'
                                                    }`}
                                                title={schoolInfo?.status === 'suspended' ? 'Restreint' : "Supprimer l'entrée"}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {attendance.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-gray-400 italic">
                                            Aucun enregistrement de présence pour le moment.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Upload Form */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center">
                        <Upload className="w-5 h-5 mr-2 text-blue-600" />
                        Télécharger un nouveau document
                    </h2>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type de document
                                </label>
                                <select
                                    value={uploadType}
                                    onChange={(e) => setUploadType(e.target.value)}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="exercice">📝 Exercice</option>
                                    <option value="devoir">📚 Devoir</option>
                                    <option value="examen">📋 Examen</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fichier (Image ou PDF)
                                </label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                    className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description (optionnel)
                            </label>
                            <input
                                type="text"
                                value={uploadDescription}
                                onChange={(e) => setUploadDescription(e.target.value)}
                                placeholder="Ex: Mathématiques - Chapitre 3"
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={schoolInfo?.status === 'suspended'}
                            className={`w-full md:w-auto px-6 py-2 text-white rounded font-medium flex items-center justify-center gap-2 transition-all ${schoolInfo?.status === 'suspended'
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            <Upload className="w-4 h-4" />
                            {schoolInfo?.status === 'suspended' ? 'Action Restreinte' : 'Télécharger'}
                        </button>
                    </form>
                </div>

                {/* Documents List */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="text-center py-8">Chargement...</div>
                    ) : documents.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <p className="text-gray-500">Aucun document pour cet élève</p>
                        </div>
                    ) : (
                        <>
                            {['exercice', 'devoir', 'examen'].map(type => {
                                const docs = groupedDocuments[type] || [];
                                if (docs.length === 0) return null;

                                return (
                                    <div key={type} className="bg-white rounded-lg shadow overflow-hidden">
                                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-3 border-b flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(type)}
                                                <h3 className="font-bold text-gray-800 capitalize">
                                                    {type}s ({docs.length})
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                                            {docs.map(doc => (
                                                <div
                                                    key={doc.id}
                                                    className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                                                >
                                                    {doc.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                        <img
                                                            src={`${API_URL.replace('/api', '')}${doc.file_url}`}
                                                            alt={doc.description}
                                                            className="w-full h-48 object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                                                            <FileText className="w-16 h-16 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className="p-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className={`px-2 py-1 text-xs font-bold rounded border ${getTypeBadgeColor(doc.type)}`}>
                                                                {doc.type}
                                                            </span>
                                                            <button
                                                                onClick={() => {
                                                                    if (schoolInfo?.status === 'suspended') return;
                                                                    handleDelete(doc.id);
                                                                }}
                                                                disabled={schoolInfo?.status === 'suspended'}
                                                                className={`p-1 rounded transition-colors ${schoolInfo?.status === 'suspended'
                                                                    ? 'text-gray-300 cursor-not-allowed'
                                                                    : 'text-red-500 hover:bg-red-50'
                                                                    }`}
                                                                title={schoolInfo?.status === 'suspended' ? 'Restreint' : "Supprimer"}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        {doc.description && (
                                                            <p className="text-sm text-gray-700 mb-2">{doc.description}</p>
                                                        )}
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                                                        </p>
                                                        <a
                                                            href={`${API_URL.replace('/api', '')}${doc.file_url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="mt-2 block text-center text-sm text-blue-600 hover:underline"
                                                        >
                                                            Voir le document
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDocuments;
