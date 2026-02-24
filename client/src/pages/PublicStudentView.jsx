import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, BookOpen, ClipboardList, Download, Eye, ArrowLeft, GraduationCap, X, School, RefreshCw } from 'lucide-react';
import { API_URL } from '../config';
import SurveillantLogo from '../assets/Surveillant.jpeg';
import VideoAdModal from '../components/VideoAdModal';
import ParentSentinelWidget from '../components/ParentSentinelWidget';

// Error Boundary to prevent white screen of death during browser translation
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error, errorInfo) { console.error("Translation/React Error:", error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md">
                        <RefreshCw className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                        <h2 className="text-xl font-bold mb-2">Structure de page modifiée</h2>
                        <p className="text-gray-600 mb-6">La traduction automatique a interrompu l'affichage. Cliquez pour recharger.</p>
                        <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold font-sans">
                            Actualiser la page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const PublicStudentView = () => {
    const { nsi } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('documents'); // 'documents' or 'grades'
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [news, setNews] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);


    useEffect(() => {
        fetchStudentData();
        fetchSettings();
    }, [nsi]);

    // Auto-rotate carousel every 4 seconds
    useEffect(() => {
        if (news?.attachments && news.attachments.length > 1) {
            const interval = setInterval(() => {
                setCurrentImageIndex((prevIndex) =>
                    (prevIndex + 1) % news.attachments.length
                );
            }, 4000); // Change image every 4 seconds

            return () => clearInterval(interval);
        }
    }, [news]);

    const fetchSettings = async () => {
        try {
            const res = await axios.get(`${API_URL}/public/settings`);

            let attachments = [];
            if (res.data.global_news_attachments) {
                try {
                    attachments = JSON.parse(res.data.global_news_attachments);
                } catch (e) {
                    console.error("Error parsing attachments", e);
                }
            } else if (res.data.global_news_media_url) {
                attachments = [{ url: res.data.global_news_media_url, type: res.data.global_news_media_type }];
            }

            // Show if text exists OR we have attachments
            if (res.data.global_news || attachments.length > 0) {
                setNews({
                    text: res.data.global_news,
                    attachments: attachments,
                    display_locations: res.data.global_news_display_locations || 'home,student'
                });
            } else {
                setNews(null);
            }
        } catch (err) {
            console.error("Failed to fetch settings", err);
        }
    };

    const toLatinDigits = (str) => {
        if (!str) return '';
        const arabic = '٠١٢٣٤٥٦٧٨٩';
        const farsi = '۰۱۲۳۴۵۶۷۸۹';
        return str.toString()
            .replace(/\s/g, '')
            .replace(/[٠-٩]/g, (d) => arabic.indexOf(d))
            .replace(/[۰-۹]/g, (d) => farsi.indexOf(d));
    };

    const fetchStudentData = async () => {
        try {
            const cleanNsi = toLatinDigits(nsi);
            if (!cleanNsi) return;

            setLoading(true); // Ensure loading is true while fetching
            const response = await axios.get(`${API_URL}/public/student/${cleanNsi}`);

            if (!response.data || !response.data.student) {
                throw new Error('Données reçues invalides');
            }

            setData(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching student data:', err);
            setError(err.response?.data?.error || 'Impossible de charger les données. Vérifiez le NSI.');
        } finally {
            setLoading(false);
        }
    };

    const getTypeBadgeColor = (type) => {
        switch (type) {
            case 'exercice':
            case 'exercice_ecole':
            case 'exercice_maison':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'devoir':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'examen':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) return (
        // ... (loading state)
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error || !data) return (
        // ... (error state)
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow text-center max-w-md w-full">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                    onClick={() => navigate('/')}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                    Retour à l'accueil
                </button>
            </div>
        </div>
    );

    const { student } = data;
    const showNews = news && news.display_locations && news.display_locations.includes('student');

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-slate-50 font-sans">
                {/* Global News Banner - Consistent Premium Style */}
                {showNews && (
                    <div className="bg-white/80 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-50">
                        <div className={`${news.text ? 'max-w-7xl mx-auto px-4 py-3' : 'w-full'}`}>
                            <div className={`flex flex-col ${news.text ? 'md:flex-row gap-4' : ''}`}>
                                {/* Media Section */}
                                {news.attachments && news.attachments.length > 0 && (
                                    <div className={`${news.text ? 'md:w-64' : 'w-full'} flex-shrink-0 ${!news.text ? 'flex items-center justify-center' : ''}`}>
                                        {news.attachments.length === 1 ? (
                                            // Single Media
                                            news.attachments[0].type === 'video' ? (
                                                <div className="rounded-lg overflow-hidden border border-indigo-100 shadow-sm relative pt-[56.25%] bg-black">
                                                    <video className="absolute top-0 left-0 w-full h-full object-contain" controls>
                                                        <source src={`${API_URL.replace('/api', '')}${news.attachments[0].url}`} />
                                                    </video>
                                                </div>
                                            ) : (
                                                <a href={`${API_URL.replace('/api', '')}${news.attachments[0].url}`} target="_blank" rel="noopener noreferrer" className="block w-full">
                                                    <div className={`relative overflow-hidden ${news.text ? 'rounded-lg border border-indigo-100 shadow-sm' : ''}`} style={{ height: news.text ? 'auto' : '160px' }}>
                                                        <img
                                                            src={`${API_URL.replace('/api', '')}${news.attachments[0].url}`}
                                                            className={`${news.text ? 'w-full h-32 md:h-24 object-cover' : 'w-full h-full object-cover'} group-hover:scale-105 transition-transform duration-500`}
                                                            alt="Aperçu"
                                                        />
                                                    </div>
                                                </a>
                                            )
                                        ) : (
                                            // Automatic Carousel for Multiple Media
                                            <div className="relative w-full">
                                                {/* Carousel Container */}
                                                <div className={`relative overflow-hidden bg-slate-50 ${news.text ? 'rounded-lg border border-indigo-100 shadow-sm' : ''}`} style={{ height: news.text ? 'auto' : '160px' }}>
                                                    {news.attachments.map((file, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`absolute top-0 left-0 w-full h-full transition-opacity duration-700 ${idx === currentImageIndex ? 'opacity-100' : 'opacity-0'
                                                                }`}
                                                        >
                                                            {file.type === 'video' ? (
                                                                <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                                                    <video className="w-full h-full object-contain" controls>
                                                                        <source src={`${API_URL.replace('/api', '')}${file.url}`} />
                                                                    </video>
                                                                </div>
                                                            ) : (
                                                                <a href={`${API_URL.replace('/api', '')}${file.url}`} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                                                    <img
                                                                        src={`${API_URL.replace('/api', '')}${file.url}`}
                                                                        alt={`Annonce ${idx + 1}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </a>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Carousel Indicators */}
                                                <div className="flex justify-center gap-2 mt-3">
                                                    {news.attachments.map((_, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setCurrentImageIndex(idx)}
                                                            className={`h-2 rounded-full transition-all duration-300 ${idx === currentImageIndex
                                                                ? 'w-8 bg-indigo-600'
                                                                : 'w-2 bg-slate-300 hover:bg-slate-400'
                                                                }`}
                                                            aria-label={`Aller à l'image ${idx + 1}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Text Section */}
                                {news.text && (
                                    <div className="flex-1 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                                            <span className="text-sm">📢</span>
                                        </div>
                                        <p className="text-slate-800 font-semibold text-sm md:text-base leading-snug">{news.text}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Header - Glassmorphic & Premium */}
                <header className="bg-white/80 backdrop-blur-xl border-b border-indigo-50/50 sticky top-[news ? '60px' : '0'] z-40 transition-all">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => navigate('/')}
                                className="group p-2 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"
                                title="Retour"
                            >
                                <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                            </button>

                            {/* Site Logo */}
                            <div className="flex items-center gap-3 mr-6 border-r border-slate-200 pr-6 hidden md:flex">
                                <img src={SurveillantLogo} alt="Surveillant" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                                <div className="leading-none">
                                    <div className="font-extrabold text-slate-800 text-lg tracking-tight">Surveillant</div>
                                    <div className="font-black text-indigo-500 text-xs font-arabic tracking-widest uppercase opacity-80">المراقب</div>
                                </div>
                            </div>

                            {/* Student Info */}
                            <div className="flex items-center gap-5">
                                <div className="relative">
                                    {student.photo_url ? (
                                        <img src={`${API_URL.replace('/api', '')}${student.photo_url}`} alt={student.name} className="h-16 w-16 object-cover bg-white rounded-full shadow-md border-4 border-white" />
                                    ) : student.school_logo ? (
                                        <img src={`${API_URL.replace('/api', '')}${student.school_logo}`} alt="School" className="h-14 w-14 object-contain p-1 bg-white rounded-2xl shadow-sm border border-slate-100" />
                                    ) : (
                                        <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                            <School className="w-7 h-7" />
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                                </div>

                                <div>
                                    <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-1"><span>{student.name}</span></h1>
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 text-xs uppercase tracking-wide">{student.school_name}</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-indigo-600">{student.class_name}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-right hidden sm:block bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5"><span>NSI Identifiant</span></div>
                            <div className="font-mono text-lg text-slate-900 font-bold tracking-tight"><span>{student.nsi}</span></div>
                        </div>
                    </div>
                </header>

                {/* Content of Result Page */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                    {/* Sentinelle IA - Suivi Préventif Public */}
                    <div className="mb-10 max-w-4xl mx-auto">
                        <ParentSentinelWidget
                            studentId={student.id}
                            initialData={data.sentinelle}
                        />
                    </div>

                    {/* Tabs - Modern Pill Style */}
                    <div className="flex justify-center mb-10">
                        <div className="bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-white/40 shadow-xl shadow-indigo-100/50 inline-flex ring-1 ring-slate-100">
                            <button
                                onClick={() => setActiveTab('documents')}
                                className={`px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2.5 ${activeTab === 'documents'
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-[1.02]'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                                    }`}
                            >
                                <FileText className="w-4 h-4" />
                                <span>Documents</span>
                                <span className={`ml-1.5 px-2 py-0.5 rounded-md text-[10px] ${activeTab === 'documents' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                    {data.documents?.length || 0}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('grades')}
                                className={`px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2.5 ${activeTab === 'grades'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                                    }`}
                            >
                                <GraduationCap className="w-4 h-4" />
                                <span>Bulletins & Notes</span>
                                <span className={`ml-1.5 px-2 py-0.5 rounded-md text-[10px] ${activeTab === 'grades' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                    {data.grades?.length || 0}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Tab Content with Animations */}
                    <div className="animate-fade-in-up">
                        {activeTab === 'documents' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {data.documents && data.documents.length > 0 ? (
                                    data.documents.map(doc => (
                                        <div key={doc.id} className="group bg-white rounded-[2rem] shadow-xl shadow-indigo-100/50 hover:shadow-2xl hover:shadow-indigo-200/50 transition-all duration-300 border border-slate-100 overflow-hidden hover:-translate-y-1">
                                            <div className="relative h-56 bg-gradient-to-b from-slate-50 to-indigo-50/30 overflow-hidden">
                                                {doc.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                    <img
                                                        src={`${API_URL.replace('/api', '')}${doc.file_url}`}
                                                        alt={doc.description}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full relative">
                                                        <div className="absolute inset-0 bg-mesh opacity-10"></div>
                                                        <FileText className="w-20 h-20 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                                    </div>
                                                )}

                                                {/* Hover Action Overlay */}
                                                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                                                    <a
                                                        href={`${API_URL.replace('/api', '')}${doc.file_url}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 text-indigo-600"
                                                        title="Voir"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </a>
                                                    <a
                                                        href={`${API_URL.replace('/api', '')}${doc.file_url}`}
                                                        download
                                                        className="h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-75 hover:scale-110 text-white"
                                                        title="Télécharger"
                                                    >
                                                        <Download className="w-5 h-5" />
                                                    </a>
                                                </div>
                                            </div>

                                            <div className="p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest border ${getTypeBadgeColor(doc.type) === 'bg-blue-100 text-blue-800 border-blue-200' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : getTypeBadgeColor(doc.type)}`}>
                                                        <span>{doc.type}</span>
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-400"><span>{new Date(doc.created_at).toLocaleDateString()}</span></span>
                                                </div>
                                                <h4 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2 leading-tight" title={doc.description}><span>{doc.description || 'Document sans titre'}</span></h4>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <FileText className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">Aucun document</h3>
                                        <p className="text-slate-500">Aucun document n'a été publié pour le moment.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-indigo-100/20 border border-slate-100 overflow-hidden">
                                {data.grades && data.grades.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest"><span>Matière</span></th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest"><span>Type</span></th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center"><span>Note</span></th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest"><span>Date</span></th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest"><span>Commentaire</span></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {data.grades.map((grade) => (
                                                    <tr key={grade.id} className="hover:bg-indigo-50/30 transition-colors group">
                                                        <td className="px-8 py-5">
                                                            <span className="font-bold text-slate-800 text-base">{grade.subject_name}</span>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded inline-block">
                                                                {grade.type === 'exercice_ecole' ? 'Exo École' :
                                                                    grade.type === 'exercice_maison' ? 'Exo Maison' :
                                                                        grade.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-5 text-center">
                                                            <span className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-lg font-black ${grade.grade >= 10
                                                                ? 'bg-green-100 text-green-700 ring-4 ring-green-50'
                                                                : 'bg-red-100 text-red-700 ring-4 ring-red-50'
                                                                }`}>
                                                                <span>{grade.grade}</span>
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-5 text-sm font-bold text-slate-400"><span>{new Date(grade.date).toLocaleDateString()}</span></td>
                                                        <td className="px-8 py-5 text-sm font-medium text-slate-600 italic"><span>{grade.comment || '-'}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-20">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <GraduationCap className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">Aucune note</h3>
                                        <p className="text-slate-500">Les notes s'afficheront ici une fois publiées.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </main>
                <VideoAdModal page="student" />
            </div>
        </ErrorBoundary>
    );
};

export default PublicStudentView;
