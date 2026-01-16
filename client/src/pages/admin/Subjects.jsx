import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';

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
            <nav className="bg-white shadow">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-xl font-bold text-blue-600">Ajouter Matière</span>
                        </div>
                        <div className="flex items-center">
                            <button onClick={() => navigate('/admin')} className="flex items-center text-gray-600 hover:text-gray-900">
                                <ArrowLeft className="w-5 h-5 mr-2" /> Retour au Dashboard
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
