import { useState } from "react";
import { LogIn, Eye, EyeOff, Loader2, Cat, AlertCircle, Globe } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const LoginPage = ({ onSwitchToRegister, onSwitchToPublic }) => {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(username, password);
            // Login success - App.jsx will handle redirect
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-ctp-crust flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-ctp-mantle to-ctp-crust">
            <div className="w-full max-w-sm animate-scale-in">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-ctp-blue to-ctp-mauve mb-4">
                        <Cat size={32} className="text-ctp-base" />
                    </div>
                    <h1 className="text-2xl font-bold text-ctp-text">Welcome Back</h1>
                    <p className="text-sm text-ctp-subtext0 mt-1">Sign in to Bello Drive</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-ctp-base rounded-2xl p-6 shadow-xl border border-ctp-surface0/20">
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-ctp-red/10 border border-ctp-red/30 flex items-center gap-2 text-ctp-red text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Username */}
                        <div>
                            <label className="block text-xs text-ctp-subtext0 uppercase tracking-wider mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full input bg-ctp-surface0/30 border-ctp-surface0/50 text-ctp-text focus:border-ctp-blue focus:ring-1 focus:ring-ctp-blue/30"
                                placeholder="Enter username"
                                required
                                autoComplete="username"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs text-ctp-subtext0 uppercase tracking-wider mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full input bg-ctp-surface0/30 border-ctp-surface0/50 text-ctp-text focus:border-ctp-blue focus:ring-1 focus:ring-ctp-blue/30 pr-10"
                                    placeholder="Enter password"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ctp-subtext0 hover:text-ctp-text transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 btn bg-ctp-blue hover:bg-ctp-blue/80 text-ctp-base border-0 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <>
                                <LogIn size={18} />
                                Sign In
                            </>
                        )}
                    </button>
                </form>

                {/* Register Link */}
                <p className="text-center mt-6 text-sm text-ctp-subtext0">
                    Don't have an account?{" "}
                    <button
                        onClick={onSwitchToRegister}
                        className="text-ctp-blue hover:underline font-medium"
                    >
                        Sign up
                    </button>
                </p>

                {/* Browse Public */}
                {onSwitchToPublic && (
                    <button
                        onClick={onSwitchToPublic}
                        className="w-full mt-4 btn btn-sm bg-transparent hover:bg-ctp-surface0/30 border-ctp-surface0/30 text-ctp-subtext0 flex items-center justify-center gap-2"
                    >
                        <Globe size={16} />
                        Browse as Guest
                    </button>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
