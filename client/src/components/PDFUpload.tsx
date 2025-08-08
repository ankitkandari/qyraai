'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useApi } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { X, FileText, CheckCircle, XCircle } from 'lucide-react';

interface PDFUploadProps {
    clientId: string;
    onUploadComplete?: () => void;
}

interface UploadResult {
    filename: string;
    status: 'success' | 'error';
    message?: string;
    file_id?: string;
    chunks_count?: number;
    pages?: number;
    file_size?: number;
}

interface UploadResponse {
    message: string;
    total_chunks_added: number;
    results: UploadResult[];
}

export default function PDFUpload({ clientId, onUploadComplete }: PDFUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
    const [uploadStatus, setUploadStatus] = useState<{ message: string; success: boolean } | null>(null);
    const api = useApi();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        // Filter for PDF files only
        const pdfFiles = acceptedFiles.filter(file => file.name.endsWith('.pdf'));

        if (pdfFiles.length !== acceptedFiles.length) {
            setUploadStatus({
                message: `${acceptedFiles.length - pdfFiles.length} non-PDF files were ignored. Only PDF files are supported.`,
                success: false
            });
        }

        setSelectedFiles(prev => [...prev, ...pdfFiles]);
        setUploadStatus(null);
        setUploadResults([]);
    }, []);

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadFiles = async () => {
        if (selectedFiles.length === 0) return;

        setUploading(true);
        setUploadStatus(null);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('files', file);
            });

            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const response = await api.uploadMultiplePDFs(formData);

            clearInterval(progressInterval);
            setUploadProgress(100);

            setUploadResults(response.results);
            setUploadStatus({
                message: response.message,
                success: response.results.some(r => r.status === 'success')
            });

            // Clear selected files after successful upload
            if (response.results.some(r => r.status === 'success')) {
                setSelectedFiles([]);
                onUploadComplete?.();
            }

        } catch (error: any) {
            setUploadStatus({
                message: `Upload failed: ${error.response?.data?.detail || error.message}`,
                success: false
            });
            setUploadProgress(0);
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
        },
        multiple: true,
        disabled: uploading,
    });

    return (
        <div className="space-y-6">
            {/* Drop Zone */}
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                        ? 'border-blue-500 bg-blue-50'
                        : uploading
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                            : 'border-gray-300 hover:border-gray-400'
                    }`}
            >
                <input {...getInputProps()} />
                <div className="space-y-3">
                    <svg className="mx-auto h-16 w-16 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    {isDragActive ? (
                        <p className="text-lg text-blue-600 font-medium">Drop the PDF files here...</p>
                    ) : (
                        <>
                            <p className="text-lg text-gray-600 font-medium">
                                Drag and drop PDF files here, or click to select
                            </p>
                            <p className="text-sm text-gray-500">
                                Multiple PDF files supported • Max 10MB per file
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                            Selected Files ({selectedFiles.length})
                        </h3>
                        <button
                            onClick={uploadFiles}
                            disabled={uploading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
                        </button>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                        {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between py-2 px-3 bg-white rounded-md mb-2 last:mb-0">
                                <div className="flex items-center space-x-3">
                                    <FileText className="h-5 w-5 text-red-500" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                </div>
                                {!uploading && (
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="text-gray-400 hover:text-red-500 p-1"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Upload Progress */}
            {uploading && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Uploading files...</span>
                        <span className="text-sm text-gray-500">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                </div>
            )}

            {/* Upload Results */}
            {uploadResults.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-lg font-medium text-gray-900">Upload Results</h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                        {uploadResults.map((result, index) => (
                            <div key={index} className="flex items-start space-x-3 py-3 px-3 bg-white rounded-md mb-2 last:mb-0">
                                {result.status === 'success' ? (
                                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {result.filename}
                                    </p>
                                    {result.status === 'success' ? (
                                        <div className="text-xs text-gray-500 space-y-1">
                                            <p>{result.chunks_count} chunks • {result.pages} pages</p>
                                            <p>{result.file_size ? formatFileSize(result.file_size) : ''}</p>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-red-600">{result.message}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Status Alert */}
            {uploadStatus && (
                <Alert variant={uploadStatus.success ? 'default' : 'destructive'}>
                    <AlertTitle>{uploadStatus.success ? 'Upload Complete' : 'Upload Error'}</AlertTitle>
                    <AlertDescription>{uploadStatus.message}</AlertDescription>
                </Alert>
            )}

            {/* Help Text */}
            <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
                <p className="font-medium text-blue-900 mb-2">📚 Knowledge Base Tips:</p>
                <ul className="space-y-1 text-blue-800">
                    <li>• Upload multiple PDF documents to build your chatbot's knowledge base</li>
                    <li>• Each file is processed into chunks for semantic search</li>
                    <li>• Your chatbot will reference these documents when answering questions</li>
                    <li>• Supported: PDF files up to 10MB each</li>
                </ul>
            </div>
        </div>
    );
}