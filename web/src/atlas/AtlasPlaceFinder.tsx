import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { type AtlasMapController, type AtlasPlaceCandidate } from "./AtlasMapController";

type FinderFeedback = {
  tone: "quiet" | "error";
  message: string;
};

export function AtlasPlaceFinder({ controller }: { controller: AtlasMapController }) {
  const inputId = useId();
  const resultsId = useId();
  const feedbackId = useId();
  const activeRequest = useRef<AbortController | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [candidates, setCandidates] = useState<AtlasPlaceCandidate[]>([]);
  const [feedback, setFeedback] = useState<FinderFeedback | null>(null);

  useEffect(() => () => activeRequest.current?.abort(), []);

  const beginRequest = () => {
    activeRequest.current?.abort(new DOMException("A newer place request started.", "AbortError"));
    const request = new AbortController();
    activeRequest.current = request;
    setBusy(true);
    setFeedback({ tone: "quiet", message: "Checking the Atlas place index…" });
    return request;
  };

  const openQuery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const place = query.trim();
    if (!place || place.length > 120) {
      setCandidates([]);
      setFeedback({ tone: "error", message: "Enter a U.S. place or county in 120 characters or fewer." });
      return;
    }

    const request = beginRequest();
    try {
      const result = await controller.openPlace({ place }, request.signal);
      if (request.signal.aborted) return;
      if (result.ok) {
        setCandidates([]);
        setFeedback({ tone: "quiet", message: `Opened ${result.place.name}, ${result.place.state.toUpperCase()}.` });
      } else {
        setCandidates(result.error.candidates);
        setFeedback({ tone: "error", message: result.error.message });
      }
    } catch (error) {
      if (!request.signal.aborted) {
        setCandidates([]);
        setFeedback({ tone: "error", message: error instanceof Error ? error.message : "Atlas could not open that place." });
      }
    } finally {
      if (activeRequest.current === request) {
        activeRequest.current = null;
        setBusy(false);
      }
    }
  };

  const chooseCandidate = async (candidate: AtlasPlaceCandidate) => {
    const request = beginRequest();
    try {
      await controller.openCandidate(candidate, request.signal);
      if (request.signal.aborted) return;
      setQuery(`${candidate.name}, ${candidate.state.toUpperCase()}`);
      setCandidates([]);
      setFeedback({ tone: "quiet", message: `Opened ${candidate.name}, ${candidate.state.toUpperCase()}.` });
    } catch (error) {
      if (!request.signal.aborted) {
        setFeedback({ tone: "error", message: error instanceof Error ? error.message : "Atlas could not open that place." });
      }
    } finally {
      if (activeRequest.current === request) {
        activeRequest.current = null;
        setBusy(false);
      }
    }
  };

  return (
    <div className="atlas-app__finder" aria-busy={busy}>
      <form role="search" onSubmit={openQuery}>
        <label className="atlas-app__finder-label" htmlFor={inputId}>
          <span aria-hidden="true">Find</span>
          <span className="sr-only"> a U.S. place or county</span>
        </label>
        <input
          id={inputId}
          value={query}
          maxLength={120}
          autoComplete="off"
          enterKeyHint="search"
          spellCheck={false}
          placeholder="City or county, state"
          aria-controls={candidates.length > 0 ? resultsId : undefined}
          aria-describedby={feedback ? feedbackId : undefined}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            setCandidates([]);
            setFeedback(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setCandidates([]);
              setFeedback(null);
            }
          }}
        />
        <button type="submit" disabled={busy}>{busy ? "Wait" : "Open"}</button>
      </form>

      {feedback ? <p id={feedbackId} className="atlas-app__finder-feedback" data-tone={feedback.tone} role="status">{feedback.message}</p> : null}

      {candidates.length > 0 ? (
        <ul id={resultsId} className="atlas-app__finder-results" aria-label="Matching Atlas places">
          {candidates.map((candidate) => (
            <li key={`${candidate.kind}-${candidate.name}-${candidate.countySlug}`}>
              <button type="button" onClick={() => void chooseCandidate(candidate)}>
                <strong>{candidate.name}</strong>
                <span>{candidate.kind === "county" ? candidate.state.toUpperCase() : `${candidate.countyName}, ${candidate.state.toUpperCase()}`}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
