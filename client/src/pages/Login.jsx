import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { API_URL } from '../config';
import SurveillantLogo from '../assets/Surveillant.jpeg';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email,
                password
            });

            const { token, user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            if (user.is_superadmin || user.role === 'super_admin') {
                navigate('/superadmin');
            } else if (user.role === 'admin' || user.role === 'teacher') {
                navigate('/admin');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-8 -right-4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>

            <div className="w-full max-w-[1100px] grid lg:grid-cols-2 rounded-[2.5rem] shadow-2xl overflow-hidden glass-dark relative z-10 border border-white/5">
                {/* Visual Side */}
                <div className="hidden lg:flex flex-col justify-between p-12 bg-indigo-600 relative overflow-hidden bg-mesh">
                    <div className="relative z-10">
                        <img src={SurveillantLogo} alt="Surveillant" className="w-20 h-20 rounded-2xl object-cover shadow-2xl mb-8" />
                        <h1 className="text-4xl font-black text-white leading-tight mb-4">
                            Bienvenue sur <br /> Surveillant
                        </h1>
                        <p className="text-indigo-100 text-lg font-medium opacity-80 leading-relaxed max-w-[300px]">
                            La plateforme moderne pour le suivi scolaire en temps réel. Notez, suivez, progressez.
                        </p>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                            <p className="text-white text-sm font-bold flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-400 rounded-full"></span> Plus de 50 écoles partenaires
                            </p>
                        </div>
                    </div>

                    {/* Abstract Circle Decoration */}
                    <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                </div>

                {/* Form Side */}
                <div className="bg-white p-8 lg:p-16">
                    <div className="mb-10 flex flex-col gap-4">
                        <Link
                            to="/"
                            className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 flex items-center gap-2"
                        >
                            <span>←</span> Recherche Élève
                        </Link>
                        <h2 className="text-3xl font-black text-slate-900">Connexion Portal</h2>
                        <p className="text-slate-500 font-medium">Entrez vos identifiants pour accéder à votre espace.</p>
                    </div>

                    {error && (
                        <div className="p-4 mb-8 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm font-bold animate-fade-in-down">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Adresse Email</label>
                            <input
                                type="email"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
                                placeholder="votre@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Mot de passe</label>
                            <input
                                type="password"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-5 text-lg group overflow-hidden relative"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin mx-auto text-white" />
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Se connecter <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-10 border-t border-slate-100 space-y-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                to="/register-school"
                                className="w-full p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 transition-all text-center"
                            >
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Écoles</p>
                                <p className="text-sm font-bold text-indigo-600 italic">Inscrire mon école</p>
                            </Link>
                        </div>

                        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                            <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">Besoin d'aide ?</p>
                            <p className="text-sm text-blue-700">
                                Contactez-nous : <a href="mailto:ssurveilleur@gmail.com" className="font-bold underline hover:text-blue-900">ssurveilleur@gmail.com</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
