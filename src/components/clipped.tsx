import { clipText } from "@/lib/utils";

type ClippedProps = {
  text: string;
  maxLength: number;
};

export function Clipped(props: ClippedProps) {
  return clipText(props.text, props.maxLength);
}
