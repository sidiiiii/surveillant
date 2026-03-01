import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { API_URL } from '../config';

const RegisterParent = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await axios.post(`${API_URL}/auth/register-parent`, formData);
            alert('Parent account created! Please log in.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">Parent Registration</h2>

                {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input name="name" required className="w-full px-3 py-2 border rounded-md" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input name="email" type="email" required className="w-full px-3 py-2 border rounded-md" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input name="password" type="password" required className="w-full px-3 py-2 border rounded-md" onChange={handleChange} />
                    </div>

                    <button
                        type="submit"
                        className="w-full px-4 py-2 mt-6 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 flex justify-center"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
                    </button>

                </form>

                <div className="mt-4 text-center">
                    <Link to="/login" className="text-blue-600 hover:underline">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterParent;
