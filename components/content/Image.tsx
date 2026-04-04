interface ImageProps {
  src: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  rounded?: boolean | null;
}

export function Image({ src, alt, width, height, rounded }: ImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      data-component="image"
      src={src}
      alt={alt}
      width={width ?? undefined}
      height={height ?? undefined}
      className={`max-w-full ${rounded ? "rounded-full object-cover" : ""}`}
    />
  );
}
