import { Card, CardDescription, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";

/**
 * A clearly-labeled placeholder for a feature not built yet, distinct from
 * a dead/do-nothing button — every card here maps to a named upcoming
 * phase in docs/HEART2HEAR_IMPLEMENTATION_PLAN.md.
 */
export function ComingSoon({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <Card className="opacity-90">
      <div className="flex items-start justify-between gap-3">
        <CardTitle>{title}</CardTitle>
        <Badge tone="neutral">{phase}</Badge>
      </div>
      <CardDescription className="mt-2">{description}</CardDescription>
    </Card>
  );
}
