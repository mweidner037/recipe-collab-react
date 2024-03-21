import { next as A } from "@automerge/automerge";

export function getAtPath(doc: unknown, path: A.Prop[]): unknown {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let place: any = doc;
  for (const pathPart of path) {
    place = place[pathPart];
  }
  return place;
}
