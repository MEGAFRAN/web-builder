interface ImageBaseProps {
  src: string;
  alt: string;
  rounded?: boolean | null;
}

interface ImageFixedProps extends ImageBaseProps {
  fill?: false | null;
  width?: number | null;
  height?: number | null;
  objectFit?: never;
  fetchPriority?: never;
  loading?: never;
}

interface ImageFillProps extends ImageBaseProps {
  fill: true;
  /** CSS object-fit applied when fill=true. Defaults to 'cover'. */
  objectFit?: 'cover' | 'contain' | 'fill' | null;
  /** Passed as the native fetchpriority attribute for LCP optimisation. */
  fetchPriority?: 'high' | 'low' | 'auto' | null;
  loading?: 'eager' | 'lazy' | null;
  width?: never;
  height?: never;
}

export type ImageProps = ImageFixedProps | ImageFillProps;

/**
 * Registry image component.
 *
 * Two modes:
 * - Default (fill omitted / false): standard img with optional width/height.
 * - Fill mode (fill=true): absolutely-positioned img that fills its nearest
 *   positioned ancestor. The parent must have `position: relative` (or similar)
 *   and a defined height / aspect-ratio.
 */
export function Image(props: ImageProps) {
  if (props.fill) {
    const { src, alt, rounded, objectFit, fetchPriority, loading } = props;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        data-component="image"
        src={src}
        alt={alt}
        fetchPriority={fetchPriority ?? 'auto'}
        loading={loading ?? 'lazy'}
        className={`absolute inset-0 h-full w-full ${
          rounded ? 'rounded-full' : ''
        }`}
        style={{ objectFit: objectFit ?? 'cover' }}
      />
    );
  }

  const { src, alt, width, height, rounded } = props;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      data-component="image"
      src={src}
      alt={alt}
      width={width ?? undefined}
      height={height ?? undefined}
      className={`max-w-full ${rounded ? 'rounded-full object-cover' : ''}`}
    />
  );
}
