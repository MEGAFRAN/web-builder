export type ParsedStatValue = {
  prefix: string;
  numericValue: number;
  suffix: string;
  decimals: number;
  animatable: boolean;
  display: string;
};

export function parseStatValue(raw: string): ParsedStatValue {
  const display = raw.trim();
  const match = display.match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)(.*)$/);

  if (!match) {
    return {
      prefix: "",
      numericValue: 0,
      suffix: "",
      decimals: 0,
      animatable: false,
      display,
    };
  }

  const [, prefix = "", numberPart = "0", suffix = ""] = match;
  const numericValue = Number(numberPart);
  const decimals = numberPart.includes(".")
    ? numberPart.split(".")[1]?.length ?? 0
    : 0;

  return {
    prefix,
    numericValue: Number.isFinite(numericValue) ? numericValue : 0,
    suffix,
    decimals,
    animatable: Number.isFinite(numericValue),
    display,
  };
}

export function formatStatValue(
  parsed: ParsedStatValue,
  current: number,
): string {
  if (!parsed.animatable) return parsed.display;

  const rounded =
    parsed.decimals > 0
      ? current.toFixed(parsed.decimals)
      : String(Math.round(current));

  return `${parsed.prefix}${rounded}${parsed.suffix}`;
}
