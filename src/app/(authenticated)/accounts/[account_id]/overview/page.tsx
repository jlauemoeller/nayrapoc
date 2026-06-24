import { currentUser } from "@/lib/authorization";
export default async function OverviewPage() {
  const actor = await currentUser();

  return (
    <div className="flex flex-col mx-autoi prose prose-p:my-2">
      <h1>👋 Welcome {actor.firstName}</h1>

      <p>
        <b>Nayra</b> is a <b>Proof-of-Concept</b> implementation of a <em>Decision Journal</em> for teams.
      </p>
      <p>
        Every project rests on a foundation of previous decisions and assumptions. Some may still be holding up while
        others have long since lost their relevance.
      </p>
      <p>
        A Decision Journal allows a team to record decisions and assumptions as they are made and build a shared
        understanding of "the current truth".
      </p>
      <p>
        <span className="uppercase text-destructive font-bold">THIS IS A DEMO</span>
      </p>
      <p>
        <b>The app resets every hour</b> and all data added by users will be lost, including user accounts.
      </p>
      <p>- Enjoy, Jacob</p>
    </div>
  );
}
