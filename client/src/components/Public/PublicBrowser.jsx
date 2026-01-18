import { useState, useEffect } from "react";
import { Download, File, FileImage, FileText, FileVideo, FileAudio, Globe, LogIn, Cat, Loader2, Eye, Share2 } from "lucide-react";
import FilePreviewModal from "../Modals/FilePreviewModal";

const API = import.meta.env.PROD ? "" : "http://localhost:3000";

const getFileIcon = (type) => {
    if (!type) return File;
    if (type.startsWith("image/")) return FileImage;
    if (type.startsWith("video/")) return FileVideo;
    if (type.startsWith("audio/")) return FileAudio;
    if (type.includes("pdf") || type.includes("text")) return FileText;
    return File;
};

const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const PublicBrowser = ({ onSwitchToLogin }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);
    const [shareModal, setShareModal] = useState(null);

    useEffect(() => {
        fetchPublicFiles();
    }, []);

    const fetchPublicFiles = async () => {
        try {
            const res = await fetch(`${API}/files/public`);
            if (!res.ok) throw new Error("Failed to load files");
            const data = await res.json();
            setFiles(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (filename) => {
        const downloadUrl = `${API}/download/${encodeURIComponent(filename)}?download=true`;
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePreview = (file) => {
        const ext = file.name.split(".").pop().toLowerCase();
        if (["png", "jpg", "jpeg", "gif", "webp", "mp4", "webm", "mkv", "mov", "mp3", "wav", "ogg", "pdf"].includes(ext)) {
            setPreviewFile(file);
        } else {
            // Fallback to download if preview not supported
            handleDownload(file.name);
        }
    };

    const handleShare = (file) => {
        const baseUrl = window.location.origin;
        // For public files, we can construct the link directly
        // Or use the backend endpoint if we want to be consistent, but backend requires auth for /share
        // So we'll construct it manually for public files
        const shareUrl = `${API}/download/${encodeURIComponent(file.name)}`;
        const downloadUrl = `${shareUrl}?download=true`;

        setShareModal({
            shareUrl,
            downloadUrl,
            filename: file.name,
            size: file.size,
            type: file.type
        });
    };

    return (
        <div className="min-h-screen bg-ctp-crust bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-ctp-mantle to-ctp-crust">
            {/* Modals */}
            <FilePreviewModal file={previewFile} api={API} onClose={() => setPreviewFile(null)} />

            {/* Header */}
            <header className="bg-ctp-base/50 backdrop-blur-xl border-b border-ctp-surface0/20 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ctp-blue to-ctp-mauve flex items-center justify-center">
                            <Cat size={20} className="text-ctp-base" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-ctp-text">Bello Drive</h1>
                            <p className="text-xs text-ctp-subtext0 flex items-center gap-1">
                                <Globe size={12} /> Public Files
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onSwitchToLogin}
                        className="btn btn-sm bg-ctp-surface0/50 hover:bg-ctp-surface0 border-ctp-surface0/30 text-ctp-text flex items-center gap-2"
                    >
                        <LogIn size={16} />
                        Sign In
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-6xl mx-auto p-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-ctp-text mb-2">Public Files</h2>
                    <p className="text-ctp-subtext0">Browse and download publicly shared files</p>
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={32} className="animate-spin text-ctp-blue" />
                    </div>
                )}

                {error && (
                    <div className="text-center py-20">
                        <p className="text-ctp-red">{error}</p>
                    </div>
                )}

                {!loading && !error && files.length === 0 && (
                    <div className="text-center py-20">
                        <Globe size={48} className="mx-auto text-ctp-subtext0/30 mb-4" />
                        <p className="text-ctp-subtext0">No public files available</p>
                    </div>
                )}

                {!loading && !error && files.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {files.map((file) => {
                            const Icon = getFileIcon(file.type);
                            return (
                                <div
                                    key={file.id}
                                    className="bg-ctp-base rounded-xl p-4 border border-ctp-surface0/20 hover:border-ctp-blue/30 transition-all group"
                                >
                                    <div
                                        className="flex items-start gap-3 mb-3 cursor-pointer"
                                        onClick={() => handlePreview(file)}
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-ctp-surface0/50 flex items-center justify-center flex-shrink-0">
                                            <Icon size={20} className="text-ctp-blue" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-ctp-text truncate group-hover:text-ctp-blue transition-colors" title={file.name}>
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-ctp-subtext0">
                                                {formatBytes(file.size)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-4">
                                        <button
                                            onClick={() => handlePreview(file)}
                                            className="flex-1 btn btn-sm bg-ctp-surface0/30 hover:bg-ctp-surface0/50 text-ctp-text border-0 flex items-center justify-center gap-2"
                                            title="Preview"
                                        >
                                            <Eye size={14} />
                                            Open
                                        </button>
                                        <button
                                            onClick={() => handleShare(file)}
                                            className="btn btn-sm bg-ctp-surface0/30 hover:bg-ctp-surface0/50 text-ctp-text border-0 flex items-center justify-center"
                                            title="Share"
                                        >
                                            <Share2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDownload(file.name)}
                                            className="btn btn-sm bg-ctp-blue/10 hover:bg-ctp-blue/20 text-ctp-blue border-0 flex items-center justify-center"
                                            title="Download"
                                        >
                                            <Download size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default PublicBrowser;
