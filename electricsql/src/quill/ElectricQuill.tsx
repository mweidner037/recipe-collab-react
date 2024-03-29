import { useEffect, useRef } from "react";
import { QuillWrapper } from "./quill_wrapper";

export function ElectricQuill({
  docId,
  style,
}: {
  docId: string;
  style?: React.CSSProperties;
}) {
  const quillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (quillRef.current === null) return;

    const wrapper = new QuillWrapper(quillRef.current);

    return () => wrapper.destroy();
  }, [docId]);

  return <div ref={quillRef} style={style} />;
}
