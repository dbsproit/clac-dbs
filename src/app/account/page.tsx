"use client";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import PageHeader from "@/components/PageHeader";
import { Card, Field, TextInput, Button } from "@/components/ui/primitives";

export default function AccountPage() {
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [profileCurrentPassword, setProfileCurrentPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordErr, setPasswordErr] = useState("");

  useEffect(() => {
    fetch("/api/account")
      .then((res) => res.json())
      .then((data) => {
        setName(data.name || "");
        setEmail(data.email || "");
        setOriginalEmail(data.email || "");
      })
      .finally(() => setLoaded(true));
  }, []);

  const emailChanged = email !== originalEmail;

  async function handleSaveProfile() {
    setSavingProfile(true);
    setProfileMsg("");
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          currentPassword: emailChanged ? profileCurrentPassword : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save.");
      setOriginalEmail(data.email);
      setProfileCurrentPassword("");
      setProfileMsg("Saved.");
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    setPasswordErr("");
    if (!currentPassword || !newPassword) {
      setPasswordErr("Fill in your current and new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErr("New password and confirmation don't match.");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update password.");
      // Sign out so the next login uses the new password — the current JWT
      // session doesn't otherwise pick up the change mid-session.
      await signOut({ callbackUrl: "/login" });
    } catch (err) {
      setPasswordErr(err instanceof Error ? err.message : "Could not update password.");
      setSavingPassword(false);
    }
  }

  if (!loaded) return <PageHeader title="My Account" />;

  return (
    <>
      <PageHeader title="My Account" subtitle="Your personal profile and login" />
      <div className="grid gap-6 p-4 sm:p-8 lg:grid-cols-2">
        <Card title="Profile">
          <div className="grid gap-4">
            <Field label="Name">
              <TextInput value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Email">
              <TextInput value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            {emailChanged && (
              <Field label="Current password" hint="Required to change your email">
                <TextInput
                  type="password"
                  value={profileCurrentPassword}
                  onChange={(e) => setProfileCurrentPassword(e.target.value)}
                />
              </Field>
            )}
            <div className="flex items-center gap-3">
              <Button onClick={handleSaveProfile}>{savingProfile ? "Saving…" : "Save profile"}</Button>
              {profileMsg && <span className="text-sm text-slate-500">{profileMsg}</span>}
            </div>
          </div>
        </Card>

        <Card title="Change password">
          <div className="grid gap-4">
            <Field label="Current password">
              <TextInput
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </Field>
            <Field label="New password">
              <TextInput
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Field>
            <Field label="Confirm new password">
              <TextInput
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Field>
            {passwordErr && <p className="text-sm text-red-600">{passwordErr}</p>}
            <Button onClick={handleChangePassword}>
              {savingPassword ? "Updating…" : "Update password"}
            </Button>
            <p className="text-xs text-slate-400">
              You'll be signed out after updating your password — log back in with the new one.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
