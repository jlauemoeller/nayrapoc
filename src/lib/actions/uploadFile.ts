"use server";

import { ActionResult } from "@/lib/actions/types";
import { CloudStorageService, PresignedUpload } from "@/lib/services/cloudStorageService";
import { getAuthOptions } from "@/lib/auth/options";
import { getServerSession } from "next-auth";

export type RequestUploadInput = {
  contentType: string;
  contentLength: number;
};

// General-purpose presigned-upload action used by the BlockNote editor's uploadFile
// callback.
export async function requestUpload(input: RequestUploadInput): Promise<ActionResult<PresignedUpload, string>> {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user?.accountId) {
    return { success: false, error: "Not authorized" };
  }

  const result = await CloudStorageService.presignUpload({
    accountId: session.user.accountId,
    contentType: input.contentType,
    contentLength: input.contentLength
  });

  if (result.isOk()) {
    return { success: true, data: result.value };
  }

  // The service already returns a human-readable message; the editor surfaces it by throwing.
  return { success: false, error: result.error };
}
