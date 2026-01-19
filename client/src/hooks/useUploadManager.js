import axios from "axios";
import axiosRetry from "axios-retry";
import { useEffect, useRef, useState } from "react";
import { useToast } from "../context/ToastContext";

// Configure Robustness
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => {
    return axiosRetry.exponentialDelay(retryCount);
  },
  retryCondition: (error) => {
    // ONLY retry on true network errors.
    // 429 and 500 are handled globally by the backend Discord service.
    return axiosRetry.isNetworkError(error);
  },
});

// Discord non-Nitro limit is 10MB, we use 9.5MB to be safe
const getOptimalChunkSize = (size) => {
  // All files use 9.5MB chunks (max for Discord without Nitro)
  return 3 * 1024 * 1024; // 5MB
};

export const useUploadManager = (api, onUploadComplete, getAuthHeaders = () => ({})) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Idle");

  const { addToast } = useToast();

  // Refs
  const lastUpdateRef = useRef(0);
  const lastBytesRef = useRef(0);
  const smoothedSpeedRef = useRef(0);
  const abortControllerRef = useRef(null);

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTime = (seconds) => {
    if (!isFinite(seconds) || seconds < 0) return "--";
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.ceil(seconds % 60);
    return `${m}m ${s}s`;
  };

  const getResumeKey = (file) => `bello_resume_${file.name}_${file.size}_${file.lastModified}`;

  const handleCancel = () => {
    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      abortControllerRef.current.abort();
      setStatus("Cancelling...");
    }
  };

  const uploadSingleFile = async (file, index, total, targetFolder = "/") => {
    const chunkSize = getOptimalChunkSize(file.size);
    const resumeKey = getResumeKey(file) + `_${targetFolder === "/" ? "root" : targetFolder.replace(/\//g, "-")}`;

    // Resume Logic: Load existing progress
    let storedChunks = [];
    try {
      const stored = localStorage.getItem(resumeKey);
      if (stored) storedChunks = JSON.parse(stored);
    } catch (e) {
      console.error("Resume Load Error:", e);
    }

    const completedIndices = new Set(storedChunks.map((c) => c.index));
    const uploadedChunks = [...storedChunks];
    let totalUploadedBytes = storedChunks.reduce((acc, c) => acc + c.size, 0);

    setStatus(storedChunks.length > 0 ? `Resuming ${file.name}...` : `Starting ${file.name}...`);
    setProgress(storedChunks.length > 0 ? Math.round((totalUploadedBytes / file.size) * 100) : 0);

    const startTime = Date.now();
    lastUpdateRef.current = startTime;
    lastBytesRef.current = totalUploadedBytes;
    smoothedSpeedRef.current = 0;

    const totalChunks = Math.ceil(file.size / chunkSize);
    const poolLimit = 1; // SAFE-SERIAL: Use strict serial to avoid Discord pressure

    const activePromises = new Set();
    const activeChunkProgress = {};

    const updateRealTimeProgress = () => {
      if (abortControllerRef.current?.signal.aborted) return;
      const activeBytes = Object.values(activeChunkProgress).reduce((sum, val) => sum + val, 0);
      const currentTotalBytes = totalUploadedBytes + activeBytes;

      let pct = Math.round((currentTotalBytes / file.size) * 100);
      if (pct >= 100) pct = 99;
      setProgress(pct);

      const now = Date.now();
      const timeDiff = now - lastUpdateRef.current;

      if (timeDiff >= 200) {
        const bytesDiff = currentTotalBytes - lastBytesRef.current;
        const secondsDiff = timeDiff / 1000;

        if (secondsDiff > 0) {
          const instantSpeed = bytesDiff / secondsDiff;
          const smoothSpeed = smoothedSpeedRef.current * 0.8 + instantSpeed * 0.2;
          smoothedSpeedRef.current = smoothSpeed;

          const remainingBytes = file.size - currentTotalBytes;
          const etaSeconds = smoothSpeed > 0 ? remainingBytes / smoothSpeed : 0;

          setStatus(`${formatBytes(currentTotalBytes)} / ${formatBytes(file.size)} • ${formatBytes(smoothSpeed)}/s • ${formatTime(etaSeconds)}`);
        }

        lastUpdateRef.current = now;
        lastBytesRef.current = currentTotalBytes;
      }
    };

    const uploadChunk = async (i) => {
      const signal = abortControllerRef.current?.signal;
      if (signal?.aborted) throw new axios.Cancel("Aborted");

      const start = i * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      const chunkBlob = file.slice(start, end);

      const formData = new FormData();
      formData.append("file", chunkBlob, `part-${i}_${file.name}`);

      try {
        const res = await axios.post(`${api}/upload/chunk`, formData, {
          signal,
          headers: getAuthHeaders(),
          onUploadProgress: (progressEvent) => {
            if (signal?.aborted) return;
            activeChunkProgress[i] = progressEvent.loaded;
            updateRealTimeProgress();
          },
        });

        if (signal?.aborted) throw new axios.Cancel("Aborted");

        totalUploadedBytes += chunkBlob.size;
        delete activeChunkProgress[i];
        updateRealTimeProgress();

        const result = {
          index: i,
          messageId: res.data.messageId,
          url: res.data.url,
          iv: res.data.iv,
          size: res.data.size,
        };

        uploadedChunks.push(result);
        // IMMEDIATE ATTACH: Update the file reference immediately to ensure cancellation
        // handler has the latest IDs for cleanup.
        file.uploadedChunks = [...uploadedChunks];

        localStorage.setItem(resumeKey, JSON.stringify(uploadedChunks));
        return result;
      } catch (err) {
        delete activeChunkProgress[i];
        throw err;
      }
    };

    // Process Chunks
    for (let i = 0; i < totalChunks; i++) {
      if (abortControllerRef.current?.signal.aborted) throw new axios.Cancel("Queue Aborted");
      if (completedIndices.has(i)) continue;

      const p = uploadChunk(i);
      activePromises.add(p);
      p.finally(() => activePromises.delete(p));

      if (activePromises.size >= poolLimit) {
        await Promise.race(activePromises);
      }
    }

    await Promise.all(activePromises);

    if (abortControllerRef.current?.signal.aborted) throw new axios.Cancel("Queue Aborted");

    uploadedChunks.sort((a, b) => a.index - b.index);
    setStatus("Finalizing...");

    await axios.post(
      `${api}/upload/finalize`,
      {
        filename: file.name,
        totalSize: file.size,
        type: file.type || file.name.split(".").pop(),
        folder: targetFolder,
        chunks: uploadedChunks,
        iv: null,
      },
      {
        signal: abortControllerRef.current?.signal,
        headers: getAuthHeaders()
      }
    );

    localStorage.removeItem(resumeKey);
  };

  const processQueue = async (targetFolder = "/", filesOverride = null) => {
    const queue = filesOverride || files;
    if (queue.length === 0) return;

    if (filesOverride) setFiles(filesOverride);

    setUploading(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      for (let i = 0; i < queue.length; i++) {
        if (signal.aborted) throw new axios.Cancel("Queue Aborted");
        setCurrentFileIndex(i);

        const file = queue[i];
        let finalFolder = targetFolder;

        // Handle Folder Uploads (webkitRelativePath)
        if (file.webkitRelativePath) {
          const relPath = file.webkitRelativePath;
          const lastSlash = relPath.lastIndexOf("/");
          if (lastSlash !== -1) {
            const subFolder = relPath.substring(0, lastSlash);
            if (targetFolder === "/") {
              finalFolder = `/${subFolder}/`;
            } else {
              finalFolder = `${targetFolder}${subFolder}/`;
            }
          }
        }

        await uploadSingleFile(file, i, queue.length, finalFolder);
      }

      setStatus("Done");
      setFiles([]);
      setProgress(100);
      onUploadComplete?.();
      addToast("All uploads finished", "success");
    } catch (err) {
      if (axios.isCancel(err) || signal.aborted) {
        setStatus("Cancelled");
        addToast("Upload Stopped", "info");

        // CLEANUP: If we have already uploaded some chunks, delete them from Discord
        const messageIds = queue.flatMap(f => f.uploadedChunks || []).map(c => c.messageId);
        if (messageIds.length > 0) {
          console.log(`[Cleanup] User cancelled. Cleaning up ${messageIds.length} chunks...`);
          axios.delete(`${api}/upload/cancel`, {
            data: { messageIds },
            // Important: Don't use the aborted signal here!
          }).catch(e => console.error("Cleanup failed:", e));
        }
      } else {
        setStatus("Error");
        console.error(err);
        addToast("Upload failed", "error");
      }
    } finally {
      setUploading(false);
      // Don't null immediately if something might still be checking it,
      // but the signal already says 'aborted'
    }
  };

  // Safe Navigation Guard
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (uploading) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [uploading]);

  return {
    files,
    setFiles,
    uploading,
    progress,
    status,
    currentFileIndex,
    processQueue,
    cancelQueue: handleCancel,
    formatBytes, // useful helper
  };
};
