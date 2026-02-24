
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { AlertTriangle, TrendingDown, Clock, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SentinelWidget = ({ schoolId }) => {
    const [riskyStudents, setRiskyStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false); // Default: collapsed
    const navigate = useNavigate();

    useEffect(() => {
        if (schoolId) {
            fetchRiskAnalysis();
        }
    }, [schoolId]);

    const fetchRiskAnalysis = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/analysis/risk?school_id=${schoolId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRiskyStudents(res.data);
            // Auto expand if there are risks initially? No, user wants it hidden by default until arrow clicked
            // Actually user said "arrow that lifts alerts up and hides them behind Sentinel Module".
            // Let's interpret: Header is always visible. Arrow toggles the list visibility.
        } catch (error) {
            console.error('Error fetching risk analysis:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-4 rounded-lg bg-gray-50 animate-pulse h-32">Chargement Sentinelle...</div>;

    if (riskyStudents.length === 0) return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full">
                <div>🛡️</div>
            </div>
            <div>
                <h3 className="font-bold text-green-800">Aucun risque détecté</h3>
                <p className="text-sm text-green-700">Tous les indicateurs sont au vert. Sentinelle veille.</p>
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden mb-8 transition-all duration-300 ease-in-out">
            {/* Header / Toggle Area */}
            <div
                className="bg-gradient-to-r from-red-50 to-white px-6 py-4 border-b border-red-50 flex justify-between items-center cursor-pointer hover:bg-red-50/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-full ring-4 ring-red-50">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            Module Sentinelle
                            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold animate-pulse">
                                {riskyStudents.length} Alerte{riskyStudents.length > 1 ? 's' : ''}
                            </span>
                        </h2>
                        <p className="text-xs text-gray-500 font-medium">Analyse prédictive des risques scolaires</p>
                    </div>
                </div>

                {/* The Arrow Button */}
                <button
                    className="p-2 bg-white rounded-full shadow-sm border border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all transform"
                >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
            </div>

            {/* Expandable List Area */}
            {isExpanded && (
                <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto animate-in slide-in-from-top-2 duration-300">
                    {riskyStudents.map(student => (
                        <div
                            key={student.id}
                            className="px-6 py-3 hover:bg-gray-50 transition-colors cursor-pointer group flex items-center justify-between"
                            onClick={() => navigate(`/admin/student/${student.id}/documents`)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    {student.photo_url ? (
                                        <img src={`${API_URL.replace('/api', '')}${student.photo_url}`} className="w-10 h-10 rounded-full object-cover border border-gray-200" alt="" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
                                            {student.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 bg-red-500 w-3 h-3 rounded-full border-2 border-white"></div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-900 leading-tight group-hover:text-blue-600">{student.name}</h4>
                                    <p className="text-xs text-gray-500">{student.class_name || 'Sans classe'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {student.risks.map((risk, idx) => (
                                    <div key={idx} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${risk.type === 'academic'
                                            ? 'bg-orange-50 text-orange-700 border-orange-100'
                                            : 'bg-red-50 text-red-700 border-red-100'
                                        }`}>
                                        {risk.type === 'academic' ? <TrendingDown className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                        <span>{risk.label}</span>
                                    </div>
                                ))}
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SentinelWidget;
