import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Plus, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';
import SurveillantLogo from '../../assets/Surveillant.jpeg';

const Subjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [newSubject, setNewSubject] = useState('');
    const [schoolInfo, setSchoolInfo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSubjects();
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

    const fetchSubjects = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get(`${API_URL}/subjects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubjects(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const addSubject = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await axios.post(`${API_URL}/subjects`, { name: newSubject }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewSubject('');
            fetchSubjects();
        } catch (error) {
            alert('Error adding subject');
        }
    };

    const deleteSubject = async (id) => {
        if (!confirm('Delete this subject?')) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`${API_URL}/subjects/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchSubjects();
        } catch (error) {
            alert('Error deleting subject');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
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

            <main className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
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
                <div className="p-6 bg-white rounded-lg shadow">
                    <form onSubmit={addSubject} className="flex gap-4 mb-6">
                        <input
                            type="text" placeholder="Nom de la nouvelle matière (ex: Histoire)"
                            className="flex-1 p-2 border rounded"
                            value={newSubject} onChange={e => setNewSubject(e.target.value)} required
                        />
                        <button
                            type="submit"
                            disabled={schoolInfo?.status === 'suspended'}
                            className={`flex items-center px-4 py-2 text-white rounded transition-colors ${schoolInfo?.status === 'suspended'
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700'
                                }`}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {schoolInfo?.status === 'suspended' ? 'Restreint' : 'Ajouter'}
                        </button>
                    </form>

                    <ul className="divide-y divide-gray-200">
                        {subjects.map(sub => (
                            <li key={sub.id} className="flex items-center justify-between py-3">
                                <span className="text-gray-800">{sub.name}</span>
                                <button
                                    onClick={() => deleteSubject(sub.id)}
                                    disabled={schoolInfo?.status === 'suspended'}
                                    className={`p-2 transition-colors ${schoolInfo?.status === 'suspended'
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-red-500 hover:text-red-700'
                                        }`}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </main>
        </div>
    );
};

export default Subjects;
