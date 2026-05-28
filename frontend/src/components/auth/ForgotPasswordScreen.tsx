import { useState } from 'react'
import { ButtonSpinner } from '../common/LoadingState'
import type { Banner } from '../../types/auth'
import { MailIcon, EyeIcon, EyeOffIcon } from './icons'

type ForgotPasswordForm = {
  email: string
  otp: string
  newPassword: string
  confirmPassword: string
}

type ForgotPasswordErrors = Partial<Record<keyof ForgotPasswordForm, string>>

type ForgotPasswordScreenProps = {
  form: ForgotPasswordForm
  errors: ForgotPasswordErrors
  banner: Banner
  sendingOtp: boolean
  resettingPassword: boolean
  canSendOtp: boolean
  onChange: (field: keyof ForgotPasswordForm, value: string) => void
  onSendOtp: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onGoLogin: () => void
}

export function ForgotPasswordScreen({
  form,
  errors,
  banner,
  sendingOtp,
  resettingPassword,
  canSendOtp,
  onChange,
  onSendOtp,
  onSubmit,
  onGoLogin,
}: ForgotPasswordScreenProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <>
      <div className="screen-icon screen-icon-forgot" aria-hidden="true">
        <MailIcon className="screen-icon-svg" />
      </div>

      <div className="card-title-block">
        <h1>Quên mật khẩu</h1>
        <p>Nhập email HUST, lấy OTP và đặt lại mật khẩu mới.</p>
      </div>

      {banner && (
        <div className={`banner banner-${banner.tone}`} role="alert" aria-live="polite">
          {banner.text}
        </div>
      )}

      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <label className="field">
          <span>Email HUST</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => onChange('email', event.target.value)}
            placeholder="ten.ho225726@sis.hust.edu.vn"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <small className="field-error">{errors.email}</small>}
        </label>

        <div className="forgot-otp-row">
          <label className="field">
            <span>Mã OTP</span>
            <input
              type="text"
              inputMode="numeric"
              value={form.otp}
              onChange={(event) => onChange('otp', event.target.value)}
              placeholder="6 chữ số"
              aria-invalid={Boolean(errors.otp)}
              maxLength={6}
            />
            {errors.otp && <small className="field-error">{errors.otp}</small>}
          </label>

          <button
            type="button"
            className="text-button text-button-right forgot-otp-button"
            onClick={onSendOtp}
            disabled={!canSendOtp || sendingOtp || resettingPassword}
          >
            {sendingOtp ? <ButtonSpinner label="Đang gửi..." /> : 'Gửi OTP'}
          </button>
        </div>

        <label className="field">
          <span>Mật khẩu mới</span>
          <div className="password-row">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.newPassword}
              onChange={(event) => onChange('newPassword', event.target.value)}
              placeholder="Ít nhất 8 ký tự, có 1 chữ hoa và 1 chữ số"
              aria-invalid={Boolean(errors.newPassword)}
            />
            <button
              type="button"
              className="password-toggle"
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
            >
              {showPassword ? <EyeOffIcon className="eye-icon" /> : <EyeIcon className="eye-icon" />}
            </button>
          </div>
          {errors.newPassword && <small className="field-error">{errors.newPassword}</small>}
        </label>

        <label className="field">
          <span>Nhập lại mật khẩu mới</span>
          <div className="password-row">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={(event) => onChange('confirmPassword', event.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              aria-invalid={Boolean(errors.confirmPassword)}
            />
            <button
              type="button"
              className="password-toggle"
              aria-pressed={showConfirmPassword}
              onClick={() => setShowConfirmPassword((value) => !value)}
              aria-label={showConfirmPassword ? 'Ẩn xác nhận mật khẩu mới' : 'Hiện xác nhận mật khẩu mới'}
            >
              {showConfirmPassword ? <EyeOffIcon className="eye-icon" /> : <EyeIcon className="eye-icon" />}
            </button>
          </div>
          {errors.confirmPassword && <small className="field-error">{errors.confirmPassword}</small>}
        </label>

        <button className="primary-button" type="submit" disabled={sendingOtp || resettingPassword}>
          {resettingPassword ? <ButtonSpinner label="Đang đặt lại mật khẩu..." /> : 'Đặt lại mật khẩu'}
        </button>

        <p className="auth-switch">
          <span>Nhớ lại mật khẩu rồi? </span>
          <button className="text-link-button" type="button" onClick={onGoLogin}>
            Quay lại đăng nhập
          </button>
        </p>
      </form>
    </>
  )
}
