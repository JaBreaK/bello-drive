import { useState } from "react";
import { UserPlus, Eye, EyeOff, Loader2, Cat, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const RegisterPage = ({ onSwitchToLogin }) => {
    const { register } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (username.length < 3) {
            setError("Username must be at least 3 characters");
            return;
        }

        setLoading(true);

        try {
            await register(username, password);
            // Register success - App.jsx will handle redirect
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-ctp-green to-ctp-teal mb-4">
                        <Cat size={32} className="text-ctp-base" />
                    </div>
                    <h1 className="text-2xl font-bold text-ctp-text">Create Account</h1>
                    <p className="text-sm text-ctp-subtext0 mt-1">Join Bello Drive</p>
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
                                className="w-full input bg-ctp-surface0/30 border-ctp-surface0/50 text-ctp-text focus:border-ctp-green focus:ring-1 focus:ring-ctp-green/30"
                                placeholder="Choose a username"
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
                                    className="w-full input bg-ctp-surface0/30 border-ctp-surface0/50 text-ctp-text focus:border-ctp-green focus:ring-1 focus:ring-ctp-green/30 pr-10"
                                    placeholder="Create password"
                                    required
                                    autoComplete="new-password"
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

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-xs text-ctp-subtext0 uppercase tracking-wider mb-2">
                                Confirm Password
                            </label>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full input bg-ctp-surface0/30 border-ctp-surface0/50 text-ctp-text focus:border-ctp-green focus:ring-1 focus:ring-ctp-green/30"
                                placeholder="Confirm password"
                                required
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 btn bg-ctp-green hover:bg-ctp-green/80 text-ctp-base border-0 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <>
                                <UserPlus size={18} />
                                Create Account
                            </>
                        )}
                    </button>
                </form>

                {/* Login Link */}
                <p className="text-center mt-6 text-sm text-ctp-subtext0">
                    Already have an account?{" "}
                    <button
                        onClick={onSwitchToLogin}
                        className="text-ctp-blue hover:underline font-medium"
                    >
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
