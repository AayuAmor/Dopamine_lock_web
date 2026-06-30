import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card, Input, UserAvatar } from "../components";
import { useAuth } from "../context/useAuth";
import { useAchievements } from "../hooks/useAchievements";
import { useIdentity } from "../hooks/useIdentity";
import { useMissionSession } from "../hooks/useMissionSession";
import { useMissions } from "../hooks/useMissions";
import { useSessionHistory } from "../hooks/useSessionHistory";
import { useStreak } from "../hooks/useStreak";
import { ProfileDetail } from "./shared/ProfileDetail";
import { formatDuration, formatMemberSince } from "./utils/formatters";

const bioLimit = 500;
const avatarMaxSize = 2 * 1024 * 1024;
const avatarTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function profileFormFromUser(user) {
  return {
    fullName: user?.fullName || "",
    bio: user?.bio || "",
    timezone: user?.timezone || "Asia/Kathmandu",
    dailyFocusGoal: user?.dailyFocusGoal || 4,
    preferredMissionDuration: user?.preferredMissionDuration || 50,
  };
}

export function ProfilePage() {
  const { refreshProfile, updateProfile, uploadAvatar, user } = useAuth();
  const { missions: userMissions } = useMissions();
  const { session: currentSession } = useMissionSession();
  const { summary: sessionSummary } = useSessionHistory({ limit: 1, page: 1 });
  const [profileCalendarDate] = useState(() => {
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  });
  const { summary: profileStreakSummary } = useStreak(
    profileCalendarDate.month,
    profileCalendarDate.year,
  );
  const {
    summary: profileAchievementSummary,
    achievements: profileAchievements,
  } = useAchievements();
  const { summary: profileIdentitySummary } = useIdentity();
  const latestAchievement = profileAchievements
    .filter((a) => a.completed && a.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))[0];
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(() => profileFormFromUser(null));
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  useEffect(() => {
    refreshProfile().catch(() => setError("Unable to load profile"));
  }, [refreshProfile]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const beginEdit = () => {
    setForm(profileFormFromUser(user));
    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  const validateProfile = () => {
    if (!form.fullName.trim()) {
      return "Name is required";
    }

    if (form.bio.length > bioLimit) {
      return `Bio must be ${bioLimit} characters or fewer`;
    }

    if (Number(form.dailyFocusGoal) <= 0) {
      return "Daily Goal must be a positive number";
    }

    if (Number(form.preferredMissionDuration) <= 0) {
      return "Preferred Mission Duration must be a positive number";
    }

    return "";
  };

  const handleSave = async () => {
    const validationError = validateProfile();

    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      const profile = await updateProfile({
        fullName: form.fullName,
        bio: form.bio,
        timezone: form.timezone,
        dailyFocusGoal: Number(form.dailyFocusGoal),
        preferredMissionDuration: Number(form.preferredMissionDuration),
      });
      setSuccess("Profile updated");
      setIsEditing(false);
      setForm(profileFormFromUser(profile));
    } catch (saveError) {
      setError(saveError.message);
      setSuccess("");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError("");
    setSuccess("");
    setForm(profileFormFromUser(user));
  };

  const validateAvatarFile = (file) => {
    if (!file) {
      return "Choose an image to upload";
    }

    if (!avatarTypes.has(file.type)) {
      return "Only JPG, JPEG, PNG, and WEBP images are allowed";
    }

    if (file.size > avatarMaxSize) {
      return "Avatar image must be 2MB or smaller";
    }

    return "";
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    const validationError = validateAvatarFile(file);

    if (validationError) {
      setAvatarFile(null);
      setError(validationError);
      setSuccess("");
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview("");
      }
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(previewUrl);
    setError("");
    setSuccess("");
  };

  const handleAvatarSave = async () => {
    const validationError = validateAvatarFile(avatarFile);

    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      setError("");
      await uploadAvatar(avatarFile);
      await refreshProfile();
      setSuccess("Profile photo updated");
      setAvatarFile(null);
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview("");
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (uploadError) {
      setError(uploadError.message);
      setSuccess("");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <>
      <section className="profile-hero">
        <UserAvatar user={user} size="lg" />
        <div>
          <p className="eyebrow">User Profile</p>
          <h2>{user?.fullName || "Operator"}</h2>
          <p>{profileIdentitySummary?.currentTitle || "Discipline Beginner"}</p>
          <span>{formatMemberSince(user?.createdAt)}</span>
        </div>
        <Badge label="Current Status: Active" />
      </section>

      {(error || success) && (
        <p className={error ? "form-error" : "form-success"}>
          {error || success}
        </p>
      )}

      <div className="content-grid split">
        <Card
          title="Profile Information"
          label="Authenticated data"
          action={
            !isEditing && (
              <Button variant="secondary" onClick={beginEdit}>
                Edit Profile
              </Button>
            )
          }
        >
          {!isEditing ? (
            <div className="profile-details">
              <ProfileDetail label="Full Name" value={user?.fullName} />
              <ProfileDetail label="Email" value={user?.email} />
              <ProfileDetail
                label="Discipline Title"
                value={user?.disciplineTitle}
              />
              <ProfileDetail label="Bio" value={user?.bio || "No bio set"} />
              <ProfileDetail
                label="Total Missions Created"
                value={userMissions.length}
              />
              <ProfileDetail
                label="Total Sessions"
                value={sessionSummary?.totalSessions || 0}
              />
              <ProfileDetail
                label="Completed Sessions"
                value={sessionSummary?.completedSessions || 0}
              />
              <ProfileDetail
                label="Average Focus Time"
                value={formatDuration(
                  sessionSummary?.averageSessionDuration || 0,
                )}
              />
              <ProfileDetail
                label="Current Streak"
                value={`${profileStreakSummary?.currentStreak || 0} days`}
              />
              <ProfileDetail
                label="Current Active Mission"
                value={currentSession?.mission?.title || "No active mission"}
              />
              <ProfileDetail
                label="Current Session Duration"
                value={
                  currentSession
                    ? formatDuration(currentSession.elapsedSeconds)
                    : "0m"
                }
              />
              <ProfileDetail
                label="Daily Goal"
                value={`${user?.dailyFocusGoal || 4} hours`}
              />
              <ProfileDetail
                label="Preferred Mission Duration"
                value={`${user?.preferredMissionDuration || 50} minutes`}
              />
              <ProfileDetail label="Timezone" value={user?.timezone} />
              <ProfileDetail
                label="Achievements Unlocked"
                value={profileAchievementSummary?.unlocked || 0}
              />
              <ProfileDetail
                label="Achievement Completion"
                value={`${profileAchievementSummary?.completionPercentage || 0}%`}
              />
              <ProfileDetail
                label="Latest Achievement"
                value={latestAchievement?.title || "None yet"}
              />
              <ProfileDetail
                label="Legendary Achievements"
                value={profileAchievementSummary?.legendaryUnlocked || 0}
              />
              <ProfileDetail
                label="XP from Achievements"
                value={`+${profileAchievementSummary?.xpFromAchievements || 0}`}
              />
            </div>
          ) : (
            <div className="form-stack">
              <Input
                label="Name"
                value={form.fullName}
                onChange={(event) =>
                  updateField("fullName", event.target.value)
                }
              />
              <label className="field">
                <span>Bio</span>
                <textarea
                  value={form.bio}
                  maxLength={bioLimit}
                  onChange={(event) => updateField("bio", event.target.value)}
                />
              </label>
              <Input
                label="Timezone"
                value={form.timezone}
                onChange={(event) =>
                  updateField("timezone", event.target.value)
                }
              />
              <Input
                label="Daily Goal"
                type="number"
                min="1"
                value={form.dailyFocusGoal}
                onChange={(event) =>
                  updateField("dailyFocusGoal", event.target.value)
                }
              />
              <Input
                label="Preferred Mission Duration"
                type="number"
                min="1"
                value={form.preferredMissionDuration}
                onChange={(event) =>
                  updateField("preferredMissionDuration", event.target.value)
                }
              />
              <div className="splash-actions">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving" : "Save"}
                </Button>
                <Button variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
        <Card title="Profile Picture" label="Avatar">
          <div className="profile-avatar-card">
            <UserAvatar
              user={{ ...user, avatarUrl: avatarPreview || user?.avatarUrl }}
              size="lg"
            />
            <input
              ref={fileInputRef}
              className="avatar-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
            />
            <div className="avatar-actions">
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Photo
              </Button>
              <Button
                onClick={handleAvatarSave}
                disabled={!avatarFile || isUploadingAvatar}
              >
                {isUploadingAvatar ? "Saving Avatar" : "Save Avatar"}
              </Button>
            </div>
            {avatarFile && <p className="muted-text">{avatarFile.name}</p>}
          </div>
        </Card>
      </div>
    </>
  );
}
