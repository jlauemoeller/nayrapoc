import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";
import Link from "next/link";

type BreadcrumbPathElement = {
  name: React.ReactNode;
  link: string;
};

type BreadcrumbProps = React.ComponentProps<"div"> & {
  path: BreadcrumbPathElement[];
  page: React.ReactNode;
};

export function Breadcrumbs({ path, page, ...rest }: BreadcrumbProps) {
  return (
    <Breadcrumb {...rest}>
      <BreadcrumbList>
        {path.map(segment)}

        <BreadcrumbItem>
          <BreadcrumbPage>{page}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function segment({ name, link }: BreadcrumbPathElement) {
  return (
    <Fragment key={link}>
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <Link href={link}>{name}</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
    </Fragment>
  );
}
