import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { authApi } from "../api/auth";
import ErrorMessage from "../components/commons/ErrorMessage";
import ForgotPasswordModal from "../components/ForgotPasswordModal";

interface LoginProps {
  onLogin: (token: string, userInfo?: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!phone || !password) {
        throw new Error("Vui lòng nhập email và mật khẩu");
      }
      const res = await authApi.login({ phone, password });
      if (!res?.token) {
        throw new Error("Thông tin đăng nhập không hợp lệ");
      }
      // Pass the entire response to get refreshToken
      onLogin(res.token, res);
    } catch (err: any) {
      const message =
        err?.message || err?.data?.errors?.message || "Đăng nhập thất bại";
      setError(typeof message === "string" ? message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border-2 border-border rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground text-center">
          Đăng nhập
        </h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Truy cập giao diện quản lý
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (<ErrorMessage error={error} setError={setError} />)}

          <div className="space-y-2">
            <label className="text-sm text-foreground" htmlFor="phone">
              Số điện thoại
            </label>
            <input
              id="phone"
              type="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value.trim())}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground outline-none focus:ring-2 focus:ring-ring"
              placeholder="Nhập số điện thoại"
              autoComplete="phone"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-foreground" htmlFor="password">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value.trim())}
                className="w-full px-3 py-2 pr-12 rounded-lg border border-input bg-background text-foreground outline-none focus:ring-2 focus:ring-ring"
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-blue-600 text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(true)}
              className="text-sm text-primary hover:underline"
            >
              Quên mật khẩu?
            </button>
          </div>
        </form>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
    </div>
  );
}
