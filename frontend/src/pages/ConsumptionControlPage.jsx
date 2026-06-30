import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Target,
  TimerReset,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  FutureFeatureCard,
  Input,
  LineChartMock,
  PlatformUsageCard,
  ReviewStatCard,
  Select,
  StatCard,
} from "../components";
import { futureFeatures } from "../data/mockData";
import { useConsumption } from "../hooks/useConsumption";
import {
  createLog as createConsumptionLog,
  updateLimits as updateConsumptionLimits,
} from "../services/consumptionService";

const defaultConsumptionLogForm = {
  minutesConsumed: 15,
  platformSlug: "youtube-shorts",
  videosWatched: 5,
};

export function ConsumptionControlPage() {
  const navigate = useNavigate();
  const {
    error: loadError,
    limits,
    platforms,
    refreshConsumption,
    summary,
    timeline,
    weekly,
  } = useConsumption();
  const [limitForm, setLimitForm] = useState({
    maxMinutesPerDay: 120,
    maxVideosPerDay: 40,
    strictLockMode: true,
    warningThreshold: 80,
  });
  const [logForm, setLogForm] = useState(() => ({
    ...defaultConsumptionLogForm,
  }));
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [limitTouched, setLimitTouched] = useState(false);
  const timelineValues = timeline.length
    ? timeline.map((item) => item.totalVideos)
    : [0, 0, 0, 0, 0, 0, 0];
  const activeLimitForm = limitTouched
    ? limitForm
    : {
        maxMinutesPerDay:
          limits?.global?.maxMinutesPerDay || limitForm.maxMinutesPerDay,
        maxVideosPerDay:
          limits?.global?.maxVideosPerDay || limitForm.maxVideosPerDay,
        strictLockMode:
          limits?.global?.strictLockMode ?? limitForm.strictLockMode,
        warningThreshold:
          limits?.global?.warningThreshold || limitForm.warningThreshold,
      };
  const activePlatformSlug = logForm.platformSlug || platforms[0]?.slug || "";

  const updateLimit = (key, value) => {
    setLimitTouched(true);
    setLimitForm((current) => ({ ...current, [key]: value }));
  };

  const updateLogField = (key, value) => {
    setLogForm((current) => ({ ...current, [key]: value }));
  };

  async function handleLimitSave() {
    try {
      setIsSaving(true);
      setMessage("");
      await updateConsumptionLimits({
        global: {
          maxMinutesPerDay: Number(activeLimitForm.maxMinutesPerDay),
          maxVideosPerDay: Number(activeLimitForm.maxVideosPerDay),
          strictLockMode: activeLimitForm.strictLockMode,
          warningThreshold: Number(activeLimitForm.warningThreshold),
        },
      });
      await refreshConsumption();
      setLimitTouched(false);
      setMessage("Consumption limits updated.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogSubmit(event) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setMessage("");
      await createConsumptionLog({
        minutesConsumed: Number(logForm.minutesConsumed),
        platformSlug: activePlatformSlug,
        videosWatched: Number(logForm.videosWatched),
      });
      setLogForm((current) => ({
        ...defaultConsumptionLogForm,
        platformSlug: current.platformSlug,
      }));
      await refreshConsumption();
      setMessage("Consumption log added.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      {loadError && <p className="form-message form-error">{loadError}</p>}
      {message && (
        <p
          className={`form-message ${message.includes("updated") || message.includes("added") ? "form-success" : "form-error"}`}
        >
          {message}
        </p>
      )}
      <section className="consumption-hero">
        <div>
          <p className="eyebrow">Consumption Control</p>
          <h2>Consumption Control</h2>
          <p>
            Track, understand, and limit short-form content before it controls
            your attention.
          </p>
        </div>
        <Card className="daily-score-card">
          <p className="eyebrow">Daily Consumption Score</p>
          <strong>{summary?.dailyConsumptionScore ?? 100} / 100</strong>
          <Badge
            label={summary?.statusText || "Healthy Consumption"}
            tone={
              summary?.limitReached
                ? "danger"
                : summary?.warningReached
                  ? "muted"
                  : "default"
            }
          />
        </Card>
      </section>

      <div className="stats-grid">
        <StatCard
          label="Today's Reels"
          value={summary?.todaysReels || 0}
          icon={Smartphone}
        />
        <StatCard
          label="Today's Shorts"
          value={summary?.todaysShorts || 0}
          icon={TimerReset}
        />
        <StatCard
          label="Time Consumed"
          value={summary?.timeConsumed || "0m"}
          icon={Clock}
        />
        <StatCard
          label="Daily Limit Remaining"
          value={summary?.dailyLimitRemaining || "0 Videos"}
          icon={ShieldCheck}
        />
      </div>

      <section className="panel-section">
        <div className="card-head">
          <div>
            <p className="eyebrow">Short-form sources</p>
            <h3>Platform Usage</h3>
          </div>
        </div>
        <div className="platform-grid">
          {platforms.map((platform) => (
            <PlatformUsageCard key={platform.id} platform={platform} />
          ))}
          {platforms.length === 0 && (
            <p className="muted-text">No consumption platforms configured.</p>
          )}
        </div>
      </section>

      <div className="content-grid split">
        <Card title="Consumption Timeline" label="Last 7 days">
          <LineChartMock values={timelineValues} />
          <div className="chart-labels">
            {timeline.map((item) => (
              <span key={item.day}>{item.day.slice(0, 3)}</span>
            ))}
          </div>
        </Card>
        <Card title="Daily Limit Manager" label="Backend limits">
          <div className="form-grid">
            <Input
              label="Maximum videos per day"
              type="number"
              value={activeLimitForm.maxVideosPerDay}
              onChange={(event) =>
                updateLimit("maxVideosPerDay", event.target.value)
              }
            />
            <Input
              label="Maximum total watch time"
              type="number"
              value={activeLimitForm.maxMinutesPerDay}
              onChange={(event) =>
                updateLimit("maxMinutesPerDay", event.target.value)
              }
            />
          </div>
          <label className="compact-row strict-toggle">
            <span>Strict Lock Mode</span>
            <input
              type="checkbox"
              checked={activeLimitForm.strictLockMode}
              onChange={(event) =>
                updateLimit("strictLockMode", event.target.checked)
              }
            />
          </label>
          {activeLimitForm.strictLockMode && (
            <p className="muted-text">
              When your limit is reached, Dopamine Lock blocks further access
              until tomorrow.
            </p>
          )}
          <Button onClick={handleLimitSave} disabled={isSaving}>
            Save Limits
          </Button>
        </Card>
      </div>

      <div className="content-grid split">
        <Card title="Warning Threshold" label="Limit alerts">
          <Select
            label="Choose threshold"
            value={activeLimitForm.warningThreshold}
            onChange={(event) =>
              updateLimit("warningThreshold", event.target.value)
            }
          >
            <option value="50">50%</option>
            <option value="75">75%</option>
            <option value="90">90%</option>
            <option value="100">100%</option>
          </Select>
          <p className="warning-preview">
            You have consumed {activeLimitForm.warningThreshold}% of today's
            reel limit.
          </p>
        </Card>
        <Card title="Weekly Analytics" label="Consumption reduction">
          <div className="review-grid compact-review">
            <ReviewStatCard
              label="Average Daily Consumption"
              value={weekly?.averageDailyConsumption || "0 videos"}
            />
            <ReviewStatCard
              label="Videos Avoided"
              value={weekly?.videosAvoided || 0}
            />
            <ReviewStatCard
              label="Estimated Time Saved"
              value={weekly?.estimatedTimeSaved || "0m"}
            />
            <ReviewStatCard
              label="Focus Hours Gained"
              value={weekly?.focusHoursGained || "0.0h"}
            />
          </div>
        </Card>
      </div>

      <Card title="Add Consumption Log" label="Manual entry">
        <form className="form-grid" onSubmit={handleLogSubmit}>
          <Select
            label="Platform"
            value={activePlatformSlug}
            onChange={(event) =>
              updateLogField("platformSlug", event.target.value)
            }
          >
            {platforms.map((platform) => (
              <option key={platform.slug} value={platform.slug}>
                {platform.platformName}
              </option>
            ))}
          </Select>
          <Input
            label="Videos Watched"
            type="number"
            min="0"
            value={logForm.videosWatched}
            onChange={(event) =>
              updateLogField("videosWatched", event.target.value)
            }
          />
          <Input
            label="Minutes Consumed"
            type="number"
            min="0"
            value={logForm.minutesConsumed}
            onChange={(event) =>
              updateLogField("minutesConsumed", event.target.value)
            }
          />
          <Button disabled={isSaving} type="submit">
            Add Log
          </Button>
        </form>
      </Card>

      <Card
        title="Dopamine Awareness"
        label="Educational brief"
        className="awareness-card"
      >
        <p>
          Short-form content trains the brain to seek constant novelty. Reducing
          excessive consumption improves focus, memory, discipline, and deep
          work by lowering the demand for rapid reward switching.
        </p>
      </Card>

      <Card
        title="Healthy Habits Suggestions"
        label="Instead of watching reels"
      >
        <div className="habit-grid">
          {[
            { label: "Read 10 pages", icon: BookOpen },
            { label: "Take a short walk", icon: Activity },
            { label: "Complete a Focus Mission", icon: Target },
            { label: "Review notes", icon: CheckCircle2 },
            { label: "Continue coding", icon: Code2 },
          ].map(({ label, icon: Icon }) => (
            <article className="habit-card" key={label}>
              <Icon size={20} />
              <h4>{label}</h4>
            </article>
          ))}
        </div>
      </Card>

      <Card title="Quick Actions" label="Control commands">
        <div className="quick-action-grid">
          <Button onClick={() => navigate("/mission-center")}>
            Start Focus Mission
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate("/block-manager")}
          >
            Manage Website Blocking
          </Button>
          <Button variant="secondary" onClick={() => navigate("/analytics")}>
            View Analytics
          </Button>
          <Button variant="danger">
            <RefreshCcw size={15} />
            Reset Daily Limits
          </Button>
        </div>
      </Card>

      <Card title="Future Modules" label="Coming Soon">
        <div className="future-grid">
          {futureFeatures.map((feature) => (
            <FutureFeatureCard key={feature} title={feature} />
          ))}
        </div>
      </Card>
    </>
  );
}
