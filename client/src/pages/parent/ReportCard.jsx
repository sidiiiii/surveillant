import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';

const ReportCard = ({ studentId }) => {
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (studentId) fetchReport();
    }, [studentId]);

    const fetchReport = async () => {
        try {
            const token = localStorage.getItem('token');
            // We need grades and subjects.
            // Ideally backend sends a combined report, but for now we fetch grades 
            // and maybe we should fetch subjects too to show empty ones?
            // Let's just list grades for now or group them by subject.

            const res = await axios.get(`${API_URL}/grades/report/${studentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Group by Subject
            // response.data is list of grades with subject_name

            const grouped = {};
            response.data.forEach(g => {
                if (!grouped[g.subject_name]) {
                    grouped[g.subject_name] = [];
                }
                grouped[g.subject_name].push(g);
            });

            setReport(grouped);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading Report Card...</div>;

    return (
        <div className="p-6 mt-6 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-bold text-gray-800">Bulletin Scolaire (Report Card)</h2>

            {Object.keys(report).length === 0 ? <p>No grades available.</p> : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Principal Subject</th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Grades</th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Average</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(report).map(([subject, grades]) => {
                                const sum = grades.reduce((acc, curr) => acc + curr.grade, 0);
                                const avg = (sum / grades.length).toFixed(2);

                                return (
                                    <tr key={subject}>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{subject}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                            {grades.map((g, i) => (
                                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                                    {g.grade} <span className="ml-1 text-gray-400">({g.type})</span>
                                                </span>
                                            ))}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">{avg}/20</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ReportCard;
