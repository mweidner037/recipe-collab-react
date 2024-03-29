import { useEffect, useRef } from "react";

import { Order, Position } from "list-positions";
import { useElectric } from "../Loader";
import { QuillWrapper, WrapperOp } from "./quill_wrapper";

export function ElectricQuill({
  docId,
  style,
}: {
  docId: string;
  style?: React.CSSProperties;
}) {
  const { db } = useElectric()!;

  const quillRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (quillRef.current === null) return;

    const wrapper = new QuillWrapper(
      quillRef.current,
      onLocalOps,
      // Start with minimal initial state; existing db state loaded
      // in by queries below, analogous to new edits.
      QuillWrapper.makeInitialState()
    );

    /**
     * Note: I use a strategy that describes the Quill state "transparently"
     * in the DB - e.g., there are rows corresponding to individual chars.
     * (Though it is not yet practical to query the text in order.)
     *
     * In principle, one could instead store the Quill state "opaquely",
     * by just storing the WrapperOps in an append-only log.
     * But one goal of list-positions is to allow transparent storage & updates,
     * instead of storing a CRDT library's opaque update blobs,
     * so that is what I demo here.
     */

    // Send local ops to the DB.
    async function onLocalOps(ops: WrapperOp[]) {
      for (const op of ops) {
        switch (op.type) {
          case "set": {
            const poss = Order.startPosToArray(op.startPos, op.chars.length);
            await db.char_entries.createMany({
              data: poss.map((pos, i) => ({
                pos: encodePos(pos),
                char: op.chars[i],
                doc_id: docId,
              })),
            });
            break;
          }
          case "delete":
            // TODO: deleteMany instead?
            for (const pos of Order.startPosToArray(
              op.startPos,
              op.count ?? 1
            )) {
              await db.char_entries.delete({ where: { pos: encodePos(pos) } });
            }
            break;
          case "metas":
            // Note: It is important that receivers apply all of these BunchMetas together,
            // in case they have internal dependencies.
            await db.bunches.createMany({
              data: op.metas.map((meta) => ({
                id: meta.bunchID,
                parent_id: meta.parentID,
                theoffset: meta.offset,
                doc_id: docId,
              })),
            });
            break;
          case "marks":
            // TODO
            break;
        }
      }
    }

    // Reflect DB ops in Quill.
    // TODO: need to do manual diff like in Triplit? Add dev note asking about alternatives.

    return () => wrapper.destroy();
  }, [docId]);

  return <div ref={quillRef} style={style} />;
}

function encodePos(pos: Position): string {
  return `${pos.bunchID}_${pos.innerIndex.toString(36)}`;
}
