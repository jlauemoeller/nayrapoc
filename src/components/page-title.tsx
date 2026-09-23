import Hint from "@/components/hint";
import { Clipped } from "@/components/clipped";
import { Separator } from "@/components/ui/separator";

interface PageTitleProps {
  children?: React.ReactNode;
  title: React.ReactNode;
  actions?: React.ReactNode;
  hint?: string;
}

export function PageTitle(props: PageTitleProps) {
  return (
    <div>
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-col md:flex-row md:items-center md:gap-4">
          {typeof props.title === "string" ?
            <h2>
              <Clipped text={props.title} maxLength={40} />
            </h2>
          : props.title}
          {props.hint && (
            <>
              <Separator orientation="vertical" className="hidden md:block h-8 baseline" />
              <Hint text={props.hint} maxLength={80} />
            </>
          )}
        </div>
        {props.actions}
      </div>
      {props.children}
    </div>
  );
}
