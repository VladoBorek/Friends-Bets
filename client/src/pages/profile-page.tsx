import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { userMutationResponseSchema } from "@pb138/shared/schemas/user";
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

async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  const rawBody = (await response.text().catch(() => "")).trim();
  if (!rawBody) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(rawBody) as { message?: string };
    if (typeof parsed.message === "string" && parsed.message.trim().length > 0) {
      return parsed.message;
    }
  } catch {
    return rawBody;
  }

  return rawBody;
}

type SettingsSection = "nickname" | "email" | "password" | null;

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
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
    return <p className="text-slate-300">Loading profile...</p>;
  }

  const canSaveNickname = nickname.trim().length >= 3 && nickname !== user.username && !isNicknameSaving;
  const canSaveEmail =
    newEmail.trim().length > 0 && currentPassword.length > 0 && newEmail !== user.email && !isEmailSaving;

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, "Unable to update nickname"));
      }

      const json = userMutationResponseSchema.parse(await response.json());
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newEmail: newEmail.trim(), currentPassword }),
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, "Unable to update email"));
      }

      const json = userMutationResponseSchema.parse(await response.json());
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, "Unable to update password"));
      }

      userMutationResponseSchema.parse(await response.json());
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

  const canSavePassword =
    oldPassword.length > 0 &&
    newPassword.length >= 4 &&
    newPasswordRepeat === newPassword &&
    newPassword !== oldPassword &&
    !isPasswordSaving;

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

        <ProfileSettingsRow label="Appearance" className="pb-0">
          <ThemeModeToggle />
        </ProfileSettingsRow>
      </Card>
    </div>
  );
}
