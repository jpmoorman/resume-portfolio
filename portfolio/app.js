const scenarios = {
  approval: {
    title: "Approval blocker detected",
    copy:
      "A controlled document is waiting on two reviewers and the delay will block a production traveler release within 48 hours.",
    action:
      "Send a targeted reminder to the responsible reviewers, notify the workflow owner, and add the item to the daily risk dashboard until cleared.",
    log: [
      "Matched document status against active production release timing.",
      "Classified risk as schedule-blocking because the traveler depends on the approved source document.",
      "Generated reviewer-specific next steps instead of a broad reminder.",
      "Recorded escalation path and follow-up date for human review."
    ]
  },
  shipment: {
    title: "Shipment correction risk",
    copy:
      "A batch of orders has routing and pick-state mismatches similar to prior errors that created overnight shipping exposure.",
    action:
      "Pause the affected batch for correction review, surface the mismatch reason, and route the exception to the distribution lead before carrier cutoff.",
    log: [
      "Compared current order metadata to known exception patterns.",
      "Prioritized records by carrier cutoff and customer-impact risk.",
      "Produced a correction queue with the most likely root cause.",
      "Captured outcome so the rule can be tuned after review."
    ]
  },
  docs: {
    title: "Controlled document lookup",
    copy:
      "A frontline user needs the correct approved source document for a job without searching across local files, emails, or disconnected systems.",
    action:
      "Use job metadata to retrieve the approved document, show source-system context, and block use of outdated local copies.",
    log: [
      "Read job metadata and matched it to approved source records.",
      "Filtered out uncontrolled local copies and stale revisions.",
      "Displayed the current approved document in the workflow surface.",
      "Logged lookup context for traceability and future workflow improvements."
    ]
  }
};

const buttons = document.querySelectorAll(".scenario-button");
const title = document.querySelector("#scenario-title");
const copy = document.querySelector("#scenario-copy");
const action = document.querySelector("#scenario-action");
const log = document.querySelector("#scenario-log");

function renderScenario(name) {
  const scenario = scenarios[name];
  title.textContent = scenario.title;
  copy.textContent = scenario.copy;
  action.textContent = scenario.action;
  log.innerHTML = "";

  scenario.log.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    log.appendChild(li);
  });

  buttons.forEach((button) => {
    button.classList.toggle("active", button.dataset.scenario === name);
  });
}

buttons.forEach((button) => {
  button.addEventListener("click", () => renderScenario(button.dataset.scenario));
});

renderScenario("approval");
