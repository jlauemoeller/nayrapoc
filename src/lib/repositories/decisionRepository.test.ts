import { describe, it, expect } from "vitest";
import type { Block } from "@blocknote/core";
import { DecisionRepository } from "@lib/repositories/decisionRepository";
import { setupTestDb } from "@lib/testing/dbTest";
import { createDecision, createProject, createUserWithAccount } from "@lib/testing/factories";

const { db } = setupTestDb();

const sampleRationale = [{ type: "paragraph", content: "Boring technology wins" }] as unknown as Block[];
// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DecisionRepository", () => {
  describe("list", () => {
    it("returns all decisions", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      await createDecision(db, project.id, user.id);
      await createDecision(db, project.id, user.id);

      const result = await DecisionRepository.list(db);

      expect(result).toHaveLength(2);
    });

    it("returns an empty array when no decisions exist", async () => {
      const result = await DecisionRepository.list(db);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------

  describe("listForProject", () => {
    it("returns only decisions belonging to the given project", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const otherProject = await createProject(db, account.id, user.id);
      const mine = await createDecision(db, project.id, user.id);
      await createDecision(db, otherProject.id, user.id);

      const result = await DecisionRepository.listForProject(project.id, db);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mine.id);
    });

    it("returns decisions oldest first", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const older = await createDecision(db, project.id, user.id, { created_at: new Date("2026-01-01") });
      const newer = await createDecision(db, project.id, user.id, { created_at: new Date("2026-02-01") });

      const result = await DecisionRepository.listForProject(project.id, db);

      expect(result.map((d) => d.id)).toEqual([older.id, newer.id]);
    });

    it("returns an empty array when the project has no decisions", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      const result = await DecisionRepository.listForProject(project.id, db);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------

  describe("listWithCreatorForProject", () => {
    it("returns decisions with their creator, scoped to the given project", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const otherProject = await createProject(db, account.id, user.id);
      const mine = await createDecision(db, project.id, user.id);
      await createDecision(db, otherProject.id, user.id);

      const result = await DecisionRepository.listWithCreatorForProject(project.id, db);

      expect(result).toHaveLength(1);
      expect(result[0].decision.id).toBe(mine.id);
      expect(result[0].creator.id).toBe(user.id);
    });

    it("returns an empty array when the project has no decisions", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      const result = await DecisionRepository.listWithCreatorForProject(project.id, db);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------

  describe("listWithProjectAndCreatorForProject", () => {
    it("returns decisions with their project and creator, scoped to the given project", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const otherProject = await createProject(db, account.id, user.id);
      const mine = await createDecision(db, project.id, user.id);
      await createDecision(db, otherProject.id, user.id);

      const result = await DecisionRepository.listWithProjectAndCreatorForProject(project.id, db);

      expect(result).toHaveLength(1);
      expect(result[0].decision.id).toBe(mine.id);
      expect(result[0].project.id).toBe(project.id);
      expect(result[0].creator.id).toBe(user.id);
    });

    it("returns decisions newest first", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const older = await createDecision(db, project.id, user.id, { created_at: new Date("2026-01-01") });
      const newer = await createDecision(db, project.id, user.id, { created_at: new Date("2026-02-01") });

      const result = await DecisionRepository.listWithProjectAndCreatorForProject(project.id, db);

      expect(result.map((r) => r.decision.id)).toEqual([older.id, newer.id]);
    });

    it("returns an empty array when the project has no decisions", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      const result = await DecisionRepository.listWithProjectAndCreatorForProject(project.id, db);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------

  describe("get", () => {
    it("returns the decision when found", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const decision = await createDecision(db, project.id, user.id);

      const result = await DecisionRepository.get(decision.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(decision.id);
    });

    it("returns undefined when the decision does not exist", async () => {
      const result = await DecisionRepository.get("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------

  describe("getWithProject", () => {
    it("returns the decision joined with its project", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const decision = await createDecision(db, project.id, user.id);

      const result = await DecisionRepository.getWithProject(decision.id, db);

      expect(result).toBeDefined();
      expect(result!.decision.id).toBe(decision.id);
      expect(result!.project.id).toBe(project.id);
    });

    it("returns undefined when the decision does not exist", async () => {
      const result = await DecisionRepository.getWithProject("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------

  describe("getWithCreator", () => {
    it("returns the decision joined with its creator", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const decision = await createDecision(db, project.id, user.id);

      const result = await DecisionRepository.getWithCreator(decision.id, db);

      expect(result).toBeDefined();
      expect(result!.decision.id).toBe(decision.id);
      expect(result!.creator.id).toBe(user.id);
    });
  });

  // -------------------------------------------------------------------------

  describe("getWithProjectAndCreator", () => {
    it("returns the decision joined with its project and creator", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const decision = await createDecision(db, project.id, user.id);

      const result = await DecisionRepository.getWithProjectAndCreator(decision.id, db);

      expect(result).toBeDefined();
      expect(result!.decision.id).toBe(decision.id);
      expect(result!.project.id).toBe(project.id);
      expect(result!.creator.id).toBe(user.id);
    });

    it("returns undefined when the decision does not exist", async () => {
      const result = await DecisionRepository.getWithProjectAndCreator("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------

  describe("create", () => {
    it("returns Ok(decision) on success", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      const result = await DecisionRepository.create(
        {
          title: "Use Postgres",
          rationale: sampleRationale,
          project_id: project.id,
          creator_id: user.id
        },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe("Use Postgres");
        expect(result.value.project_id).toBe(project.id);
        expect(result.value.creator_id).toBe(user.id);
        expect(result.value.id).toBeDefined();
      }
    });

    // Missing FKs are "unexpected" — no handler is registered, so they throw rather than
    // returning a typed Err.
    it("throws when project_id does not exist", async () => {
      const { user } = await createUserWithAccount(db);

      await expect(
        DecisionRepository.create(
          {
            title: "Orphan",
            project_id: "00000000-0000-7000-8000-000000000000",
            creator_id: user.id
          },
          db
        )
      ).rejects.toThrow();
    });

    it("throws when creator_id does not exist", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      await expect(
        DecisionRepository.create(
          {
            title: "Orphan",
            project_id: project.id,
            creator_id: "00000000-0000-7000-8000-000000000000"
          },
          db
        )
      ).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------

  describe("update", () => {
    it("returns Ok(decision) with the updated fields", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const decision = await createDecision(db, project.id, user.id, { title: "Old Title" });

      const result = await DecisionRepository.update(decision.id, { title: "New Title" }, db);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value.title).toBe("New Title");
    });

    it("throws when the decision is not found", async () => {
      await expect(
        DecisionRepository.update("00000000-0000-7000-8000-000000000000", { title: "Ghost" }, db)
      ).rejects.toThrow("update failed");
    });
  });

  // -------------------------------------------------------------------------

  describe("delete", () => {
    it("returns true when the decision exists", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const decision = await createDecision(db, project.id, user.id);

      const result = await DecisionRepository.delete(decision.id, db);

      expect(result).toBe(true);
    });

    it("returns false when the decision does not exist", async () => {
      const result = await DecisionRepository.delete("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBe(false);
    });

    it("actually removes the decision from the database", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const decision = await createDecision(db, project.id, user.id);

      await DecisionRepository.delete(decision.id, db);

      const found = await DecisionRepository.get(decision.id, db);
      expect(found).toBeUndefined();
    });
  });
});
