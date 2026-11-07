// Whether Firestore is reaching the server (US-9.5), for the offline strip. The phone's own
// online flag can't tell Wi-Fi without internet from a working connection; Firestore can.
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase.ts";

/**
 * Calls onChange(true) while Firestore's view of the recipes comes only from the offline copy
 * (`fromCache`), and onChange(false) once it is up to date with the server, now and after every
 * change. It listens to the same query as watchRecipes, so the SDK shares one server listen and
 * no documents are read twice; metadata-only changes reach only this callback, never the recipe
 * list. Members only (the rules refuse anyone else). Returns a function that stops listening.
 */
export function watchFromCache(onChange: (fromCache: boolean) => void): () => void {
  return onSnapshot(
    collection(db, "recipes"),
    { includeMetadataChanges: true },
    (snapshot) => onChange(snapshot.metadata.fromCache),
    // A listener error isn't "offline"; the recipe list reports it.
    () => {},
  );
}
