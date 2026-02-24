
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

const ParentSentinelWidget = ({ studentId, initialData }) => {
    const [riskData, setRiskData] = useState(initialData || null);
    const [loading, setLoading] = useState(!initialData);

    useEffect(() => {
        if (!initialData && studentId) {
            fetchStudentRisk();
        }
    }, [studentId, initialData]);

    const fetchStudentRisk = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return; // Silent fail if no token and no initial data

            const res = await axios.get(`${API_URL}/analysis/risk?student_id=${studentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRiskData(res.data[0] || { is_at_risk: false, risks: [] });
        } catch (error) {
            console.error('Error fetching student risk:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 animate-pulse flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
        </div>
    );

    const isAtRisk = riskData?.is_at_risk;
    const academicRisk = riskData?.risks?.find(r => r.type === 'academic');
    const attendanceRisk = riskData?.risks?.find(r => r.type === 'absenteeism');

    let status = isAtRisk ? 'red' : 'green';

    const configs = {
        green: {
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
            icon: <ShieldCheck className="w-6 h-6" />,
            title: 'Tout va bien',
            desc: 'Les indicateurs de suivi sont excellents. Votre enfant progresse bien.',
            light: 'bg-emerald-500 shadow-emerald-200'
        },
        red: {
            bg: 'bg-rose-50',
            border: 'border-rose-100',
            iconBg: 'bg-rose-100',
            iconColor: 'text-rose-600',
            icon: <ShieldAlert className="w-6 h-6" />,
            title: 'Alerte Vigilance',
            desc: academicRisk
                ? `L'IA a détecté une baisse importante en ${academicRisk.label.split(' en ')[1] || 'certaines matières'}.`
                : 'Plusieurs indicateurs (notes ou assiduité) nécessitent votre attention.',
            light: 'bg-rose-500 shadow-rose-200'
        }
    };

    const config = configs[status];

    return (
        <div className={`${config.bg} ${config.border} border rounded-[2rem] p-6 shadow-sm transition-all duration-500`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className={`${config.iconBg} ${config.iconColor} p-3 rounded-2xl shadow-sm rotate-3 group-hover:rotate-0 transition-transform`}>
                        {config.icon}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-lg">Sentinelle IA</h4>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Suivi en temps réel</p>
                    </div>
                </div>
                {/* Traffic Light Visual (Binary: Red / Green) */}
                <div className="flex flex-col gap-1.5 p-1.5 bg-slate-800 rounded-full shadow-inner">
                    <div className={`w-3 h-3 rounded-full ${status === 'red' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-red-900/50'}`}></div>
                    <div className={`w-3 h-3 rounded-full ${status === 'green' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-emerald-900/50'}`}></div>
                </div>
            </div>

            <div className="mt-4">
                <h5 className={`font-extrabold text-sm uppercase mb-1 ${config.iconColor}`}>{config.title}</h5>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    {config.desc}
                </p>
            </div>

            {isAtRisk && (
                <button
                    onClick={() => {
                        // Logic to navigate to details or just a toast
                        alert("Consultez le relevé de notes pour plus de détails sur les matières concernées.");
                    }}
                    className="mt-6 w-full py-3 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                    VOIR LES DÉTAILS DU SUIVI
                </button>
            )}
        </div>
    );
};

export default ParentSentinelWidget;
