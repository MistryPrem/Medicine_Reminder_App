import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HeartPulse, Lock, Mail, User as UserIcon, ArrowRight } from 'lucide-react';
import { UserRole } from '../types/auth';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('caregiver');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setIsSubmitting(true);
      const user = await register({
        fullName,
        email,
        password,
        role,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      });

      if (user.role === 'elderly') {
        navigate('/elderly-portal');
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Registration failed. Please try again.';
      setError(errorMsg || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-icon-lg">
            <HeartPulse size={36} color="#38bdf8" />
          </div>
          <h1>Create Account</h1>
          <p>Join CareSync to monitor and support your loved ones</p>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="reg-fullname">Full Name</label>
            <div className="input-with-icon">
              <UserIcon size={18} className="input-icon" />
              <input
                id="reg-fullname"
                type="text"
                required
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="reg-email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password (min 8 chars, 1 uppercase, 1 number)</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="reg-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-role">I am registering as:</label>
            <select
              id="reg-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="caregiver">Caregiver / Family Member</option>
              <option value="elderly">Senior / Patient</option>
            </select>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-auth-submit">
            <span>{isSubmitting ? 'Creating Account...' : 'Register'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/login" className="auth-link">Sign In</Link>
        </div>
      </div>
    </div>
  );
};
