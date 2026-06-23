import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { GitHubButton } from "@/components/github-button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-16">
      <div className="flex flex-row justify-between border-b p-8 ">
        <span className="text-3xl">nayra</span>
        <GitHubButton />
      </div>

      <div className="mx-auto px-8 md:max-w-1/2 mt-12">
        <div className="flex flex-col gap-4 items-start">
          <div className="uppercase inline-block text-xs rounded-sm bg-gray-300 p-2">Proof of Concept</div>
          <h1 className="text-5xl">Decision Journal for Teams</h1>
          <div>
            The future is shaped by our past decisions. What were they? Why were they made? Which of them are still
            relevant? If you can answer these questions, you can make better decisions about the future.
          </div>
          <div>
            Understanding the rationale behind decisions and their assumptions have always been key to effective
            decision making, but perhaps even more so in a time of asynchronous remote teams of humans and AI agents.
          </div>
          <div>
            Nayra explores how to provide project teams with a simple and effective way to record and track past
            decisions.
          </div>
        </div>
        <div className="">
          <div className="flex flex-row gap-4 border rounded-md p-5 bg-gray-300 mt-8">
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
            <div>
              <b>This is just a demo</b>. Everything resets on the hour &mdash; don't use the application for real work.
              View the full{" "}
              <a className="underline pointer" href="https://github.com/jlauemoeller/nayra-poc">
                source code on GitHub
              </a>
              .
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:mx-32 mx-8 items-stretch mt-8">
        <div className="border-2 rounded-md border-gray-300 p-5 min-w-32 flex-1/3">
          <h2>Define</h2>
          <div>Add your projects and ground them with a concise description so everyone starts on the same page.</div>
        </div>
        <div className="flex flex-row md:items-center justify-around">
          <RefreshCw size="48" />
        </div>
        <div className="border-2 rounded-md border-gray-300 p-5 min-w-32 flex-1/3">
          <h2>Record</h2>
          <div>Record decisions and underlying assumptions, then track their relevance as the project evolves.</div>
        </div>
        <div className="flex flex-row md:items-center justify-around">
          <RefreshCw size="48" />
        </div>
        <div className="border-2 rounded-md border-gray-300 p-5 min-w-32i flex-1/3">
          <h2>Review</h2>
          <div>Review past decisions and assumptions. Retire outdated ones and keep your team memory in shape.</div>
        </div>
      </div>
    </div>
  );
}
