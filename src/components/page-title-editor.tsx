"use client";

import { AcceptIcon, CancelIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Editable,
  EditableArea,
  EditablePreview,
  EditableInput,
  EditableToolbar,
  EditableSubmit,
  EditableCancel
} from "@/components/ui/editable";

type PageTitleEditorProps = React.ComponentProps<typeof Editable> & {
  editable: boolean;
};

export function PageTitleEditor({ editable, defaultValue, ...rest }: PageTitleEditorProps) {
  return !editable ? defaultValue : (
      <Editable defaultValue={defaultValue} autosize {...rest}>
        <EditableArea>
          <EditablePreview className="text-3xl md:text-3xl font-heading font-semibold tracking-tight" />
          <EditableInput className="text-3xl md:text-3xl font-heading font-semibold tracking-tight" />
        </EditableArea>
        <EditableToolbar>
          <EditableSubmit asChild>
            <Button size="default" className="w-fit mb-2" variant="outline">
              <AcceptIcon />
            </Button>
          </EditableSubmit>
          <EditableCancel asChild>
            <Button size="default" className="w-fit mb-2" variant="outline">
              <CancelIcon />
            </Button>
          </EditableCancel>
        </EditableToolbar>
      </Editable>
    );
}
