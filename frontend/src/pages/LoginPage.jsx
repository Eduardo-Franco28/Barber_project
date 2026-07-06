import { useState } from 'react';
import { Navigate } from 'react-router-dom';

import { ApiError } from '../api/client.js';
import { Brand } from '../components/Brand.jsx';
import { Button } from '../components/Button.jsx';
import { Field } from '../components/Field.jsx';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const EMPTY_FORM = { name: '', email: '', phone: '', password: '' };

export function LoginPage() {
  const { user, loading, login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="boot">Bryan Barbearia</div>;
  if (user) return <Navigate to="/" replace />;

  const isRegister = mode === 'register';

  function switchMode(next) {
    setMode(next);
    setFormError(null);
    setFieldErrors({});
  }

  function setValue(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(form);
      } else {
        await login(form.email, form.password);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        if (err.details) {
          setFieldErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
        }
      } else {
        setFormError('Algo deu errado. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth__top">
        <ThemeToggle />
      </div>
      <div className="auth__box">
        <Brand />

        <div className="tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!isRegister}
            data-testid="tab-login"
            className={`tab${!isRegister ? ' tab--active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isRegister}
            data-testid="tab-register"
            className={`tab${isRegister ? ' tab--active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Criar conta
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit} noValidate>
          {formError && (
            <div className="form-error" data-testid="form-error" role="alert">
              {formError}
            </div>
          )}

          {isRegister && (
            <Field
              label="Nome"
              name="name"
              autoComplete="name"
              value={form.name}
              onChange={setValue('name')}
              error={fieldErrors.name}
            />
          )}

          <Field
            label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={setValue('email')}
            error={fieldErrors.email}
          />

          {isRegister && (
            <Field
              label="WhatsApp"
              name="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              autoComplete="tel"
              value={form.phone}
              onChange={setValue('phone')}
              error={fieldErrors.phone}
            />
          )}

          <Field
            label="Senha"
            name="password"
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={form.password}
            onChange={setValue('password')}
            error={fieldErrors.password}
          />

          <Button type="submit" block disabled={submitting}>
            {submitting ? 'Aguarde…' : isRegister ? 'Criar conta' : 'Entrar'}
          </Button>
        </form>

        <p className="auth__hint">Corte e barba com hora marcada.</p>
      </div>
    </div>
  );
}
