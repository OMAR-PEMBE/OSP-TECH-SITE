import {
  Bot,
  Globe,
  type LucideIcon,
  Server,
  Sparkles,
  Workflow,
  Wrench,
} from "lucide-react";

/**
 * Maps a `services.icon` key to a Lucide component.
 *
 * Explicit, not dynamic: `lucide-react` has well over a thousand icons, and
 * resolving one by name at runtime defeats tree-shaking and pulls the lot into
 * the bundle. Listing the handful the site actually uses keeps the import
 * cost to those icons — which matters on a 3G connection.
 *
 * Adding an icon in Admin therefore needs a line here. That is a deliberate
 * trade: a predictable bundle over arbitrary icon names.
 */
const ICONS: Record<string, LucideIcon> = {
  server: Server,
  globe: Globe,
  workflow: Workflow,
  sparkles: Sparkles,
  bot: Bot,
  wrench: Wrench,
};

export function ServiceIcon({
  name,
  className,
}: {
  name: string | null;
  className?: string;
}) {
  const Icon = (name && ICONS[name]) || Wrench;
  return <Icon aria-hidden="true" className={className} />;
}
