import { GitHubButton } from "@/components/github-button";

export default function DefaultHeader() {
  return (
    <div className="flex flex-row flex-1 justify-end">
      <GitHubButton />
    </div>
  );
}
