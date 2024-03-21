/* eslint-disable @typescript-eslint/no-explicit-any */
import { next as A } from "@automerge/automerge";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

// Copy-modified from @collabs/react's CollabsTextInput.
// Most of the effort is in re-constructing all of the browser's usual input handling
// so that we can capture it and reflect it to the CRDT.

export type AutomergeTextInputProps = {
  doc: A.Doc<any>;
  changeDoc: (
    // Using any instead of unknown/T here to work around
    // https://github.com/automerge/automerge/issues/636#issuecomment-2011039693
    changeFn: A.ChangeFn<any>,
    options?: A.ChangeOptions<any> | undefined
  ) => void;
  path: A.Prop[];
} & Omit<
  React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >,
  "value" | "type" | "defaultValue" | "ref"
>;

/**
 * Type for AutomergeTextInput's ref.
 */
export class AutomergeTextInputHandle {
  constructor(
    private readonly input: HTMLInputElement,
    private readonly updateCursors: () => void
  ) {}

  get selectionStart(): number | null {
    return this.input.selectionStart;
  }

  set selectionStart(s: number | null) {
    this.input.selectionStart = s;
    this.updateCursors();
  }

  get selectionEnd(): number | null {
    return this.input.selectionEnd;
  }

  set selectionEnd(s: number | null) {
    this.input.selectionEnd = s;
    this.updateCursors();
  }

  get selectionDirection() {
    return this.input.selectionDirection;
  }

  set selectionDirection(s: "forward" | "backward" | "none" | null) {
    this.input.selectionDirection = s;
    this.updateCursors();
  }

  setSelectionRange(
    start: number | null,
    end: number | null,
    direction?: "forward" | "backward" | "none" | undefined
  ) {
    this.input.setSelectionRange(start, end, direction);
    this.updateCursors();
  }

  select() {
    this.input.select();
    // No need to updateCursors - the onSelect handler will do that.
  }

  blur() {
    this.input.blur();
  }

  click() {
    this.input.click();
  }

  focus() {
    this.input.focus();
  }

  scrollIntoView() {
    this.input.scrollIntoView();
  }
}

/**
 * An `<input type="text" />` component that syncs its state to an Automerge string,
 * provided by the `doc` and `path` props.
 *
 * Local changes update the doc collaboratively, and remote updates to the doc
 * show up in the input field. We also manage the local selection in the
 * usual way for collaborative text editing.
 *
 * ## Props
 *
 * - doc, changeDoc: From useDocument hook.
 * - path: Path to the text string within doc.
 * - Otherwise the same as HTMLInputElement, except we omit a few
 * that don't make sense (`value`, `defaultValue`, `type`).
 *
 * ## Advanced usage
 *
 * - To change the text programmatically, mutate the doc's text and trigger a re-render.
 * - You may intercept and prevent events like `onKeyDown`.
 * - We expose a number of `<input>` methods through our ref
 * (AutomergeTextInputHandle), including
 * the ability to set `selectionStart` / `selectionEnd`. Once set,
 * the selection will move around as usual.
 */
export const AutomergeTextInput = forwardRef<
  AutomergeTextInputHandle,
  AutomergeTextInputProps
>(function AutomergeTextInput(props, ref) {
  const { doc, changeDoc, path, ...other } = props;

  const textValue: string = (function () {
    let place: any = doc;
    for (const pathPart of path) {
      place = place[pathPart];
    }
    return place;
  })();

  /**
   * Workaround for https://github.com/automerge/automerge/issues/881 :
   * Represent a cursor at the end of the text as null.
   */
  function getCursor(index: number): A.Cursor | null {
    return index === textValue.length ? null : A.getCursor(doc, path, index);
  }
  function getCursorPosition(cursor: A.Cursor | null): number {
    return cursor === null
      ? textValue.length
      : A.getCursorPosition(doc, path, cursor);
  }

  const [startCursor, setStartCursor] = useState<A.Cursor | null>(getCursor(0));
  const [endCursor, setEndCursor] = useState<A.Cursor | null>(getCursor(0));
  const [direction, setDirection] = useState<
    "none" | "forward" | "backward" | null
  >(null);
  useLayoutEffect(() => {
    // Update the selection to match startCursor and endCursor.
    // We useLayoutEffect because rerendering with a changed
    // value causes the cursor to jump to the end, which is briefly visible
    // if you useEffect.
    if (inputRef.current === null) return;
    inputRef.current.selectionStart = getCursorPosition(startCursor);
    inputRef.current.selectionEnd = getCursorPosition(endCursor);
    inputRef.current.selectionDirection = direction;
  });

  // Updates startCursor and endCursor to match the current selection.
  function updateCursors() {
    if (inputRef.current === null) return;

    setStartCursor(getCursor(inputRef.current.selectionStart ?? 0));
    setEndCursor(getCursor(inputRef.current.selectionEnd ?? 0));
    setDirection(inputRef.current.selectionDirection);
  }

  // Whether we should type e.key.
  function shouldType(e: React.KeyboardEvent<HTMLInputElement>): boolean {
    return e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
  }

  // Types str with the given selection.
  function type(str: string, startIndex: number, endIndex: number) {
    changeDoc((doc) =>
      A.splice(doc, path, startIndex, endIndex - startIndex, str)
    );
    setStartCursor(getCursor(startIndex + str.length));
    setEndCursor(getCursor(startIndex + str.length));
  }

  const inputRef = useRef<HTMLInputElement | null>(null);
  useImperativeHandle(
    ref,
    () => new AutomergeTextInputHandle(inputRef.current!, updateCursors)
  );

  /**
   * React appears to give us an onSelect event after we mutate the text,
   * but that confuses our cursor tracking.
   * Use this ref to skip those events (first onSelect after each text mutation).
   */
  const skipNextSelect = useRef(false);
  useEffect(() => {
    skipNextSelect.current = true;
  }, [textValue]);

  return (
    <input
      {...other}
      type="text"
      ref={inputRef}
      value={textValue}
      onChange={
        props.onChange ??
        (() => {
          // Add dummy onChange to prevent React readonly complaints (invalid
          // because we edit on keypress using a ref).
        })
      }
      onSelect={(e) => {
        if (skipNextSelect.current) {
          skipNextSelect.current = false;
          return;
        }

        if (props.onSelect) {
          props.onSelect(e);
          if (e.defaultPrevented) return;
        }

        updateCursors();
      }}
      onKeyDown={(e) => {
        if (props.onKeyDown) {
          props.onKeyDown(e);
          if (e.defaultPrevented) return;
        }
        if (props.readOnly || props.disabled) return;

        const startIndex = getCursorPosition(startCursor);
        const endIndex = getCursorPosition(endCursor);
        if (e.key === "Backspace") {
          if (endIndex > startIndex) {
            A.splice(doc, path, startIndex, endIndex - startIndex);
            setEndCursor(getCursor(startIndex));
          } else if (endIndex === startIndex && startIndex > 0) {
            A.splice(doc, path, startIndex - 1, 1);
            setStartCursor(getCursor(startIndex - 1));
          }
        } else if (e.key === "Delete") {
          if (endIndex > startIndex) {
            A.splice(doc, path, startIndex, endIndex - startIndex);
            setEndCursor(getCursor(startIndex));
          } else if (endIndex === startIndex && startIndex < textValue.length) {
            A.splice(doc, path, startIndex, 1);
          }
        } else if (shouldType(e)) {
          type(e.key, startIndex, endIndex);
        } else {
          // Other events we let happen normally (don't preventDefault).
          // These include selection changes (handled by onSelect), enter/tab
          // (which just change focus, don't add text), Ctrl cut/paste
          // (handled in their own listeners), and Ctrl copy (default behavior
          // is fine).
          return;
        }

        // Don't let the browser type the key - we did it for them.
        e.preventDefault();
      }}
      onPaste={(e) => {
        if (props.onPaste) {
          props.onPaste(e);
          if (e.defaultPrevented) return;
        }
        if (props.readOnly || props.disabled) return;

        if (e.clipboardData) {
          const startIndex = getCursorPosition(startCursor);
          const endIndex = getCursorPosition(endCursor);
          const pasted = e.clipboardData.getData("text");
          type(pasted, startIndex, endIndex);
        }
        e.preventDefault();
      }}
      onCut={(e) => {
        if (props.onCut) {
          props.onCut(e);
          if (e.defaultPrevented) return;
        }
        if (props.readOnly || props.disabled) return;

        const startIndex = getCursorPosition(startCursor);
        const endIndex = getCursorPosition(endCursor);
        if (startIndex < endIndex) {
          const selected = textValue.slice(startIndex, endIndex);
          void navigator.clipboard.writeText(selected);
          A.splice(doc, path, startIndex, endIndex - startIndex);
        }
        e.preventDefault();
      }}
      onDrop={(e) => {
        if (props.onDrop) props.onDrop(e);
        else {
          // I don't know how to get the cursor position to drop on,
          // so for now we just disable drop. But a caller can override
          // onDrop and update the CText themselves.
          e.preventDefault();
        }
      }}
    />
  );
});
