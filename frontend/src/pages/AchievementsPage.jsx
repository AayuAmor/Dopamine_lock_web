import { useState } from "react";
import { RefreshCcw } from "lucide-react";
import { AchievementBadge, Button, Card, Input, PageHeader, ReviewStatCard, Select } from "../components";
import { useAchievements } from "../hooks/useAchievements";
import { recalculate as recalculateAchievements } from "../services/achievementService";

export function AchievementsPage() {
  const {
    achievements: userAchievements,
    summary,
    isLoading,
    error,
    refreshAchievements,
  } = useAchievements();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [rarityFilter, setRarityFilter] = useState("");
  const [recalcMsg, setRecalcMsg] = useState("");

  const achievementCategories = [
    "MISSION",
    "STREAK",
    "FOCUS",
    "DISCIPLINE",
    "GOALS",
    "DIGITAL_WELLNESS",
    "SPECIAL",
  ];
  const achievementRarities = [
    "COMMON",
    "UNCOMMON",
    "RARE",
    "EPIC",
    "LEGENDARY",
  ];

  const filtered = userAchievements.filter((achievement) => {
    const matchesQuery =
      !query ||
      achievement.title.toLowerCase().includes(query.toLowerCase()) ||
      (achievement.description || "")
        .toLowerCase()
        .includes(query.toLowerCase());
    const matchesCategory =
      !categoryFilter || achievement.category === categoryFilter;
    const matchesRarity = !rarityFilter || achievement.rarity === rarityFilter;
    return matchesQuery && matchesCategory && matchesRarity;
  });

  const group = (state) =>
    filtered.filter((achievement) => achievement.state === state);

  const handleRecalculate = async () => {
    setRecalcMsg("");
    try {
      const result = await recalculateAchievements();
      setRecalcMsg(
        `Recalculated — ${result.newlyUnlocked || 0} newly unlocked.`,
      );
      await refreshAchievements();
    } catch (err) {
      setRecalcMsg(err.message || "Recalculation failed");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Achievements"
        title="Badge Vault"
        description="Unlocked badges, locked badges, and progress badges."
        action={
          <Button variant="secondary" onClick={handleRecalculate}>
            <RefreshCcw size={15} />
            Recalculate
          </Button>
        }
      />

      <div className="review-grid compact-review">
        <ReviewStatCard label="Unlocked" value={summary?.unlocked || 0} />
        <ReviewStatCard label="Total" value={summary?.totalAchievements || 0} />
        <ReviewStatCard
          label="Completion"
          value={`${summary?.completionPercentage || 0}%`}
        />
        <ReviewStatCard
          label="XP from Achievements"
          value={`+${summary?.xpFromAchievements || 0}`}
        />
      </div>

      <Card title="Filter Achievements" label="Search and filter">
        <div className="form-grid">
          <Input
            label="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search achievements..."
          />
          <Select
            label="Category"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="">All Categories</option>
            {achievementCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace("_", " ")}
              </option>
            ))}
          </Select>
          <Select
            label="Rarity"
            value={rarityFilter}
            onChange={(event) => setRarityFilter(event.target.value)}
          >
            <option value="">All Rarities</option>
            {achievementRarities.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>
        {recalcMsg && <p className="success-text">{recalcMsg}</p>}
        {error && <p className="error-text">{error}</p>}
      </Card>

      {isLoading && <p className="muted-text">Loading achievements...</p>}

      {["Unlocked", "Progress", "Locked"].map((state) => (
        <Card
          key={state}
          title={`${state} Badges`}
          label={`${group(state).length} achievements`}
        >
          <div className="achievement-grid">
            {group(state).map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
              />
            ))}
            {group(state).length === 0 && (
              <p className="muted-text">
                No {state.toLowerCase()} achievements match your filter.
              </p>
            )}
          </div>
        </Card>
      ))}
    </>
  );
}
