import { useState } from 'react';

import { changePassword } from '../api/auth.js';
import { ApiError } from '../api/client.js';
import { AppShell } from '../components/AppShell.jsx';
import { Button } from '../components/Button.jsx';
import { Field } from '../components/Field.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const EMPTY_PASSWORD_FORM = { current_password: '', new_password: '' };

export function ProfilePage() {
  const { user, updateProfile } = useAuth();

  const [profileForm, setProfileForm] = useState({ name: user.name, phone: user.phone });
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [profileFieldErrors, setProfileFieldErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  function extractErrors(err, setBanner, setFields) {
    if (err instanceof ApiError) {
      setBanner(err.message);
      if (err.details) {
        setFields(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
      }
    } else {
      setBanner('Algo deu errado. Tente novamente.');
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setProfileMsg(null);
    setProfileError(null);
    setProfileFieldErrors({});
    setSavingProfile(true);
    try {
      await updateProfile(profileForm);
      setProfileMsg('Dados atualizados.');
    } catch (err) {
      extractErrors(err, setProfileError, setProfileFieldErrors);
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setPasswordMsg(null);
    setPasswordError(null);
    setPasswordFieldErrors({});
    setSavingPassword(true);
    try {
      await changePassword(passwordForm);
      setPasswordMsg('Senha alterada.');
      setPasswordForm(EMPTY_PASSWORD_FORM);
    } catch (err) {
      extractErrors(err, setPasswordError, setPasswordFieldErrors);
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <AppShell>
      <h1>Perfil</h1>
      <p className="muted">{user.email}</p>

      <section className="section">
        <h2 className="section__title">Seus dados</h2>
        <form className="form profile-form" onSubmit={saveProfile}>
          {profileMsg && (
            <div className="banner" data-testid="profile-saved">
              {profileMsg}
            </div>
          )}
          {profileError && <div className="form-error">{profileError}</div>}
          <Field
            label="Nome"
            name="name"
            autoComplete="name"
            data-testid="profile-name"
            value={profileForm.name}
            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            error={profileFieldErrors.name}
          />
          <Field
            label="WhatsApp"
            name="phone"
            type="tel"
            autoComplete="tel"
            data-testid="profile-phone"
            value={profileForm.phone}
            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
            error={profileFieldErrors.phone}
          />
          <div>
            <Button type="submit" disabled={savingProfile} data-testid="profile-save">
              {savingProfile ? 'Salvando…' : 'Salvar dados'}
            </Button>
          </div>
        </form>
      </section>

      <section className="section">
        <h2 className="section__title">Alterar senha</h2>
        <form className="form profile-form" onSubmit={savePassword}>
          {passwordMsg && (
            <div className="banner" data-testid="password-saved">
              {passwordMsg}
            </div>
          )}
          {passwordError && (
            <div className="form-error" data-testid="password-error">
              {passwordError}
            </div>
          )}
          <Field
            label="Senha atual"
            name="current_password"
            type="password"
            autoComplete="current-password"
            data-testid="pw-current"
            value={passwordForm.current_password}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, current_password: e.target.value })
            }
            error={passwordFieldErrors.current_password}
          />
          <Field
            label="Nova senha"
            name="new_password"
            type="password"
            autoComplete="new-password"
            data-testid="pw-new"
            value={passwordForm.new_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
            error={passwordFieldErrors.new_password}
          />
          <div>
            <Button type="submit" disabled={savingPassword} data-testid="pw-save">
              {savingPassword ? 'Alterando…' : 'Alterar senha'}
            </Button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
