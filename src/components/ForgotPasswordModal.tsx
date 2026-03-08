import { useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { authApi } from '../api/auth';
import ErrorMessage from './commons/ErrorMessage';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'phone' | 'otp' | 'password' | 'success';

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [channel, setChannel] = useState<'email' | 'zalo' | 'sms'>('email');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword(phone, channel);
      
      if (res?.statusCode === 200) {
        setStep('otp');
        setSuccess(true);
        setEmail(res?.data?.email as string);
      } else {
        setError(res?.message as string || 'Có lỗi xảy ra khi gửi OTP');
      }
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi gửi OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp) {
      setError('Vui lòng nhập mã OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyOtp(phone, otp);

      if (res?.statusCode === 200 && res?.data?.resetToken) {
        setResetToken(res.data.resetToken);
        setStep('password');
        setSuccess(true);
      } else {
        setError(res?.message as string || 'Có lỗi xảy ra khi xác thực OTP');
      }
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi xác thực OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ mật khẩu');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword(resetToken, newPassword, confirmPassword);

      if (res?.statusCode === 200) {
        setStep('success');
        setSuccess(true);
      } else {
        setError(res?.message as string || 'Có lỗi xảy ra khi đặt lại mật khẩu');
      }
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('phone');
      setOtp('');
      setError(null);
    } else if (step === 'password') {
      setStep('otp');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
    } else {
      onClose();
    }
  };

  const handleClose = () => {
    setStep('phone');
    setPhone('');
    setOtp('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setChannel('email');
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {step !== 'phone' && (
              <button
                onClick={handleBack}
                className="p-1 hover:bg-accent rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
            <h2 className="text-lg font-semibold text-foreground">
              {step === 'phone' && 'Quên mật khẩu'}
              {step === 'otp' && 'Nhập mã OTP'}
              {step === 'password' && 'Đặt mật khẩu mới'}
              {step === 'success' && 'Hoàn thành'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {success && step === 'phone' && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg">
            OTP đã được gửi về số điện thoại của bạn. Vui lòng kiểm tra tin nhắn SMS.
          </div>
        )}

        {success && step === 'password' && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg">
            Xác thực OTP thành công! Vui lòng nhập mật khẩu mới của bạn.
          </div>
        )}

        {success && step === 'success' && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg">
            Đặt lại mật khẩu thành công!
          </div>
        )}

        {error && <ErrorMessage error={error} setError={setError} />}

        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground outline-none focus:ring-2 focus:ring-ring"
                placeholder="Nhập số điện thoại đăng nhập của bạn"
                required
              />
            </div>

            {/* Đã ẩn phần chọn channel - mặc định gửi SMS */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Mã OTP sẽ được gửi qua email của bạn.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground bg-background border border-input rounded-lg hover:bg-accent transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-primary-foreground bg-blue-600 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loading ? 'Đang gửi...' : 'Gửi OTP'}
              </button>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Mã OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground outline-none focus:ring-2 focus:ring-ring text-center text-lg tracking-widest"
                placeholder="Nhập mã OTP 6 chữ số"
                maxLength={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                Mã OTP đã được gửi qua SMS tới số điện thoại {phone}
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground bg-background border border-input rounded-lg hover:bg-accent transition-colors"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-primary-foreground bg-blue-600 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loading ? 'Đang xác thực...' : 'Xác thực OTP'}
              </button>
            </div>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground outline-none focus:ring-2 focus:ring-ring"
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                minLength={6}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground outline-none focus:ring-2 focus:ring-ring"
                placeholder="Nhập lại mật khẩu mới"
                minLength={6}
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground bg-background border border-input rounded-lg hover:bg-accent transition-colors"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-primary-foreground bg-blue-600 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
              </button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Thành công!</h3>
              <p className="text-sm text-muted-foreground">
                Mật khẩu của bạn đã được đặt lại thành công. Vui lòng đăng nhập lại với mật khẩu mới.
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full px-4 py-2 text-sm font-medium text-primary-foreground bg-blue-600 rounded-lg hover:opacity-90 transition-opacity"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
