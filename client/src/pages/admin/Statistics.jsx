
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, LayoutDashboard, BarChart3, BookOpen, GraduationCap } from 'lucide-react';
import { API_URL } from '../../config';
import SurveillantLogo from '../../assets/Surveillant.jpeg';
import PerformanceWidget from '../../components/PerformanceWidget';

const Statistics = () => {
    const [schoolInfo, setSchoolInfo] = useState(null);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        const fetchSchoolInfo = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/schools/my-school`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSchoolInfo(res.data);
            } catch (error) {
                console.error(error);
                if (error.response?.status === 401) navigate('/login');
            }
        };
        fetchSchoolInfo();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
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

                            <button onClick={() => navigate('/admin/settings')} className="flex items-center gap-2 group transition-all">
                                <div className="w-10 h-10 rounded-full border-2 border-blue-600 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                    <Settings className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600 hidden md:block uppercase tracking-wider">Email</span>
                            </button>

                            <button onClick={handleLogout} className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all ml-4">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="py-10 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="px-4 sm:px-0">
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-blue-600" />
                            Statistiques de Performance
                        </h1>
                        <p className="text-gray-500 mt-2">Analysez les résultats, les progressions et les excellences de votre établissement.</p>
                    </div>

                    {schoolInfo && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* On the dedicated page, we might want it always expanded or just use the widget as is */}
                            <PerformanceWidget schoolId={schoolInfo.id} forceExpand={true} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Statistics;
