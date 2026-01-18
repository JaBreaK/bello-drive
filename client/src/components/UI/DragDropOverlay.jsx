import React from "react";
import { UploadCloud } from "lucide-react";

/**
 * A full-screen glassmorphism overlay that appears when dragging files.
 */
const DragDropOverlay = ({ isDragging }) => {
    if (!isDragging) return null;

    return (
        <div className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in pointer-events-none">
            <div className="bg-ctp-base/90 border-4 border-dashed border-ctp-blue p-16 rounded-[2rem] flex flex-col items-center justify-center shadow-2xl transform transition-all duration-300">
                <div className="p-8 bg-ctp-blue/20 rounded-full mb-6 animate-bounce">
                    <UploadCloud size={80} className="text-ctp-blue" />
                </div>
                <h2 className="text-4xl font-bold text-ctp-text mb-3">Drop Files Here</h2>
                <p className="text-ctp-subtext0 text-xl font-medium">Instant Upload to Bello Drive</p>
            </div>
        </div>
    );
};

export default DragDropOverlay;
