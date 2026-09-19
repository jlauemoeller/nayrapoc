import { expect } from "vitest";
import { z } from "zod";

export function expectSchemaToBeSubset<Parent extends z.ZodRawShape, Child extends z.ZodRawShape & Partial<Parent>>(
  parent: z.ZodObject<Parent>,
  child: z.ZodObject<Child>,
  keys: (keyof Parent & keyof Child & string)[]
) {
  expect(Object.keys(child.shape)).toEqual(keys);

  for (const key of keys) {
    expect(child.shape[key]).toBe(parent.shape[key]);
  }
}
