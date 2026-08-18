import { DEFAULT_ICON, ICON_MAP } from "@/lib/icons";

export function CategoryIcon({
  icon,
  color,
  size = 20,
  className,
}: {
  icon: string;
  color: string;
  size?: number;
  className?: string;
}) {
  const Icon = ICON_MAP[icon] ?? ICON_MAP[DEFAULT_ICON];
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ${className ?? ""}`}
      style={{
        backgroundColor: `${color}1f`,
        color,
        width: size * 1.9,
        height: size * 1.9,
      }}
    >
      <Icon size={size} strokeWidth={2} />
    </span>
  );
}
