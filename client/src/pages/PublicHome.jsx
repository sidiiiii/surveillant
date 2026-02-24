import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, School, ArrowRight, Loader, RefreshCw } from 'lucide-react';
import { API_URL } from '../config';
import SurveillantLogo from '../assets/Surveillant.jpeg';
import VideoAdModal from '../components/VideoAdModal';

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

const PublicHome = () => {
    const [nsi, setNsi] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [news, setNews] = useState(null);
    const [currentSlide, setCurrentSlide] = useState(0);

    const [videoDebugError, setVideoDebugError] = useState(null);
    const navigate = useNavigate();
    const videoRef = React.useRef(null);

    React.useEffect(() => {
        if (videoRef.current && news?.attachments?.[currentSlide]?.type === 'video') {
            videoRef.current.defaultMuted = true;
            videoRef.current.muted = true;
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Auto-play was prevented:", error);
                });
            }
        }
    }, [currentSlide, news]);

    React.useEffect(() => {
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

                // Show only if we have attachments
                if (attachments.length > 0) {
                    setNews({
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
        fetchSettings();
    }, []);

    // Auto-rotate carousel every 5 seconds
    React.useEffect(() => {
        if (!news || !news.attachments || news.attachments.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % news.attachments.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [news]);

    const toLatinDigits = (str) => {
        if (!str) return '';
        const arabic = '٠١٢٣٤٥٦٧٨٩';
        const farsi = '۰۱۲۳۴۵۶۷۸۹';
        return str.toString()
            .replace(/\s/g, '') // Supprime les espaces
            .replace(/[٠-٩]/g, (d) => arabic.indexOf(d))
            .replace(/[۰-۹]/g, (d) => farsi.indexOf(d));
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        const cleanNsi = toLatinDigits(nsi.trim());
        if (!cleanNsi) return;

        setLoading(true);
        setError('');

        try {
            await axios.get(`${API_URL}/public/student/${cleanNsi}`);
            navigate(`/public/student/${cleanNsi}`);
        } catch (err) {
            console.error(err);
            setError('Aucun élève trouvé avec ce NSI. Veuillez vérifier et réessayer.');
            setLoading(false);
        }
    };

    // Filter news based on location
    const showNews = news && news.display_locations && news.display_locations.includes('home');

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">

                {/* Full-Height Carousel Banner */}
                {showNews && (
                    <div className="relative w-full h-40 overflow-hidden shadow-2xl">
                        {/* Carousel Images */}
                        {/* Active Item Rendered Directly */}
                        <div className="absolute inset-0 animate-fade-in">
                            {news.attachments[currentSlide].type === 'video' ? (
                                <div className="w-full h-full relative bg-black">
                                    <video
                                        ref={videoRef}
                                        key={`video-${currentSlide}`}
                                        className="w-full h-full object-contain"
                                        src={`${API_URL.replace('/api', '')}${news.attachments[currentSlide].url}`}
                                        loop
                                        muted
                                        defaultMuted={true}
                                        playsInline
                                        autoPlay
                                        controls
                                        onCanPlay={(e) => {
                                            // Double-check mute and force play just in case
                                            const video = e.target;
                                            if (!video.muted) {
                                                video.muted = true;
                                            }

                                            if (video.paused) {
                                                video.play()
                                                    .catch(err => console.log(`Autoplay fallback prevented: ${err.message}`));
                                            }
                                        }}
                                    >
                                        Votre navigateur ne supporte pas la vidéo.
                                    </video>


                                </div>
                            ) : (
                                <img
                                    key={`img-${currentSlide}`}
                                    src={`${API_URL.replace('/api', '')}${news.attachments[currentSlide].url}`}
                                    alt={`Annonce ${currentSlide + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>

                        {/* Gradient Overlay for better text visibility */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none"></div>

                        {/* Dots Indicator */}
                        {news.attachments.length > 1 && (
                            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
                                {news.attachments.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentSlide(idx)}
                                        className={`w-3 h-3 rounded-full transition-all ${idx === currentSlide
                                            ? 'bg-white w-8'
                                            : 'bg-white/50 hover:bg-white/75'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Logo & Title Section with Decorative Background */}
                <div className="relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-600 to-indigo-800 -skew-y-3 origin-top-left z-0 shadow-2xl"></div>
                    <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl z-0"></div>

                    <div className="relative z-10 text-center py-16 animate-fade-in-down">
                        <div className="relative inline-block mb-6">
                            <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full"></div>
                            <img
                                src={SurveillantLogo}
                                alt="Surveillant Logo"
                                className="w-24 h-24 mx-auto rounded-3xl shadow-2xl relative z-10 border-4 border-white/20 object-cover"
                            />
                        </div>
                        <h1 className="text-5xl font-black text-white mb-2 tracking-tight">Surveillant</h1>
                        <p className="text-indigo-100 text-xl font-medium tracking-[0.3em] font-arabic opacity-90 uppercase">المراقب scolaire</p>
                    </div>
                </div>

                {/* Content Section (Search + Footer) - Centered below carousel */}
                <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center px-6 sm:px-12 -mt-16">
                    {/* Search Section */}
                    <div className="w-full max-w-2xl bg-white rounded-[3.5rem] shadow-2xl shadow-indigo-900/10 border border-slate-100 p-2 overflow-hidden animate-fade-in-up">
                        <div className="bg-slate-900 rounded-[3rem] p-10 text-center relative overflow-hidden">
                            {/* Abstract bg for card */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-xl"></div>

                            <div className="relative z-10">
                                <Search className="w-12 h-12 text-indigo-500 mx-auto mb-6" />
                                <h1 className="text-3xl font-black text-white mb-4">Espace Résultats</h1>
                                <p className="text-slate-400 font-medium max-w-sm mx-auto mb-10 leading-relaxed">
                                    Accédez instantanément à vos notes, bulletins et documents administratifs.
                                </p>

                                <form onSubmit={handleSearch} className="space-y-6 max-w-md mx-auto">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={nsi}
                                            onChange={(e) => setNsi(toLatinDigits(e.target.value))}
                                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl py-5 px-6 text-white text-xl font-bold placeholder:text-slate-600 focus:border-indigo-500 focus:bg-slate-800 outline-none transition-all shadow-inner"
                                            placeholder="Saisissez votre NSI"
                                            required
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 tracking-widest uppercase bg-slate-900 px-2 py-1 rounded-md border border-slate-700 pointer-events-none">
                                            Unique 5 chiffres
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 text-sm font-bold animate-pulse">
                                            ⚠️ {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`w-full py-5 text-xl font-black text-white rounded-2xl shadow-lg transition-all group overflow-hidden relative
                                                ${loading
                                                ? 'bg-slate-700 cursor-not-allowed'
                                                : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] shadow-indigo-600/30'
                                            }`}
                                    >
                                        <div className="relative z-10 flex items-center justify-center gap-3">
                                            {loading ? (
                                                <>
                                                    <Loader className="w-6 h-6 animate-spin" />
                                                    <span>Recherche...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Consulter mes notes</span>
                                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </div>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Login Link */}
                    <div className="mt-8 flex flex-col items-center gap-8 animate-fade-in delay-500">
                        <div className="h-px w-20 bg-slate-200"></div>
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-slate-500 font-bold text-sm">Personnel de l'établissement ?</p>
                            <button
                                onClick={() => navigate('/login')}
                                className="flex items-center gap-3 bg-white border border-slate-200 px-8 py-4 rounded-2xl shadow-sm hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all group lg:min-w-[300px] justify-center"
                            >
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                                    <School className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" />
                                </div>
                                <span className="font-black text-slate-800 uppercase tracking-widest text-xs">Portail Administratif</span>
                            </button>
                        </div>
                    </div>
                </div>

                <VideoAdModal page="home" />
            </div>
        </ErrorBoundary >
    );
};

export default PublicHome;
