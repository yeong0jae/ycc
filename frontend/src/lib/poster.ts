import { getImageProps } from "next/image";

export function posterProps(src: string, sizes: string) {
  const { props } = getImageProps({ src, alt: "", width: 600, height: 800, sizes });
  return { src: props.src, srcSet: props.srcSet, sizes: props.sizes };
}
