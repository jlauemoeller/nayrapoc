import { Clipped } from "@/components/clipped";

type HintProps = {
  text: string;
  maxLength: number;
};

export default function Hint(props: HintProps) {
  return (
    <div className="md:text-xs text-gray-500 whitespace-nowrap overflow-clip text-ellipsis">
      <Clipped text={props.text} maxLength={props.maxLength} />
    </div>
  );
}
