import Link from "next/link";
import { NotFoundIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="flex flex-row h-100 w-full items-center">
      <div className="flex flex-row mx-auto gap-4">
        <NotFoundIcon size="48" />
        <div>
          <h1>404 Not Found</h1>
          <p>
            That page was not found. Go back to{" "}
            <Link href="/projects" className="underline">
              dry land
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
