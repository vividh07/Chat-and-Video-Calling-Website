import { getInitials } from "../lib/helpers";

type Props = {
  name?: string;
  avatar?: string | null;
  size?: "sm" | "lg" | "xl";
};

export function Avatar({ name, avatar, size = "sm" }: Props) {
  const cls =
    size === "xl" ? "avatar avatar--xl" : size === "lg" ? "avatar avatar--lg" : "avatar";

  if (avatar) {
    return <img className={cls} src={avatar} alt={name || "avatar"} />;
  }

  return <div className={cls}>{getInitials(name)}</div>;
}
