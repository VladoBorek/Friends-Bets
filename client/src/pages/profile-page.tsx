import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { LogOut, User } from "lucide-react";
import { userMutationResponseSchema } from "@pb138/shared/schemas/user";
import { readJsonOrThrow } from "../api/http";
import { Button } from "../components/ui/button";
import { Spinner } from "../components/ui/spinner";
import { Card } from "../components/ui/card";
import { FormItem } from "../components/ui/form-item";
import { Input } from "../components/ui/input";
import { useAuth } from "../lib/auth-context";
import { ProfileFeedbackBanner } from "../features/profile/components/profile-feedback-banner";
import { ProfilePasswordInput } from "../features/profile/components/profile-password-input";
import { ProfileSettingsRow } from "../features/profile/components/profile-settings-row";
import { ProfileSubmitActions } from "../features/profile/components/profile-submit-actions";
import { ThemeModeToggle } from "../features/profile/components/theme-mode-toggle";

type FeedbackState = {
  type: "success" | "error";
  message: string;
};

type SettingsSection = "nickname" | "email" | "password" | null;

export function ProfilePage() {
  const router = useRouter();
  const { user, refreshUser, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>(null);
  const [nickname, setNickname] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordRepeat, setNewPasswordRepeat] = useState("");
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordRepeat, setShowNewPasswordRepeat] = useState(false);
  const [emailFieldsLocked, setEmailFieldsLocked] = useState(false);
  const [isNicknameSaving, setIsNicknameSaving] = useState(false);
  const [isEmailSaving, setIsEmailSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  useEffect(() => {
    setNickname(user?.username ?? "");
    setNewEmail("");
  }, [user?.email, user?.username]);

  if (!user) {
    return <div className="flex justify-center py-16"><Spinner className="h-8 w-8" /></div>;
  }

  const canSaveNickname = nickname.trim().length >= 3 && nickname !== user.username && !isNicknameSaving;
  const canSaveEmail =
    newEmail.trim().length > 0 && currentPassword.length > 0 && newEmail !== user.email && !isEmailSaving;
  const canSavePassword =
    oldPassword.length > 0 &&
    newPassword.length >= 4 &&
    newPasswordRepeat === newPassword &&
    newPassword !== oldPassword &&
    !isPasswordSaving;

  const handleLogout = async () => {
    await logout();
    await router.invalidate();
    await router.navigate({ to: "/auth/login" });
  };

  const startNicknameEdit = () => {
    setActiveSection("nickname");
    setNickname(user.username);
    setFeedback(null);
  };

  const cancelNicknameEdit = () => {
    setActiveSection(null);
    setNickname(user.username);
    setFeedback(null);
  };

  const startEmailEdit = () => {
    setActiveSection("email");
    setNewEmail("");
    setCurrentPassword("");
    setShowEmailPassword(false);
    setEmailFieldsLocked(true);
    setFeedback(null);
  };

  const cancelEmailEdit = () => {
    setActiveSection(null);
    setNewEmail("");
    setCurrentPassword("");
    setShowEmailPassword(false);
    setEmailFieldsLocked(false);
    setFeedback(null);
  };

  const startPasswordEdit = () => {
    setActiveSection("password");
    setOldPassword("");
    setNewPassword("");
    setNewPasswordRepeat("");
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowNewPasswordRepeat(false);
    setFeedback(null);
  };

  const cancelPasswordEdit = () => {
    setActiveSection(null);
    setOldPassword("");
    setNewPassword("");
    setNewPasswordRepeat("");
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowNewPasswordRepeat(false);
    setFeedback(null);
  };

  const handleNicknameSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setIsNicknameSaving(true);

    try {
      const response = await fetch("/api/users/nickname", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });

      const json = userMutationResponseSchema.parse(
        await readJsonOrThrow(response, "Unable to update nickname"),
      );

      setNickname(json.data.username);
      setFeedback({ type: "success", message: "Nickname updated successfully." });
      setActiveSection(null);
      await refreshUser();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to update nickname",
      });
    } finally {
      setIsNicknameSaving(false);
    }
  };

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setIsEmailSaving(true);

    try {
      const response = await fetch("/api/users/email", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: newEmail.trim(), currentPassword }),
      });

      const json = userMutationResponseSchema.parse(
        await readJsonOrThrow(response, "Unable to update email"),
      );

      setNewEmail(json.data.email);
      setCurrentPassword("");
      setShowEmailPassword(false);
      setEmailFieldsLocked(false);
      setFeedback({ type: "success", message: "Email updated successfully." });
      setActiveSection(null);
      await refreshUser();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to update email",
      });
    } finally {
      setIsEmailSaving(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setIsPasswordSaving(true);

    try {
      const response = await fetch("/api/users/password", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      userMutationResponseSchema.parse(
        await readJsonOrThrow(response, "Unable to update password"),
      );

      setOldPassword("");
      setNewPassword("");
      setNewPasswordRepeat("");
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowNewPasswordRepeat(false);
      setFeedback({ type: "success", message: "Password updated successfully." });
      setActiveSection(null);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to update password",
      });
    } finally {
      setIsPasswordSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/80">Settings</p>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold tracking-tight text-slate-100">
          <User className="h-6 w-6 text-cyan-400" /> User settings
        </h1>
      </header>

      <Card className="rounded-2xl border-cyan-500/20 bg-gradient-to-br from-slate-900/92 via-slate-900/88 to-cyan-950/20">
        <ProfileFeedbackBanner feedback={feedback} />

        <ProfileSettingsRow
          label="Nickname"
          value={user.username}
          onAction={activeSection === "nickname" ? undefined : startNicknameEdit}
          className={feedback ? "mt-4" : ""}
        >
          {activeSection === "nickname" ? (
            <form className="grid gap-4 md:max-w-xl" onSubmit={handleNicknameSubmit}>
              <FormItem label="Nickname" htmlFor="nickname">
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  minLength={3}
                  maxLength={50}
                  required
                />
              </FormItem>
              <ProfileSubmitActions isSaving={isNicknameSaving} canSubmit={canSaveNickname} onCancel={cancelNicknameEdit} />
            </form>
          ) : null}
        </ProfileSettingsRow>

        <ProfileSettingsRow label="Email" value={user.email} onAction={activeSection === "email" ? undefined : startEmailEdit}>
          {activeSection === "email" ? (
            <form className="grid gap-4 md:max-w-xl" onSubmit={handleEmailSubmit} autoComplete="off">
              <input type="text" autoComplete="username" tabIndex={-1} className="hidden" aria-hidden="true" />
              <input type="password" autoComplete="current-password" tabIndex={-1} className="hidden" aria-hidden="true" />
              <FormItem label="New e-mail" htmlFor="newEmail">
                <Input
                  id="newEmail"
                  name="profile-new-email"
                  type="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  onFocus={() => setEmailFieldsLocked(false)}
                  autoComplete="off"
                  readOnly={emailFieldsLocked}
                  required
                />
              </FormItem>
              <FormItem label="Password" htmlFor="currentPassword">
                <ProfilePasswordInput
                  id="currentPassword"
                  value={currentPassword}
                  isRevealed={showEmailPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  onFocus={() => setEmailFieldsLocked(false)}
                  onToggleReveal={() => setShowEmailPassword((current) => !current)}
                  autoComplete="off"
                  readOnly={emailFieldsLocked}
                  required
                />
              </FormItem>
              <ProfileSubmitActions isSaving={isEmailSaving} canSubmit={canSaveEmail} onCancel={cancelEmailEdit} />
            </form>
          ) : null}
        </ProfileSettingsRow>

        <ProfileSettingsRow label="Password" onAction={activeSection === "password" ? undefined : startPasswordEdit}>
          {activeSection === "password" ? (
            <form className="grid gap-4 md:max-w-xl" onSubmit={handlePasswordSubmit}>
              <FormItem label="Old password" htmlFor="oldPassword">
                <ProfilePasswordInput
                  id="oldPassword"
                  value={oldPassword}
                  isRevealed={showOldPassword}
                  onChange={(event) => setOldPassword(event.target.value)}
                  onToggleReveal={() => setShowOldPassword((current) => !current)}
                  autoComplete="current-password"
                  required
                />
              </FormItem>
              <FormItem label="New password" htmlFor="newPassword">
                <ProfilePasswordInput
                  id="newPassword"
                  value={newPassword}
                  isRevealed={showNewPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  onToggleReveal={() => setShowNewPassword((current) => !current)}
                  autoComplete="new-password"
                  minLength={4}
                  required
                />
              </FormItem>
              <FormItem label="Repeat new password" htmlFor="newPasswordRepeat">
                <ProfilePasswordInput
                  id="newPasswordRepeat"
                  value={newPasswordRepeat}
                  isRevealed={showNewPasswordRepeat}
                  onChange={(event) => setNewPasswordRepeat(event.target.value)}
                  onToggleReveal={() => setShowNewPasswordRepeat((current) => !current)}
                  autoComplete="new-password"
                  minLength={4}
                  required
                />
              </FormItem>
              <ProfileSubmitActions isSaving={isPasswordSaving} canSubmit={canSavePassword} onCancel={cancelPasswordEdit} />
            </form>
          ) : null}
        </ProfileSettingsRow>

        <ProfileSettingsRow label="Appearance">
          <div className="flex items-center justify-between gap-3 py-1">
            <p className="text-sm text-slate-400">Theme mode toggle</p>
            <ThemeModeToggle />
          </div>
        </ProfileSettingsRow>

        <div className="grid gap-4 py-5 pb-0">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-100">Session</p>
              <p className="text-sm text-slate-400">Sign out of this account</p>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="w-fit gap-2 border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:border-rose-400/60 hover:bg-rose-500/15 hover:text-rose-100"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}