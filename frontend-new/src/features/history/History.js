import { el, fragment, viewState } from "../../ui/view.js";
import { Link } from "../../ui/navigation.js";
import { useQuery } from "../../ui/queries.js";
import {
  ClockCounterClockwise,
  MagnifyingGlass,
  ArrowUpRight,
} from "../../ui/icons.js";
import { useAuth } from "../auth/AuthProvider.js";
import { history, PAGE_SIZE } from "../../lib/records.js";
import { message, percent, screeningOutcome } from "../../lib/contracts.js";
import {
  ActionLink,
  ErrorNotice,
  Loading,
  PageTitle,
} from "../../components/ui/Common.js";
export default function History() {
  const { session } = useAuth();
  const [page, setPage] = viewState("History:page", 0);
  const [search, setSearch] = viewState("History:search", "");
  const [filter, setFilter] = viewState("History:filter", "");
  const [draft, setDraft] = viewState("History:draft", "");
  const query = useQuery({
    queryKey: ["history", session.user.id, page, search, filter],
    queryFn: () => history(session.user.id, page, search, filter),
  });
  return el(
    fragment,
    null,
    el(
      PageTitle,
      {
        eyebrow: "Your saved work",
        title: "Screening history",
        action: el(ActionLink, { to: "/upload" }, "Start a screening"),
      },
      "Revisit results you chose to save. Images are available only when retained.",
    ),
    el(
      "div",
      { className: "history-controls" },
      el(
        "form",
        {
          onSubmit: (e) => {
            e.preventDefault();
            setPage(0);
            setSearch(draft);
          },
          className: "search-form",
        },
        el(
          "label",
          { className: "sr-only", htmlFor: "history-search" },
          "Search by subject",
        ),
        el(MagnifyingGlass, { size: 20 }),
        el("input", {
          id: "history-search",
          value: draft,
          onChange: (e) => setDraft(e.target.value),
          placeholder: "Search by subject",
        }),
        el("button", { className: "btn btn--secondary" }, "Search"),
      ),
      el(
        "label",
        { className: "filter-label", htmlFor: "category-filter" },
        "Result",
        el(
          "select",
          {
            id: "category-filter",
            value: filter,
            onChange: (e) => {
              setFilter(e.target.value);
              setPage(0);
            },
          },
          el("option", { value: "" }, "All results"),
          el("option", { value: "Elevated" }, screeningOutcome("Elevated")),
          el("option", { value: "Typical" }, screeningOutcome("Typical")),
        ),
      ),
    ),
    query.isPending
      ? el(Loading, { text: "Loading saved screenings\u2026" })
      : query.error
        ? el(
            ErrorNotice,
            null,
            message(query.error),
            " ",
            el(
              "button",
              { className: "text-link", onClick: () => query.refetch() },
              "Retry loading",
            ),
          )
        : el(
            fragment,
            null,
            query.data.rows.length
              ? el(RecordTable, { rows: query.data.rows })
              : el(EmptyHistory, { filtered: Boolean(search || filter) }),
            el(
              "div",
              { className: "pagination" },
              el(
                "span",
                null,
                query.data.count,
                " saved",
                " ",
                query.data.count === 1 ? "record" : "records",
                search || filter ? " matching your filters" : "",
              ),
              el(
                "div",
                null,
                el(
                  "button",
                  {
                    className: "btn btn--secondary",
                    disabled: page === 0,
                    onClick: () => setPage(page - 1),
                  },
                  "Previous",
                ),
                el("span", null, "Page ", page + 1),
                el(
                  "button",
                  {
                    className: "btn btn--secondary",
                    disabled: (page + 1) * PAGE_SIZE >= query.data.count,
                    onClick: () => setPage(page + 1),
                  },
                  "Next",
                ),
              ),
            ),
          ),
  );
}
export function RecordTable({ rows }) {
  return el(
    "div",
    { className: "record-table" },
    el(
      "div",
      { className: "record-table-heading" },
      el("span", null, "Subject / image"),
      el("span", null, "Result"),
      el("span", null, "Score"),
      el("span", null, "Date"),
      el("span", null),
    ),
    rows.map((row) =>
      el(
        Link,
        { to: `/result/${row.id}`, key: row.id, className: "record-row" },
        el(
          "div",
          null,
          el(
            "strong",
            null,
            row.subject || row.filename || "Handwriting image",
          ),
          el("small", { className: "mono" }, row.id.slice(0, 8)),
        ),
        el(
          "span",
          {
            className: `tag ${row.category === "Elevated" ? "warning" : "neutral"}`,
          },
          screeningOutcome(row.category),
        ),
        el(
          "span",
          { className: "row-score" },
          row.risk_percentage == null
            ? "Unavailable"
            : percent(Number(row.risk_percentage)),
        ),
        el(
          "span",
          { className: "row-date" },
          new Date(row.created_at || row.date).toLocaleDateString(),
        ),
        el(ArrowUpRight, { size: 20, "aria-hidden": "true" }),
      ),
    ),
  );
}
export function EmptyHistory({ filtered = false }) {
  return el(
    "div",
    { className: "empty-state" },
    el(
      "span",
      { className: "empty-icon" },
      el(ClockCounterClockwise, { size: 36, weight: "light" }),
    ),
    el(
      "h2",
      null,
      filtered ? "No matching screenings." : "Your next review starts here.",
    ),
    el(
      "p",
      null,
      filtered
        ? "Try another subject or select all patterns."
        : "Saved screenings will appear here. Start with a handwriting image whenever you are ready.",
    ),
    !filtered && el(ActionLink, { to: "/upload" }, "Start a screening"),
  );
}
export function Dashboard() {
  const { session } = useAuth();
  const query = useQuery({
    queryKey: ["history", session.user.id, "recent"],
    queryFn: () => history(session.user.id),
  });
  return el(
    fragment,
    null,
    el(
      PageTitle,
      {
        eyebrow: "Your handwriting review workspace",
        title: "Every page deserves a closer look.",
        action: el(ActionLink, { to: "/upload" }, "Start a screening"),
      },
      "Upload handwriting, review the model's signal, and keep the results that matter to your work.",
    ),
    el(
      "div",
      { className: "overview-intro" },
      el(
        "div",
        { className: "overview-image", "aria-hidden": "true" },
        el("img", {
          src: "/assets/images/dashboard-1024.webp",
          srcSet:
            "/assets/images/dashboard-640.webp 640w, /assets/images/dashboard-768.webp 768w, /assets/images/dashboard-1024.webp 1024w",
          sizes: "(max-width: 639px) 88vw, 45vw",
          width: 1024,
          height: 683,
          alt: "",
        }),
      ),
      el(
        "ol",
        { className: "overview-steps" },
        el(
          "li",
          null,
          el("span", null, "01"),
          el(
            "div",
            null,
            el("h3", null, "Choose your image"),
            el("p", null, "Review a clear page of handwriting."),
          ),
        ),
        el(
          "li",
          null,
          el("span", null, "02"),
          el(
            "div",
            null,
            el("h3", null, "Inspect the signal"),
            el("p", null, "View the score and available explanations."),
          ),
        ),
        el(
          "li",
          null,
          el("span", null, "03"),
          el(
            "div",
            null,
            el("h3", null, "Keep your review"),
            el("p", null, "Save a result or generate a report."),
          ),
        ),
      ),
    ),
    el(
      "div",
      { className: "section-title" },
      el("h2", null, "Recent screenings"),
      el(
        Link,
        { to: "/history", className: "text-link" },
        "View history ",
        el(ArrowUpRight, { size: 18 }),
      ),
    ),
    query.isPending
      ? el(Loading, null)
      : query.error
        ? el(
            ErrorNotice,
            null,
            message(query.error),
            " ",
            el(
              "button",
              { className: "text-link", onClick: () => query.refetch() },
              "Retry loading",
            ),
          )
        : query.data.rows.length
          ? el(
              fragment,
              null,
              el(
                "p",
                { className: "small muted" },
                query.data.count,
                " saved screenings in your workspace",
              ),
              el(RecordTable, { rows: query.data.rows.slice(0, 5) }),
            )
          : el(EmptyHistory, null),
  );
}
