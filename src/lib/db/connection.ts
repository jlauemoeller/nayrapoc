import { db } from "@/lib/db";
import { Result, err } from "neverthrow";

export type TransactionContext = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbConnection = typeof db | TransactionContext;

export async function transaction<T>(
  f: (tx: TransactionContext) => Promise<T>,
  connection: DbConnection = db
): Promise<T> {
  const isTransactionContext = (conn: DbConnection): conn is TransactionContext => {
    // The top-level drizzle instance has $client; transaction contexts do not
    return !("$client" in conn);
  };

  if (isTransactionContext(connection)) {
    return await f(connection);
  } else {
    return await connection.transaction(async (tx) => await f(tx));
  }
}

class RollbackSignal<E> extends Error {
  constructor(readonly error: E) {
    super("transaction_rolled_back");
  }
}

export async function transactionResult<T, E>(
  fn: (tx: DbConnection) => Promise<Result<T, E>>,
  connection: DbConnection = db
): Promise<Result<T, E>> {
  try {
    return await transaction(async (tx) => {
      const result = await fn(tx);
      if (result.isErr()) {
        throw new RollbackSignal(result.error);
      }
      return result;
    }, connection);
  } catch (e) {
    if (e instanceof RollbackSignal) return err(e.error as E);

    throw e; // unexpected - let it bubble
  }
}
