import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';

const Classes = () => {
    const [classes, setClasses] = useState([]);
    const [division, setDivision] = useState(''); // Ex: 1, 2, A, B (suffix)
    const [newCycle, setNewCycle] = useState('Primaire');
    const [newYear, setNewYear] = useState('1'); // Stores the number part
    const [lyceeSeries, setLyceeSeries] = useState('C'); // Stores series for Lycée
    const [schoolInfo, setSchoolInfo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchClasses();
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

    const fetchClasses = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get(`${API_URL}/classes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClasses(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const addClass = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        // Logic Construction
        let niveauShort = '';
        let niveauFull = '';

        if (newCycle === 'Primaire') {
            // 1AF, 2AF...
            niveauShort = `${newYear}AF`;
            niveauFull = niveauShort;
        } else if (newCycle === 'Collège') {
            // 1ère AS, 2ème AS...
            const suffix = (newYear == 1) ? 'ère' : 'ème';
            niveauShort = `${newYear}${suffix} AS`;
            niveauFull = niveauShort;
        } else if (newCycle === 'Lycée') {
            // 5ème C, 5ème D...
            const suffix = (newYear == 1) ? 'ère' : 'ème'; // Though lycée starts at 5 usually
            niveauShort = `${newYear}${suffix} ${lyceeSeries}`;
            niveauFull = niveauShort;
        }

        // Name Construction: Level + Division (e.g. "1AF 1")
        // If division is empty, just the level name? Or force division?
        // User asked for capability to duplicate by 1, 2, 3... implies the "1, 2, 3" is the distinguishing factor.
        const finalName = division ? `${niveauShort} ${division}` : niveauShort;

        if (schoolInfo?.status === 'suspended') return;

        try {
            await axios.post(`${API_URL}/classes`, {
                name: finalName,
                cycle: newCycle,
                niveau: niveauFull,
                level: newYear // store numeric level for sorting/stats if needed
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDivision(''); // Clear division input only, easier to add next class in series
            fetchClasses();
        } catch (error) {
            alert(error.response?.data?.error || 'Error adding class');
        }
    };

    const deleteClass = async (id) => {
        if (schoolInfo?.status === 'suspended') return;
        if (!confirm('Supprimer cette classe ?  Cela est irréversible.')) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`${API_URL}/classes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Optimistically remove from UI
            setClasses(classes.filter(c => c.id !== id));
            // Then fetch to ensure sync
            fetchClasses();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || 'Erreur lors de la suppression de la classe');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-xl font-bold text-blue-600">Ajouter Classe</span>
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
                    <h2 className="text-lg font-semibold mb-4 text-gray-700">Ajouter une Classe</h2>
                    <form onSubmit={addClass} className="flex flex-col md:flex-row gap-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">1. Cycle</label>
                            <select
                                className="p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newCycle}
                                onChange={(e) => {
                                    setNewCycle(e.target.value);
                                    // Set default year based on cycle
                                    if (e.target.value === 'Primaire') setNewYear('1');
                                    if (e.target.value === 'Collège') setNewYear('1');
                                    if (e.target.value === 'Lycée') setNewYear('5');
                                }}
                            >
                                <option value="Primaire">Primaire (1AF - 6AF)</option>
                                <option value="Collège">Collège (1ère AS - 4ème AS)</option>
                                <option value="Lycée">Lycée (5ème - 7ème)</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1 w-full md:w-48">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">2. Niveau</label>
                            <div className="flex gap-2">
                                <select
                                    className="p-2.5 border rounded-lg bg-white flex-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newYear}
                                    onChange={(e) => setNewYear(e.target.value)}
                                >
                                    {newCycle === 'Primaire' && [1, 2, 3, 4, 5, 6].map(n => (
                                        <option key={n} value={n}>{n}AF</option>
                                    ))}
                                    {newCycle === 'Collège' && [1, 2, 3, 4].map(n => (
                                        <option key={n} value={n}>{n === 1 ? '1ère' : `${n}ème`} AS</option>
                                    ))}
                                    {newCycle === 'Lycée' && [5, 6, 7].map(n => (
                                        <option key={n} value={n}>{n}ème</option>
                                    ))}
                                </select>

                                {newCycle === 'Lycée' && (
                                    <select
                                        className="p-2.5 border rounded-lg bg-white w-20 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={lyceeSeries}
                                        onChange={(e) => setLyceeSeries(e.target.value)}
                                    >
                                        <option value="C">C</option>
                                        <option value="D">D</option>
                                        <option value="A">A</option>
                                        <option value="O">O</option>
                                    </select>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">3. Indice (Ex: 1, 2, A)</label>
                            <input
                                type="text"
                                placeholder="1, 2, A, B..."
                                className="p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={division}
                                onChange={e => setDivision(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={schoolInfo?.status === 'suspended'}
                                className={`w-full md:w-auto h-[42px] px-6 text-white rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 ${schoolInfo?.status === 'suspended'
                                    ? 'bg-gray-400 cursor-not-allowed opacity-70'
                                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                                    }`}
                            >
                                <Plus className="w-5 h-5" />
                                <span>{schoolInfo?.status === 'suspended' ? 'Restreint' : 'Ajouter'}</span>
                            </button>
                        </div>
                    </form>

                    <h3 className="text-md font-semibold mb-4 text-gray-600 border-b pb-2">Liste des Classes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classes.map(cls => (
                            <div key={cls.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                                <div>
                                    <div className="text-lg font-bold text-gray-800">{cls.name}</div>
                                    <div className="text-xs text-blue-600 uppercase tracking-wider font-semibold">
                                        {cls.cycle} — {cls.niveau}
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteClass(cls.id)}
                                    disabled={schoolInfo?.status === 'suspended'}
                                    className={`p-2 rounded-full transition-colors ${schoolInfo?.status === 'suspended'
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-red-400 hover:text-red-600 hover:bg-red-50'
                                        }`}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        {classes.length === 0 && (
                            <div className="col-span-full py-8 text-center text-gray-400 italic">
                                Aucune classe configurée.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Classes;
