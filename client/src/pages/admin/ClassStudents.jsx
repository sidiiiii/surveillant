
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, LogOut, Edit, Trash2, Settings, Clock, LayoutDashboard, ArrowLeft, BarChart3, BookOpen, GraduationCap } from 'lucide-react';
import { API_URL } from '../../config';
import SurveillantLogo from '../../assets/Surveillant.jpeg';

const ClassStudents = () => {
    const { classId } = useParams();
    const [students, setStudents] = useState([]);
    const [classInfo, setClassInfo] = useState(null);
    const [schoolInfo, setSchoolInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        const loadData = async () => {
            await fetchClassInfo();
            await fetchStudents();
            await fetchSchoolInfo();
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
            // Filter students by classId
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

    return (
        <div className="min-h-screen bg-gray-50">
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
                        <div className="text-center py-20">Chargement des élèves...</div>
                    ) : (
                        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                            <ul className="divide-y divide-gray-100">
                                {students.map((student) => (
                                    <li key={student.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div
                                                className="flex items-center flex-1 cursor-pointer group"
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
                                                <div className="ml-4">
                                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{student.name}</h3>
                                                    <div className="text-xs text-gray-500 flex items-center gap-3 mt-1">
                                                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">NSI: {student.nsi}</span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span className="italic">{student.parent_email}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); markAttendance(student.id, 'present'); }}
                                                        className="px-3 py-1 text-[10px] font-black uppercase text-green-600 hover:bg-green-600 hover:text-white rounded transition-all"
                                                    >P</button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); markAttendance(student.id, 'late'); }}
                                                        className="px-3 py-1 text-[10px] font-black uppercase text-amber-600 hover:bg-amber-600 hover:text-white rounded transition-all"
                                                    >R</button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); markAttendance(student.id, 'absent'); }}
                                                        className="px-3 py-1 text-[10px] font-black uppercase text-red-600 hover:bg-red-600 hover:text-white rounded transition-all"
                                                    >A</button>
                                                </div>
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
        </div>
    );
};

export default ClassStudents;
