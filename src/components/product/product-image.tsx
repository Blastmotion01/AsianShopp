import Image, { type ImageProps } from "next/image";

/** next/image wrapper: SVG placeholders are served as-is (no optimizer). */
export function ProductImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  // eslint-disable-next-line jsx-a11y/alt-text -- alt is passed through props
  return <Image {...props} unoptimized={props.unoptimized ?? src.endsWith(".svg")} />;
}
