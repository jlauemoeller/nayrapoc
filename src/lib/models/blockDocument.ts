import type { Block } from "@blocknote/core";
import { z } from "zod";

const envelope = z.array(z.looseObject({ id: z.string(), type: z.string() })).max(1000);
export const blockDocumentSchema = z.custom<Block[]>((value) => envelope.safeParse(value).success, "Invalid document");
