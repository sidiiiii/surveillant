
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { Trophy, Star, TrendingUp, Users, ChevronDown, ChevronUp, BookOpen, GraduationCap } from 'lucide-react';

const PerformanceWidget = ({ schoolId, forceExpand = false }) => {
    const [data, setData] = useState({ bestStudents: [], bestClasses: [], classPerformance: [] });
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(forceExpand);
    const [activeTab, setActiveTab] = useState('classes'); // 'classes', 'students', 'ranking'

    useEffect(() => {
        if (schoolId) {
            fetchPerformanceData();
        }
    }, [schoolId]);

    const fetchPerformanceData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/analysis/performance?school_id=${schoolId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (error) {
            console.error('Error fetching performance data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-4 rounded-xl bg-gray-50 animate-pulse h-40 mb-8 border border-gray-100">Chargement des statistiques...</div>;

    const isEmpty = data.bestStudents.length === 0 && data.bestClasses.length === 0 && data.classPerformance.length === 0;

    if (isEmpty) return null;

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden mb-8 transition-all duration-500">
            {/* Header */}
            <div
                className={`bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 flex justify-between items-center ${!forceExpand ? 'cursor-pointer' : ''}`}
                onClick={() => !forceExpand && setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4 text-white">
                    <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                        <Trophy className="w-6 h-6 text-yellow-300" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight">Performance Excellence</h2>
                        <p className="text-blue-100 text-xs font-medium opacity-80">Statistiques et classements par mérite</p>
                    </div>
                </div>
                {!forceExpand && (
                    <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                )}
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="p-6 bg-white animate-in slide-in-from-top-4 duration-500">
                    {/* Tabs */}
                    <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                        <button
                            onClick={() => setActiveTab('classes')}
                            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'classes' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Users className="w-4 h-4" /> Meilleures Classes
                        </button>
                        <button
                            onClick={() => setActiveTab('students')}
                            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'students' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Star className="w-4 h-4" /> Meilleurs Élèves
                        </button>
                        <button
                            onClick={() => setActiveTab('ranking')}
                            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'ranking' ? 'bg-white text-purple-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <TrendingUp className="w-4 h-4" /> Benchmark Classes
                        </button>
                    </div>

                    {/* Tab Panels */}
                    <div className="space-y-4">
                        {activeTab === 'classes' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {data.bestClasses.map((item, idx) => (
                                    <div key={idx} className="p-4 rounded-xl border border-blue-50 bg-blue-50/30 hover:border-blue-200 transition-all group">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-100 px-2 py-0.5 rounded-full">{item.subject_name}</span>
                                            <div className="flex items-center gap-1 text-blue-700 font-black italic">
                                                <span>{parseFloat(item.avg_grade).toFixed(2)}</span>
                                                <span className="text-[10px]">/20</span>
                                            </div>
                                        </div>
                                        <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors uppercase">{item.class_name}</h4>
                                        <p className="text-[10px] text-gray-500 font-medium">{item.class_level}</p>
                                    </div>
                                ))}
                                {data.bestClasses.length === 0 && <p className="col-span-full text-center py-8 text-gray-400 font-medium italic">Aucune donnée disponible pour le moment.</p>}
                            </div>
                        )}

                        {activeTab === 'students' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {data.bestStudents.map((item, idx) => (
                                    <div key={idx} className="p-4 rounded-xl border border-indigo-50 bg-indigo-50/30 hover:border-indigo-200 transition-all group">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs">
                                                    {item.student_name.charAt(0)}
                                                </div>
                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{item.subject_name}</span>
                                            </div>
                                            <div className="text-indigo-700 font-black italic">
                                                {parseFloat(item.avg_grade).toFixed(2)}
                                            </div>
                                        </div>
                                        <h4 className="font-black text-gray-900 group-hover:text-indigo-700 transition-colors leading-tight">{item.student_name}</h4>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">{item.class_name}</p>
                                    </div>
                                ))}
                                {data.bestStudents.length === 0 && <p className="col-span-full text-center py-8 text-gray-400 font-medium italic">Aucune donnée disponible pour le moment.</p>}
                            </div>
                        )}

                        {activeTab === 'ranking' && (
                            <div className="space-y-3">
                                {data.classPerformance.map((item, idx) => (
                                    <div key={idx} className="relative p-4 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden group">
                                        {/* Progress bar background */}
                                        <div
                                            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-1000"
                                            style={{ width: `${(item.avg_grade / 20) * 100}%` }}
                                        ></div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 font-black italic text-sm">
                                                    #{idx + 1}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-gray-900 uppercase tracking-tighter">{item.class_name}</h4>
                                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase">
                                                        <span>{item.class_cycle}</span>
                                                        <span>•</span>
                                                        <span>{item.student_count} Élèves</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-black text-blue-700 italic leading-none">
                                                    {parseFloat(item.avg_grade).toFixed(2)}
                                                    <span className="text-xs text-blue-400">/20</span>
                                                </div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Moyenne Générale</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {data.classPerformance.length === 0 && <p className="text-center py-8 text-gray-400 font-medium italic">Aucune donnée d'évaluation disponible.</p>}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformanceWidget;
