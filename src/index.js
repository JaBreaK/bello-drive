const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config(); // Load env vars immediately

const uploadRoute = require("./routes/upload");
const filesRoute = require("./routes/files");
const downloadRoute = require("./routes/download");
const authRoute = require("./routes/auth");
const logger = require("./utils/logger");

// --- Env Validation ---
const REQUIRED_ENV = [
  "DISCORD_BOT_TOKEN",
  "DISCORD_CHANNEL_ID",
  "SUPABASE_URL",
  "SUPABASE_KEY",
  "ENCRYPTION_KEY",
  "JWT_SECRET"
];

const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`❌ [CRITICAL] Missing Env Vars: ${missing.join(", ")}`);
  process.exit(1);
}

const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const app = express();

// --- Proxy Trust (Crucial for Vercel Rate Limiting) ---
// See: https://express-rate-limit.github.io/ERR_ERL_UNEXPECTED_X_FORWARDED_FOR/
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// --- Tracing & Logging Middleware (Multi-User Optimization) ---
app.use((req, res, next) => {
  req.id = crypto.randomBytes(4).toString("hex"); // Short unique ID
  logger.log(`[${req.id}] ${req.method} ${req.url}`);
  next();
});

// --- Security & Middleware ---

// 1. Helmet for security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// 2. CORS Configuration
// For production, you should restrict this to your actual frontend URL
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? process.env.ALLOWED_ORIGIN : "*",
  methods: ["GET", "POST", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 3. Global Rate Limiting (2000 requests per 15 minutes)
// High threshold to allow multi-gigabyte files (5GB+ @ 20MB chunks is 256 reqs).
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// 4. Stricter Limiter for Sensitive Operations (Starting/Finalizing Uploads)
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 50, // max 50 sensitive ops per hour
  message: { error: "Action limit reached. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 5. Body Parsing with Size Limits (Pre-prevent large payload attacks)
app.use(express.json({ limit: "100kb" })); // Metadata only needs very small payloads
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// --- Routes ---

app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "Bello Drive Backend is Running 😺☁️",
    version: "1.0.0",
  });
});

app.get("/status", (req, res) => {
  res.json({
    status: "online",
    storage: "supabase",
    serverTime: Date.now()
  });
});

// Apply sensitive limiter to specific heavy/critical paths
app.use("/upload/finalize", sensitiveLimiter);
app.use("/upload/cancel", sensitiveLimiter);
app.use("/upload", uploadRoute); // /upload/chunk remains under globalLimiter only

app.use("/files/folder", sensitiveLimiter); // Bulk delete is heavy
app.use("/files", filesRoute);
app.use("/download", downloadRoute);
app.use("/auth", authRoute);
app.use("/admin", require("./routes/admin"));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
const { storage } = require("./services/storage");

// 1. Initial Status Check
logger.log("[Startup] Initializing Bello Drive (Supabase Mode)...");

// 2. Init Storage (Async check)
if (process.env.NODE_ENV !== "test") {
  storage.init().then(() => {
    // 3. Start Server
    app.listen(PORT, () => {
      logger.log(`Bello Drive backend running on http://localhost:${PORT}`);
    });
  });
}

module.exports = app;
