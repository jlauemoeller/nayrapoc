import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PgBoss } from "pg-boss";
import { getBoss, stopBoss } from "./boss";
import { QUEUES, queueDefinitions } from "./queues";

// Integration test against the `pgboss` schema in nayra_test. It doesn't touch
// the app tables, so it doesn't need the advisory lock from setupTestDb().
describe("pg-boss bootstrap", () => {
  let boss: PgBoss;

  beforeAll(async () => {
    boss = await getBoss();
    await boss.deleteAllJobs(QUEUES.evaluateAssumption);
  });

  afterAll(async () => {
    await stopBoss();
  });

  it("returns the same instance to every caller", async () => {
    expect(await getBoss()).toBe(boss);
  });

  it("creates every declared queue with its options", async () => {
    for (const name of Object.values(QUEUES)) {
      const queue = await boss.getQueue(name);
      expect(queue, name).not.toBeNull();
      expect(queue?.policy).toBe(queueDefinitions[name].policy);
      expect(queue?.retryLimit).toBe(queueDefinitions[name].retryLimit);
      expect(queue?.deadLetter ?? undefined).toBe(queueDefinitions[name].deadLetter);
    }
  });

  it("debounces sends per assumption id", async () => {
    const first = await boss.sendDebounced(QUEUES.evaluateAssumption, { assumptionId: "a1" }, null, 15, "a1");
    const second = await boss.sendDebounced(QUEUES.evaluateAssumption, { assumptionId: "a1" }, null, 15, "a1");
    const third = await boss.sendDebounced(QUEUES.evaluateAssumption, { assumptionId: "a1" }, null, 15, "a1");
    const other = await boss.sendDebounced(QUEUES.evaluateAssumption, { assumptionId: "a2" }, null, 15, "a2");

    expect(first).not.toBeNull();
    expect(second).not.toBeNull(); // the trailing slot (singletonNextSlot)
    expect(third).toBeNull(); // current and next slot both taken
    expect(other).not.toBeNull(); // different key
  });
});
