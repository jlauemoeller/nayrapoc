"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ErrorIcon } from "@/components/icons";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Swap for a real logger/error-reporting service later.
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-row h-100 w-full items-center">
      <div className="flex flex-row mx-auto gap-4">
        <ErrorIcon size="48" />
        <div>
          <h1>Thats an Error!</h1>
          <p>
            Sorry, something happened when it shouldn't. Get back to{" "}
            <Link href="/projects" className="underline">
              dry land
            </Link>{" "}
            or
          </p>
          <Button variant="outline" className="mt-4" onClick={() => reset()}>
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
