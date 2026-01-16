import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const VideoAdModal = ({ page }) => {
    const [adConfig, setAdConfig] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [videoEnded, setVideoEnded] = useState(false);
    const [isMuted, setIsMuted] = useState(true); // Démarrer en muet pour permettre l'autoplay (Politique navigateur)
    const videoRef = React.useRef(null);

    useEffect(() => {
        if (isVisible && videoRef.current) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Autoplay was prevented, waiting for interaction or already muted.");
                });
            }
        }
    }, [isVisible]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get(`${API_URL}/public/settings`);
                const settings = res.data;

                if (settings.video_ad_enabled === 'true' && settings.video_ad_url) {
                    const locations = settings.video_ad_locations ? settings.video_ad_locations.split(',') : [];
                    if (locations.includes(page)) {
                        setAdConfig({
                            url: settings.video_ad_url,
                        });

                        // Show ad after a short delay
                        const timer = setTimeout(() => {
                            setIsVisible(true);
                        }, 1000);
                        return () => clearTimeout(timer);
                    }
                }
            } catch (err) {
                console.error("Erreur lors du chargement de la pub vidéo:", err);
            }
        };

        fetchSettings();
    }, [page]);

    const handleClose = () => {
        setIsVisible(false);
    };

    if (!isVisible || !adConfig) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop with Blur */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500"
                onClick={handleClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in duration-300">

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-red-500 transition-all border border-white/20 group"
                >
                    <span className="text-xl font-bold group-hover:scale-110 transition-transform">✕</span>
                </button>

                {/* Video Container */}
                <div className="relative aspect-video bg-black flex items-center justify-center">
                    <video
                        ref={videoRef}
                        key={adConfig.url}
                        autoPlay
                        muted={isMuted}
                        loop
                        playsInline
                        className="w-full h-full object-contain"
                        onEnded={() => setVideoEnded(true)}
                    >
                        <source src={`${API_URL.replace('/api', '')}${adConfig.url}`} type="video/mp4" />
                        <source src={`${API_URL.replace('/api', '')}${adConfig.url}`} type="video/webm" />
                        <source src={`${API_URL.replace('/api', '')}${adConfig.url}`} type="video/ogg" />
                    </video>

                    {/* Control Buttons Overlay */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMuted(!isMuted);
                            }}
                            className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:bg-black/70 transition-all text-xl"
                            title={isMuted ? "Activer le son" : "Couper le son"}
                        >
                            {isMuted ? '🔇' : '🔊'}
                        </button>

                        <div className="bg-black/40 backdrop-blur-md text-[10px] text-white/70 px-3 py-2 rounded-full border border-white/10 uppercase tracking-widest font-bold">
                            {isMuted ? 'Son Coupé' : 'Son Activé'}
                        </div>
                    </div>

                    {/* Autoplay / Muted Indicator */}
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none">
                        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex items-center gap-2">
                            <span className="animate-pulse">🔊</span>
                            <span className="text-[10px] text-white font-bold uppercase tracking-wider">Vidéo Automatique</span>
                        </div>
                    </div>

                    {/* Overlay Tip */}
                    {!videoEnded && (
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center pointer-events-none">
                            <span className="bg-black/40 backdrop-blur-md text-[10px] text-white/70 px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest font-bold">
                                Publicité • Surveilleur
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="p-4 bg-gradient-to-b from-slate-900 to-slate-950 text-center">
                    <div className="w-12 h-1 bg-blue-500 mx-auto rounded-full mb-3 opacity-50"></div>
                    <p className="text-slate-400 text-xs font-medium">Cette vidéo fermera automatiquement ou vous pouvez cliquer sur la croix.</p>
                </div>
            </div>
        </div>
    );
};

export default VideoAdModal;
