import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import { FileText, BookOpen, ClipboardList, Download, Eye } from 'lucide-react';

const ParentStudentDocuments = ({ studentId, studentName }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState(null);

    useEffect(() => {
        if (studentId) {
            fetchDocuments();
        }
    }, [studentId]);

    const fetchDocuments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/students/${studentId}/documents`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDocuments(response.data);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'exercice':
                return <FileText className="w-5 h-5 text-blue-600" />;
            case 'devoir':
                return <BookOpen className="w-5 h-5 text-green-600" />;
            case 'examen':
                return <ClipboardList className="w-5 h-5 text-red-600" />;
            default:
                return <FileText className="w-5 h-5 text-gray-600" />;
        }
    };

    const getTypeBadgeColor = (type) => {
        switch (type) {
            case 'exercice':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'devoir':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'examen':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'exercice':
                return '📝 Exercices';
            case 'devoir':
                return '📚 Devoirs';
            case 'examen':
                return '📋 Examens';
            default:
                return type;
        }
    };

    const groupedDocuments = documents.reduce((acc, doc) => {
        if (!acc[doc.type]) acc[doc.type] = [];
        acc[doc.type].push(doc);
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Chargement des documents...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 px-4 sm:px-0">
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border border-blue-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    📚 Documents de {studentName}
                </h2>
                <p className="text-sm text-gray-600">
                    Consultez tous les exercices, devoirs et examens de votre enfant
                </p>
            </div>

            {documents.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center border border-gray-100">
                    <div className="mb-4 text-gray-300">
                        <FileText className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun document disponible</h3>
                    <p className="text-gray-500">
                        Les documents de votre enfant apparaîtront ici une fois qu'ils seront ajoutés par l'école.
                    </p>
                </div>
            ) : (
                <>
                    {['exercice', 'devoir', 'examen'].map(type => {
                        const docs = groupedDocuments[type] || [];
                        if (docs.length === 0) return null;

                        return (
                            <div key={type} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {getTypeIcon(type)}
                                        <h3 className="font-bold text-gray-800 text-lg">
                                            {getTypeLabel(type)} ({docs.length})
                                        </h3>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                                    {docs.map(doc => (
                                        <div
                                            key={doc.id}
                                            className="border rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white"
                                        >
                                            {/* Document Preview */}
                                            <div className="relative group">
                                                {doc.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                    <img
                                                        src={`${API_URL.replace('/api', '')}${doc.file_url}`}
                                                        alt={doc.description}
                                                        className="w-full h-48 object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                        <FileText className="w-16 h-16 text-gray-400" />
                                                    </div>
                                                )}
                                                {/* Overlay on hover */}
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                                                    <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                </div>
                                            </div>

                                            {/* Document Info */}
                                            <div className="p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getTypeBadgeColor(doc.type)}`}>
                                                        {doc.type.toUpperCase()}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                                                    </span>
                                                </div>

                                                {doc.description && (
                                                    <p className="text-sm text-gray-700 mb-3 line-clamp-2 min-h-[40px]">
                                                        {doc.description}
                                                    </p>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 mt-4">
                                                    <a
                                                        href={`${API_URL.replace('/api', '')}${doc.file_url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Voir
                                                    </a>
                                                    <a
                                                        href={`${API_URL.replace('/api', '')}${doc.file_url}`}
                                                        download
                                                        className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </>
            )}
        </div>
    );
};

export default ParentStudentDocuments;
