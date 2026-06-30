import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Badge, Button, Card, Input, PageHeader, Select } from "../components";
import { useBlockManager } from "../hooks/useBlockManager";
import {
  createRule,
  deleteRule as deleteBlockRule,
  disablePreset,
  enablePreset,
  toggleRule as toggleBlockRule,
} from "../services/blockManagerService";

const blockCategories = [
  "SOCIAL_MEDIA",
  "ENTERTAINMENT",
  "GAMING",
  "SHOPPING",
  "NEWS",
  "ADULT",
  "CUSTOM",
  "PRODUCTIVITY",
  "EDUCATION",
];
const blockCategoryLabels = {
  ADULT: "Adult",
  CUSTOM: "Custom",
  EDUCATION: "Education",
  ENTERTAINMENT: "Entertainment",
  GAMING: "Gaming",
  NEWS: "News",
  PRODUCTIVITY: "Productivity",
  SHOPPING: "Shopping",
  SOCIAL_MEDIA: "Social Media",
};
const defaultBlockRuleForm = {
  category: "CUSTOM",
  domain: "",
  reason: "",
  type: "BLOCKED",
};

export function BlockManagerPage() {
  const {
    error: loadError,
    isLoading,
    presets,
    refreshBlockManager,
    rules,
  } = useBlockManager();
  const [form, setForm] = useState(() => ({ ...defaultBlockRuleForm }));
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const activePresets = presets.filter((preset) => preset.enabled);
  const filteredRules = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rules.filter((rule) => {
      const matchesSearch =
        !normalizedQuery ||
        rule.domain.includes(normalizedQuery) ||
        blockCategoryLabels[rule.category]
          .toLowerCase()
          .includes(normalizedQuery) ||
        (rule.reason || "").toLowerCase().includes(normalizedQuery);
      const matchesCategory =
        categoryFilter === "All" || rule.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [categoryFilter, query, rules]);
  const blocked = filteredRules.filter((rule) => rule.type === "BLOCKED");
  const allowed = filteredRules.filter((rule) => rule.type === "ALLOWED");

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleAddRule = async () => {
    try {
      setError("");
      await createRule(form);
      await refreshBlockManager();
      setForm({ ...defaultBlockRuleForm });
      setSuccess("Block rule added");
    } catch (ruleError) {
      setError(ruleError.message);
      setSuccess("");
    }
  };

  const handleRuleAction = async (action, successMessage) => {
    try {
      setError("");
      await action();
      await refreshBlockManager();
      setSuccess(successMessage);
    } catch (actionError) {
      setError(actionError.message);
      setSuccess("");
    }
  };

  const handlePresetAction = async (preset) => {
    await handleRuleAction(
      () =>
        preset.enabled ? disablePreset(preset.id) : enablePreset(preset.id),
      preset.enabled ? "Preset disabled" : "Preset enabled",
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Block Manager"
        title="Control Digital Access"
        description="Manage the websites and categories allowed during discipline windows."
      />
      {(error || loadError || success) && (
        <p className={error || loadError ? "form-error" : "form-success"}>
          {error || loadError || success}
        </p>
      )}
      <div className="toolbar">
        <Input
          label="Search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search domains or categories"
        />
        <Select
          label="Category filter"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option>All</option>
          {blockCategories.map((category) => (
            <option key={category} value={category}>
              {blockCategoryLabels[category]}
            </option>
          ))}
        </Select>
      </div>
      <Card title="Add Website Rule" label="Custom access">
        <div className="form-grid">
          <Input
            label="Domain"
            value={form.domain}
            onChange={(event) => updateField("domain", event.target.value)}
            placeholder="youtube.com"
          />
          <Select
            label="Type"
            value={form.type}
            onChange={(event) => updateField("type", event.target.value)}
          >
            <option value="BLOCKED">Blocked</option>
            <option value="ALLOWED">Allowed</option>
          </Select>
          <Select
            label="Category"
            value={form.category}
            onChange={(event) => updateField("category", event.target.value)}
          >
            {blockCategories.map((category) => (
              <option key={category} value={category}>
                {blockCategoryLabels[category]}
              </option>
            ))}
          </Select>
          <Input
            label="Reason"
            value={form.reason}
            onChange={(event) => updateField("reason", event.target.value)}
            placeholder="Optional reason"
          />
        </div>
        <Button onClick={handleAddRule}>
          <Plus size={15} />
          Add Custom
        </Button>
      </Card>
      <div className="content-grid split">
        <Card
          title="Blocked Websites List"
          label={isLoading ? "Loading" : `${blocked.length} denied`}
        >
          <WebsiteList
            danger
            items={blocked}
            onDelete={(rule) =>
              handleRuleAction(() => deleteBlockRule(rule.id), "Rule deleted")
            }
            onToggle={(rule) =>
              handleRuleAction(() => toggleBlockRule(rule.id), "Rule updated")
            }
          />
        </Card>
        <Card
          title="Allowed Websites List"
          label={isLoading ? "Loading" : `${allowed.length} permitted`}
        >
          <WebsiteList
            items={allowed}
            onDelete={(rule) =>
              handleRuleAction(() => deleteBlockRule(rule.id), "Rule deleted")
            }
            onToggle={(rule) =>
              handleRuleAction(() => toggleBlockRule(rule.id), "Rule updated")
            }
          />
        </Card>
      </div>
      <Card title="Active Presets" label={`${activePresets.length} enabled`}>
        <div className="list-stack">
          {presets.map((preset) => (
            <div className="compact-row" key={preset.id}>
              <div>
                <strong>{preset.name}</strong>
                <span>{preset.description}</span>
              </div>
              <div className="splash-actions">
                <Badge label={blockCategoryLabels[preset.category]} />
                <Badge label={`${preset.websites.length} sites`} />
                <Button
                  variant={preset.enabled ? "danger" : "secondary"}
                  onClick={() => handlePresetAction(preset)}
                >
                  {preset.enabled ? "Disable" : "Enable"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Presets" label="Category badges">
        <div className="badge-row">
          {blockCategories.map((category) => (
            <Badge key={category} label={blockCategoryLabels[category]} />
          ))}
        </div>
      </Card>
    </>
  );
}

function WebsiteList({ items, danger, onDelete, onToggle }) {
  return (
    <div className="list-stack">
      {items.map((item) => (
        <div className="compact-row" key={item.id}>
          <div>
            <strong>{item.domain}</strong>
            <span>{item.reason || blockCategoryLabels[item.category]}</span>
          </div>
          <div className="splash-actions">
            <Badge
              label={blockCategoryLabels[item.category]}
              tone={danger ? "danger" : "default"}
            />
            <Badge
              label={item.active ? "Active" : "Inactive"}
              tone={item.active ? "default" : "muted"}
            />
            <Button variant="secondary" onClick={() => onToggle(item)}>
              {item.active ? "Disable" : "Enable"}
            </Button>
            <Button variant="danger" onClick={() => onDelete(item)}>
              Delete
            </Button>
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <p className="muted-text">No websites match this view.</p>
      )}
    </div>
  );
}
