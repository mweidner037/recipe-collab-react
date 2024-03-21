/* eslint-disable @typescript-eslint/no-explicit-any */
import { next as Automerge } from "@automerge/automerge";
import Quill, { DeltaStatic, Delta as DeltaType } from "quill";

const Delta: typeof DeltaType = Quill.import("delta");

/**
 * These formats are exclusive; we need to pass only one at a time to Quill or
 * the result is inconsistent.
 * So, we wrap them in our own "block" formatting attribute:
 * { block: "[key, value]" }.
 */
const exclusiveBlocks = new Set(["blockquote", "header", "list", "code-block"]);

/**
 * Expand arg for the given format key's mark/unmark op.
 *
 * Default for inline formatting is "after"/"after".
 *
 * For links, instead use "none"/"both" (Peritext example 9).
 *
 * We also set all block formats to "none"/"none" for a Quill-specific reason:
 * Quill doesn't let a block format apply to a non-"\n", so a block format
 * shouldn't expand to neighboring non-"\n" chars (otherwise, we have to do
 * extra unmark ops).
 */
function getExpand(
  key: string,
  isMark: boolean
): "none" | "before" | "after" | "both" {
  switch (key) {
    case "block":
    case "indent":
    case "align":
    case "direction":
      return "none";
    case "link":
      return isMark ? "none" : "both";
    default:
      return "after";
  }
}

export interface IDocHandle<T> {
  isReady(): boolean;
  docSync(): T | undefined;
  on(
    event: "change",
    handler: (arg: {
      doc: Automerge.Doc<T>;
      patches: Automerge.Patch[];
    }) => void
  ): void;
  change(callback: (doc: T) => void): void;
}

/**
 * Assumes docHandle.isReady().
 */
export function setupAutomergeQuillBinding(
  docHandle: IDocHandle<{ text: string }>,
  quill: Quill
) {
  if (!docHandle.isReady()) {
    throw new Error("Not supported: non-ready doc");
  }

  // Push doc's initial state to Quill.
  {
    const doc: Automerge.Doc<{ text: string }> = docHandle.docSync()!;
    // delete(1) deletes Quill's initial "\n".
    let pendingDelta = new Delta().insert(doc.text).delete(1);
    for (const mark of Automerge.marks(doc, ["text"])) {
      pendingDelta = pendingDelta.compose(
        new Delta()
          .retain(mark.start)
          .retain(
            mark.end - mark.start,
            automergeAttrToQuill({ [mark.name]: mark.value })
          )
      );
    }
    quill.updateContents(pendingDelta);
  }

  // Reflect Automerge operations in Quill.

  let ourQuillChange = false;
  let ourAutomergeChange = false;

  docHandle.on("change", ({ doc, patches }) => {
    // TODO: is there a better way to detect local changes?
    // pastchingInfo.source is "change" for both local & remote updates.
    if (ourAutomergeChange) return;

    let pendingDelta: DeltaStatic = new Delta();
    for (const patch of patches) {
      if (patch.path[0] !== "text") continue;

      console.log(JSON.stringify(patch, undefined, 2));

      switch (patch.action) {
        case "splice":
          const index = patch.path[1] as number;
          const quillFormat = automergeAttrToQuill(patch.marks ?? {});
          pendingDelta = pendingDelta.compose(
            new Delta().retain(index).insert(patch.value, quillFormat)
          );
          break;
        case "del":
          pendingDelta = pendingDelta.compose(
            new Delta()
              .retain(patch.path[1] as number)
              .delete(patch.length ?? 1)
          );
          break;
        case "mark":
          for (const mark of patch.marks) {
            pendingDelta = pendingDelta.compose(
              new Delta()
                .retain(mark.start)
                .retain(
                  mark.end - mark.start,
                  automergeAttrToQuill({ [mark.name]: mark.value })
                )
            );
          }
          break;
        default:
          throw new Error("Unexpected patch: " + JSON.stringify(patch));
      }
    }

    ourQuillChange = true;
    try {
      quill.updateContents(pendingDelta);
    } finally {
      ourQuillChange = false;
    }
  });

  // Convert user inputs to Automerge operations.

  quill.on("text-change", (delta) => {
    if (ourQuillChange) return;

    ourAutomergeChange = true;
    try {
      docHandle.change((doc: { text: string }) => {
        for (const op of getRelevantDeltaOperations(delta)) {
          // Insertion
          if (op.insert) {
            if (typeof op.insert === "string") {
              console.log("splice", op.index, 0, op.insert);
              Automerge.splice(doc, ["text"], op.index, 0, op.insert);

              const quillAttrs = op.attributes ?? {};
              // Find which formats we need to apply to match quillAttrs,
              // by diffing against the "inherited" marks.
              // Here I assume that all new chars have the same inherited marks.
              const needsFormat = new Map(
                [...Object.entries(quillAttrs)].map(quillAttrToAutomerge)
              );
              console.log(
                "marksAt",
                JSON.stringify(
                  Automerge.marksAt(doc, ["text"], op.index),
                  undefined,
                  2
                )
              );
              for (const [key, value] of Object.entries(
                Automerge.marksAt(doc, ["text"], op.index)
              )) {
                if (needsFormat.get(key) === value) {
                  // Already formatted correctly.
                  needsFormat.delete(key);
                } else if (!needsFormat.has(key)) {
                  // We don't want this format - need to unmark it.
                  needsFormat.set(key, null);
                }
              }
              // Apply the needed formats.
              for (const [key, value] of needsFormat) {
                setFormat(
                  doc,
                  op.index,
                  op.index + op.insert.length,
                  key,
                  value
                );
              }
            } else {
              // Embed of object
              throw new Error("Embeds not supported");
            }
          }
          // Deletion
          else if (op.delete) {
            Automerge.splice(doc, ["text"], op.index, op.delete);
          }
          // Formatting
          else if (op.attributes && op.retain) {
            for (const [quillKey, quillValue] of Object.entries(
              op.attributes
            )) {
              const [key, value] = quillAttrToAutomerge([quillKey, quillValue]);
              setFormat(doc, op.index, op.index + op.retain, key, value);
            }
          }
        }
      });
    } finally {
      ourAutomergeChange = false;
    }
  });

  function setFormat(
    doc: Automerge.Doc<{ text: string }>,
    start: number,
    end: number,
    key: string,
    // null -> unmark operation.
    value: any
  ) {
    if (value === null) {
      console.log("unmark", { start, end, expand: getExpand(key, false), key });
      Automerge.unmark(
        doc,
        ["text"],
        { start, end, expand: getExpand(key, false) },
        key
      );
    } else {
      console.log("mark", {
        start,
        end,
        expand: getExpand(key, false),
        key,
        value,
      });
      Automerge.mark(
        doc,
        ["text"],
        { start, end, expand: getExpand(key, true) },
        key,
        value
      );
    }
  }

  /**
   * Convert delta.ops into an array of modified DeltaOperations
   * having the form { index: first char index, ...DeltaOperation},
   * leaving out ops that do nothing.
   */
  function getRelevantDeltaOperations(
    delta: DeltaStatic
  ): {
    index: number;
    insert?: string | object;
    delete?: number;
    attributes?: Record<string, any>;
    retain?: number;
  }[] {
    if (delta.ops === undefined) return [];
    const relevantOps = [];
    let index = 0;
    for (const op of delta.ops) {
      if (op.retain === undefined || op.attributes) {
        relevantOps.push({ index, ...op });
      }
      // Adjust index for the next op.
      if (op.insert !== undefined) {
        if (typeof op.insert === "string") index += op.insert.length;
        else index += 1; // Embed
      } else if (op.retain !== undefined) index += op.retain;
      // Deletes don't add to the index because we'll do the
      // next operation after them, hence the text will already
      // be shifted left.
    }
    return relevantOps;
  }

  /**
   * Converts a Quill formatting attr (key/value pair) to the format
   * we store in Automerge. null values pass through unchanged, but they
   * should use unmark() instead of mark().
   */
  function quillAttrToAutomerge(
    attr: [key: string, value: any]
  ): [key: string, value: any] {
    const [key, value] = attr;
    if (exclusiveBlocks.has(key)) {
      // Wrap it in our own "block" formatting attribute.
      // See the comment above exclusiveBlocks.
      if (value === null) return ["block", null];
      else return ["block", JSON.stringify([key, value])];
    } else {
      return [key, value];
    }
  }

  /**
   * Inverse of quillAttrToAutomerge, except acting on a whole object at a time.
   */
  function automergeAttrToQuill(
    attrs: Record<string, any>
  ): Record<string, any> {
    const ret: Record<string, any> = {};
    for (const [key, value] of Object.entries(attrs)) {
      if (key === "block") {
        // unmark() ops create a MarkPatch with a null
        // value instead of an Unmark patch.
        // So a null value is possible even though this function is only called
        // for splice & mark patches.
        if (value === null) {
          // Instead of figuring out which block key is being unmarked,
          // just ask Quill to unmark all of them.
          for (const blockKey of exclusiveBlocks) ret[blockKey] = null;
        } else {
          const [quillKey, quillValue] = JSON.parse(value) as [string, any];
          ret[quillKey] = quillValue;
        }
      } else ret[key] = value;
    }
    return ret;
  }

  // Skip presence (shared cursors) for now.
}
