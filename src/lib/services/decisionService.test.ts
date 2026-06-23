import { describe, it, expect } from "vitest";
import type { Block } from "@blocknote/core";
import { DecisionService } from "@lib/services/decisionService";
import { setupTestDb } from "@lib/testing/dbTest";
import { createDecision, createProject, createUserWithAccount } from "@lib/testing/factories";

const { db } = setupTestDb();

const sampleRationale = [{ type: "paragraph", content: "Boring technology wins" }] as unknown as Block[];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DecisionService", () => {
  describe("get", () => {
    it("returns the domain decision when found", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const decision = await createDecision(db, project.id, user.id);

      const result = await DecisionService.get(decision.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(decision.id);
      expect(result!.projectId).toBe(project.id);
      expect(result!.creatorId).toBe(user.id);
    });

    it("returns undefined when the decision does not exist", async () => {
      const result = await DecisionService.get("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------

  describe("getWithProject", () => {
    it("returns the decision joined with its project", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const decision = await createDecision(db, project.id, user.id);

      const result = await DecisionService.getWithProject(decision.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(decision.id);
      expect(result!.project.id).toBe(project.id);
    });
  });

  // -------------------------------------------------------------------------

  describe("getWithCreator", () => {
    it("returns the decision joined with its creator", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const decision = await createDecision(db, project.id, user.id);

      const result = await DecisionService.getWithCreator(decision.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(decision.id);
      expect(result!.creator.id).toBe(user.id);
    });
  });

  // -------------------------------------------------------------------------

  describe("getWithProjectAndCreator", () => {
    it("returns the decision joined with its project and creator", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const decision = await createDecision(db, project.id, user.id);

      const result = await DecisionService.getWithProjectAndCreator(decision.id, db);

      expect(result).toBeDefined();
      expect(result!.id).toBe(decision.id);
      expect(result!.project.id).toBe(project.id);
      expect(result!.creator.id).toBe(user.id);
    });

    it("returns undefined when the decision does not exist", async () => {
      const result = await DecisionService.getWithProjectAndCreator("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------

  describe("list", () => {
    it("returns all decisions as domain models", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      await createDecision(db, project.id, user.id);
      await createDecision(db, project.id, user.id);

      const result = await DecisionService.list(db);

      expect(result).toHaveLength(2);
      expect(result[0].projectId).toBe(project.id);
      expect(result[0].creatorId).toBe(user.id);
    });

    it("returns an empty array when no decisions exist", async () => {
      const result = await DecisionService.list(db);
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

      const result = await DecisionService.listForProject(project.id, db);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mine.id);
      expect(result[0].projectId).toBe(project.id);
    });

    it("returns an empty array when the project has no decisions", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      const result = await DecisionService.listForProject(project.id, db);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------

  describe("listWithCreatorForProject", () => {
    it("returns creator-joined decisions scoped to the given project", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const otherProject = await createProject(db, account.id, user.id);
      const mine = await createDecision(db, project.id, user.id);
      await createDecision(db, otherProject.id, user.id);

      const result = await DecisionService.listWithCreatorForProject(project.id, db);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mine.id);
      expect(result[0].creator.id).toBe(user.id);
    });
  });

  // -------------------------------------------------------------------------

  describe("listWithProjectAndCreatorForProject", () => {
    it("returns project-and-creator-joined decisions scoped to the given project", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const otherProject = await createProject(db, account.id, user.id);
      const mine = await createDecision(db, project.id, user.id);
      await createDecision(db, otherProject.id, user.id);

      const result = await DecisionService.listWithProjectAndCreatorForProject(project.id, db);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mine.id);
      expect(result[0].project.id).toBe(project.id);
      expect(result[0].creator.id).toBe(user.id);
    });

    it("returns an empty array when the project has no decisions", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      const result = await DecisionService.listWithProjectAndCreatorForProject(project.id, db);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------

  describe("create", () => {
    it("returns Ok(decision) with camelCase domain fields", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      const result = await DecisionService.create(
        {
          title: "Use Postgres",
          rationale: sampleRationale,
          projectId: project.id,
          creatorId: user.id
        },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe("Use Postgres");
        expect(result.value.rationale).toEqual(sampleRationale);
        expect(result.value.projectId).toBe(project.id);
        expect(result.value.creatorId).toBe(user.id);
        expect(result.value.id).toBeDefined();
      }
    });

    it("trims whitespace from title", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      const result = await DecisionService.create(
        {
          title: "  Use Postgres  ",
          projectId: project.id,
          creatorId: user.id
        },
        db
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe("Use Postgres");
      }
    });

    // Missing FKs are "unexpected" — no handler is registered, so they throw rather than
    // returning a typed Err.
    it("throws when project does not exist", async () => {
      const { user } = await createUserWithAccount(db);

      await expect(
        DecisionService.create(
          {
            title: "Orphan",
            projectId: "00000000-0000-7000-8000-000000000000",
            creatorId: user.id
          },
          db
        )
      ).rejects.toThrow();
    });

    it("throws when creator does not exist", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);

      await expect(
        DecisionService.create(
          {
            title: "Orphan",
            projectId: project.id,
            creatorId: "00000000-0000-7000-8000-000000000000"
          },
          db
        )
      ).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------

  describe("update", () => {
    it("returns Ok(decision) with updated fields", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const decision = await createDecision(db, project.id, user.id, { title: "Old" });

      const result = await DecisionService.update(decision.id, { title: "New" }, db);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe("New");
      }
    });

    it("trims whitespace from title on update", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const decision = await createDecision(db, project.id, user.id);

      const result = await DecisionService.update(decision.id, { title: "  Trimmed  " }, db);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe("Trimmed");
      }
    });

    it("throws when the decision does not exist", async () => {
      await expect(
        DecisionService.update("00000000-0000-7000-8000-000000000000", { title: "Ghost" }, db)
      ).rejects.toThrow("update failed");
    });
  });

  // -------------------------------------------------------------------------

  describe("updateRationale", () => {
    it("persists the document and round-trips it unchanged", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const decision = await createDecision(db, project.id, user.id);

      const result = await DecisionService.updateRationale(decision.id, sampleRationale, db);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.rationale).toEqual(sampleRationale);
      }

      const reloaded = await DecisionService.get(decision.id, db);
      expect(reloaded?.rationale).toEqual(sampleRationale);
    });
  });

  // -------------------------------------------------------------------------

  describe("delete", () => {
    it("returns true when the decision exists", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const decision = await createDecision(db, project.id, user.id);

      const result = await DecisionService.delete(decision.id, db);

      expect(result).toBe(true);
    });

    it("actually removes the decision from the database", async () => {
      const { user, account } = await createUserWithAccount(db);
      const project = await createProject(db, account.id, user.id);
      const decision = await createDecision(db, project.id, user.id);

      await DecisionService.delete(decision.id, db);

      const found = await DecisionService.get(decision.id, db);
      expect(found).toBeUndefined();
    });

    it("returns false when the decision does not exist", async () => {
      const result = await DecisionService.delete("00000000-0000-7000-8000-000000000000", db);
      expect(result).toBe(false);
    });
  });
});
