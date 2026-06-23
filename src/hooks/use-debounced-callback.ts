import { useMemo, useRef, useEffect } from "react";
import { debounce } from "lodash";

/**
 * Returns a debounced version of `fn` that:
 *  - keeps a single, stable debouncer across renders (so the timer survives re-renders), and
 *  - always calls the *latest* `fn`, even though `fn` is a fresh closure each render.
 *
 * The latter is the important part: a naive `useMemo(() => debounce(fn), [])` would freeze
 * the closure from the first render, so saves would target stale props after a prop change
 * (e.g. navigating between two records that reuse the same component instance). We route the
 * call through a ref that an effect repoints to the latest `fn` on every render.
 *
 * The debouncer is cancelled on unmount so a pending call can't fire after the component is gone.
 */
export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }); // no deps -> run on every render, keeping fnRef pointed at the latest closure

  // The ref is only read inside the debounced callback, which lodash never invokes during
  // render -- only after the timer fires. The lint rule can't prove that deferral, so we
  // opt out of it here rather than reach for useEffectEvent (which may only be called from
  // Effects, not from a debounced handler).
  // eslint-disable-next-line react-hooks/refs
  const debounced = useMemo(() => debounce((...args: A) => fnRef.current(...args), ms), [ms]);

  useEffect(() => () => debounced.cancel(), [debounced]); // cancel on unmount
  return debounced;
}
