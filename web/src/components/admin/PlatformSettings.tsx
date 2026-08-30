import { useEffect, useState } from "react";
import { Card, CardTitle, CardDescription } from "../ui/Card";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";
import { Input, Label } from "../ui/Field";
import { Spinner } from "../ui/States";
import { callApi, ApiRequestError } from "../../lib/api";

interface Settings {
  training: { passScore: number };
  rewards: {
    baseRewardTokens: number;
    qualityBonusRatingThreshold: number;
    qualityBonusTokens: number;
    minSessionDurationMinutes: number;
    minRatingForEligibility: number;
    dailyRewardCapPerHelper: number;
  };
}

export function PlatformSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    callApi<Settings>("adminGetPlatformSettings")
      .then(setSettings)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Couldn't load settings."))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await callApi("adminUpdatePlatformSettings", settings as unknown as Record<string, unknown>);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <Spinner />
      </Card>
    );
  }
  if (!settings) {
    return (
      <Card>
        <Alert tone="danger">{error ?? "Couldn't load settings."}</Alert>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>Platform settings</CardTitle>
      <CardDescription className="mt-1">
        Training pass score and the helper reward formula — never hard-coded in application code.
      </CardDescription>

      {error && (
        <div className="mt-3">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
      {saved && (
        <div className="mt-3">
          <Alert tone="success">Saved.</Alert>
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="passScore">Training pass score (%)</Label>
          <Input
            id="passScore"
            type="number"
            value={settings.training.passScore}
            onChange={(e) => setSettings({ ...settings, training: { passScore: Number(e.target.value) } })}
          />
        </div>
        <div>
          <Label htmlFor="baseReward">Base reward (tokens/session)</Label>
          <Input
            id="baseReward"
            type="number"
            value={settings.rewards.baseRewardTokens}
            onChange={(e) =>
              setSettings({ ...settings, rewards: { ...settings.rewards, baseRewardTokens: Number(e.target.value) } })
            }
          />
        </div>
        <div>
          <Label htmlFor="qualityThreshold">Quality bonus rating threshold</Label>
          <Input
            id="qualityThreshold"
            type="number"
            value={settings.rewards.qualityBonusRatingThreshold}
            onChange={(e) =>
              setSettings({
                ...settings,
                rewards: { ...settings.rewards, qualityBonusRatingThreshold: Number(e.target.value) },
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="qualityBonus">Quality bonus (tokens)</Label>
          <Input
            id="qualityBonus"
            type="number"
            value={settings.rewards.qualityBonusTokens}
            onChange={(e) =>
              setSettings({ ...settings, rewards: { ...settings.rewards, qualityBonusTokens: Number(e.target.value) } })
            }
          />
        </div>
        <div>
          <Label htmlFor="minDuration">Min session duration (minutes)</Label>
          <Input
            id="minDuration"
            type="number"
            value={settings.rewards.minSessionDurationMinutes}
            onChange={(e) =>
              setSettings({
                ...settings,
                rewards: { ...settings.rewards, minSessionDurationMinutes: Number(e.target.value) },
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="minRating">Min rating for eligibility</Label>
          <Input
            id="minRating"
            type="number"
            value={settings.rewards.minRatingForEligibility}
            onChange={(e) =>
              setSettings({
                ...settings,
                rewards: { ...settings.rewards, minRatingForEligibility: Number(e.target.value) },
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="dailyCap">Daily reward cap per helper</Label>
          <Input
            id="dailyCap"
            type="number"
            value={settings.rewards.dailyRewardCapPerHelper}
            onChange={(e) =>
              setSettings({
                ...settings,
                rewards: { ...settings.rewards, dailyRewardCapPerHelper: Number(e.target.value) },
              })
            }
          />
        </div>
      </div>

      <Button className="mt-4" onClick={save} isLoading={saving}>
        Save settings
      </Button>
    </Card>
  );
}
