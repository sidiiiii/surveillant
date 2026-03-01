import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { API_URL } from '../config';
import SurveillantLogo from '../assets/Surveillant.jpeg';

const RegisterSchool = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        schoolName: '',
        schoolAddress: '',
        schoolEmail: '',
        schoolPhone: '',
        adminName: '',
        adminEmail: '',
        password: ''
    });
    const [logo, setLogo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [successCode, setSuccessCode] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (logo) data.append('logo', logo);

        try {
            const response = await axios.post(`${API_URL}/auth/register-school`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccessCode(response.data.schoolCode);
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    if (successCode) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
                <div className="w-full max-w-lg p-8 bg-white rounded-lg shadow-md text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="p-3 bg-green-100 rounded-full">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                    </div>
                    <h2 className="mb-4 text-2xl font-bold text-gray-800">Registration Successful!</h2>
                    <p className="text-gray-600 mb-6">Your school has been registered. Here is your unique School Code. Share this with parents so they can link to your school.</p>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                        <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider mb-1">School Code</p>
                        <p className="text-4xl font-mono fontWeight-bold text-blue-800 tracking-widest select-all">{successCode}</p>
                    </div>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full px-4 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 font-medium"
                    >
                        Continue to Login
                    </button>

                    <p className="mt-4 text-sm text-gray-500">
                        Please save this code securely. You can also find it in your dashboard settings.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-lg p-8 bg-white rounded-lg shadow-md">
                <div className="text-center mb-6">
                    <img src={SurveillantLogo} alt="Surveillant" className="w-16 h-16 mx-auto rounded-full object-cover shadow-sm mb-3" />
                    <h1 className="text-xl font-bold text-gray-900">Surveillant <span className="text-blue-600 font-arabic">المراقب</span></h1>
                </div>
                <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">Register Your School</h2>

                {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">School Name</label>
                        <input name="schoolName" required className="w-full px-3 py-2 border rounded-md" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">School Address</label>
                        <input name="schoolAddress" className="w-full px-3 py-2 border rounded-md" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">School Email</label>
                        <input name="schoolEmail" type="email" required className="w-full px-3 py-2 border rounded-md" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Numéro de Téléphone</label>
                        <input name="schoolPhone" type="tel" placeholder="Ex: +222 12 34 56 78" className="w-full px-3 py-2 border rounded-md" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">School Logo</label>
                        <input name="logo" type="file" accept="image/*" className="w-full px-3 py-2 border rounded-md" onChange={(e) => setLogo(e.target.files[0])} />
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Administrator Account</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Admin Name</label>
                            <input name="adminName" required className="w-full px-3 py-2 border rounded-md" onChange={handleChange} />
                        </div>
                        <div className="mt-2">
                            <label className="block text-sm font-medium text-gray-700">Admin Email</label>
                            <input name="adminEmail" type="email" required className="w-full px-3 py-2 border rounded-md" onChange={handleChange} />
                        </div>
                        <div className="mt-2">
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input name="password" type="password" required className="w-full px-3 py-2 border rounded-md" onChange={handleChange} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full px-4 py-2 mt-6 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 flex justify-center"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Register School'}
                    </button>

                </form>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Besoin d'aide ?</p>
                    <p className="text-xs text-blue-700">Contactez-nous : <a href="mailto:ssurveilleur@gmail.com" className="font-bold underline hover:text-blue-900">ssurveilleur@gmail.com</a></p>
                </div>

                <div className="mt-4 text-center">
                    <Link to="/" className="text-blue-600 hover:underline">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterSchool;
