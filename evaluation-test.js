
const F1_ITEMS = [
    "The sketch shows a connection with nipa.",
    "The cultural presentation seems respectful to me.",
    "The name or logo is easy to identify.",
    "The text shown is readable.",
    "The colours and lettering work well together.",
    "The information identifies the intended product as Laksoy.",
    "The intended package shape is clear.",
    "The layout of the package parts is easy to understand.",
    "The intended opening or access is clear in the drawing.",
    "The planned label placement is clear.",
    "The drawing is clear enough for me to judge the visible design.",
    "The visible design elements look consistent with one another."
];

const F1_SCALE = [
    { value: "1", label: "1 - Strongly disagree" },
    { value: "2", label: "2 - Disagree" },
    { value: "3", label: "3 - Neither agree nor disagree" },
    { value: "4", label: "4 - Agree" },
    { value: "5", label: "5 - Strongly agree" },
    { value: "CJ", label: "CJ - Cannot judge" }
];

// Draft storage is limited to the current browser tab session.
const F1_STORAGE_KEY =
    "project_lakas_f1_session_draft_v2";

// Remove the old persistent draft, which could contain
// respondent codes or other information from earlier tests.
try {
    localStorage.removeItem("project_lakas_f1_draft_v1");
} catch (error) {
    // Continue if browser storage is unavailable.
}

// Create an empty draft.
function createEmptyF1Draft() {
    return {
        designs: {}
    };
}

// Load the current session's draft.
function loadF1Draft() {
    try {
        const saved =
            sessionStorage.getItem(F1_STORAGE_KEY);

        if (!saved) {
            return createEmptyF1Draft();
        }

        const parsed = JSON.parse(saved);

        return {
            designs:
                parsed.designs &&
                typeof parsed.designs === "object" &&
                !Array.isArray(parsed.designs)
                    ? parsed.designs
                    : {}
        };

    } catch (error) {
        return createEmptyF1Draft();
    }
}

// Working copy of the responses.
let f1Draft = loadF1Draft();

// Track which designs have been viewed during this session.
const F1_VISITED_KEY =
    "project_lakas_f1_visited_v1";

// Load previously viewed designs.
function loadF1VisitedDesigns() {
    try {
        const saved = JSON.parse(
            sessionStorage.getItem(F1_VISITED_KEY) || "[]"
        );

        if (!Array.isArray(saved)) {
            return [];
        }

        return saved.filter(code =>
            EVALUATION_CONFIG.sketchOrder.includes(code)
        );

    } catch (error) {
        return [];
    }
}

// Working list of viewed designs.
let f1VisitedDesigns = loadF1VisitedDesigns();

// Update the final submission section.

function updateF1SubmissionStatus() {
    const section =
        document.getElementById("submissionSection");

    const status =
        document.getElementById("completionStatus");

    const reviewButton =
        document.getElementById("reviewResponsesButton");

    const submitButton =
        document.getElementById("submitEvaluationButton");

    const total =
        EVALUATION_CONFIG.sketchOrder.length;

    const visited =
        EVALUATION_CONFIG.sketchOrder.filter(
            code => f1VisitedDesigns.includes(code)
        ).length;

    const allViewed = visited === total;

    if (section) {
        section.hidden = !allViewed;
    }

    if (status) {
        status.textContent = allViewed
            ? "All five design presentations have been viewed. You may now review your responses."
            : `${visited} of ${total} design presentations viewed.`;
    }

    if (reviewButton) {
        reviewButton.disabled = !allViewed;
    }

    if (submitButton) {
        submitButton.disabled = !allViewed;
    }
}

// Record a design as viewed.
function markF1DesignVisited(sketchCode) {
    if (
        !EVALUATION_CONFIG.sketchOrder.includes(sketchCode)
    ) {
        return;
    }

    if (!f1VisitedDesigns.includes(sketchCode)) {
        f1VisitedDesigns.push(sketchCode);

        try {
            sessionStorage.setItem(
                F1_VISITED_KEY,
                JSON.stringify(f1VisitedDesigns)
            );
        } catch (error) {
            // Continue without session tracking if storage fails.
        }
    }

    updateF1SubmissionStatus();
}

// Save the current draft to session storage.
function saveF1DraftToStorage() {
    try {
        sessionStorage.setItem(
            F1_STORAGE_KEY,
            JSON.stringify(f1Draft)
        );

        return true;

    } catch (error) {
        return false;
    }
}

// Update the progress indicator.
function updateF1Progress(root) {
    if (!root) return;

    const answered = F1_ITEMS.filter((item, index) => {
        const itemNumber =
            String(index + 1).padStart(2, "0");

        return root.querySelector(
            `input[name="item_${itemNumber}"]:checked`
        );
    }).length;

    const progressFill =
        root.querySelector("#progressFill");

    const progressText =
        root.querySelector("#progressText");

    if (progressFill) {
        progressFill.style.width =
            (answered / F1_ITEMS.length * 100) + "%";
    }

    if (progressText) {
        progressText.textContent =
            `${answered} of ${F1_ITEMS.length} answered`;
    }
}

// Save the currently displayed design.
function saveCurrentF1Answers(sketchCode, position) {
    const root =
        document.getElementById("questionnaire");

    if (!root) return;

    const designAnswers = {};

    F1_ITEMS.forEach((item, index) => {
        const itemNumber =
            String(index + 1).padStart(2, "0");

        const selectedAnswer = root.querySelector(
            `input[name="item_${itemNumber}"]:checked`
        );

        designAnswers[`item_${itemNumber}`] =
            selectedAnswer ? selectedAnswer.value : "";
    });

    designAnswers.worksWell =
        root.querySelector("#worksWell")?.value || "";

    designAnswers.improvements =
        root.querySelector("#improvements")?.value || "";

    designAnswers.presentationPosition = position;

    f1Draft.designs[sketchCode] = designAnswers;

    const saved = saveF1DraftToStorage();

    const saveStatus =
        root.querySelector("#saveStatus");

    if (saveStatus) {
        saveStatus.textContent = saved
            ? "Draft saved for this browser tab session."
            : "Unable to save this draft. Your current answers remain available while this page stays open.";
    }

        updateF1Progress(root);

    // If the Response Review is open, refresh it
    // so it shows the newest answers.
    const openReviewPanel =
        document.getElementById("responseReviewPanel");

    if (openReviewPanel && !openReviewPanel.hidden) {
        showF1ResponseReview();
    }
}

// Generate the questionnaire.
function renderF1Questionnaire(sketchCode, position) {
    const root =
        document.getElementById("questionnaire");

    if (!root) return;

    const material =
        EVALUATION_CONFIG.materials[sketchCode];

    if (!material) return;
markF1DesignVisited(sketchCode);
    const savedDesignAnswers =
        f1Draft.designs[sketchCode] || {};

    root.innerHTML = `
        <div class="panel-heading">
            <h2>F1 Packaging Design Evaluation</h2>

            <p>
                Examine the displayed packaging sketch and
                provide your assessment using the rating
                scale below.
            </p>
        </div>

        <div class="design-summary">
            <div class="design-name">
                ${material.name}
            </div>

            <div class="design-position">
                Design ${position} of 5 · ${sketchCode}
            </div>
        </div>

        <div class="progress-section">
            <div class="progress-label">
                <span>Questionnaire progress</span>
                <span id="progressText">0 of 12 answered</span>
            </div>

            <div
                class="progress-track"
                role="progressbar"
                aria-label="Questionnaire completion"
                aria-valuemin="0"
                aria-valuemax="12"
                aria-valuenow="0"
                id="progressTrack"
            >
                <div
                    class="progress-fill"
                    id="progressFill"
                ></div>
            </div>
        </div>

        <h3 class="section-heading">
            Evaluation Statements
        </h3>

        <p class="section-description">
            Select one response for each statement.
            You may leave an item unanswered or select
            CJ when you cannot judge.
        </p>

        <div id="f1Questions"></div>

        <h3 class="section-heading">
            Written Feedback
        </h3>

        <p class="section-description">
            Share your observations and suggestions
            about the displayed design.
        </p>

        <div class="comment-card">
            <label for="worksWell">
                What Works Well?
            </label>

            <textarea
                id="worksWell"
                name="worksWell"
                placeholder="Describe the strengths or features you appreciate in this design."
            ></textarea>
        </div>

        <div class="comment-card">
            <label for="improvements">
                Suggested Improvements
            </label>

            <textarea
                id="improvements"
                name="improvements"
                placeholder="Describe any changes or improvements you would recommend."
            ></textarea>
        </div>

        <div
            class="save-status"
            id="saveStatus"
            role="status"
            aria-live="polite"
        >
            Your answers will be saved during this browser tab session.
        </div>
    `;

    const questions =
        root.querySelector("#f1Questions");

    // Generate the 12 evaluation statements.
    F1_ITEMS.forEach((item, index) => {
        const itemNumber =
            String(index + 1).padStart(2, "0");

        const section =
            document.createElement("fieldset");

        section.className = "question-card";

        const legend =
            document.createElement("legend");

        const number =
            document.createElement("span");

        number.className = "question-number";
        number.textContent = itemNumber + ".";

        legend.appendChild(number);
        legend.appendChild(
            document.createTextNode(" " + item)
        );

        section.appendChild(legend);

        const options =
            document.createElement("div");

        options.className = "answer-options";

        F1_SCALE.forEach(option => {
            const label =
                document.createElement("label");

            const radio =
                document.createElement("input");

            radio.type = "radio";
            radio.name = `item_${itemNumber}`;
            radio.value = option.value;

            const text =
                document.createElement("span");

            text.textContent = option.label;

            label.appendChild(radio);
            label.appendChild(text);

            options.appendChild(label);
        });

        section.appendChild(options);
        questions.appendChild(section);
    });

    // Restore saved answers for this design.
    F1_ITEMS.forEach((item, index) => {
        const itemNumber =
            String(index + 1).padStart(2, "0");

        const savedValue =
            savedDesignAnswers[`item_${itemNumber}`];

        if (!savedValue) return;

        const radioOptions = root.querySelectorAll(
            `input[name="item_${itemNumber}"]`
        );

        radioOptions.forEach(radio => {
            if (radio.value === savedValue) {
                radio.checked = true;
            }
        });
    });

    // Restore written comments.
    root.querySelector("#worksWell").value =
        savedDesignAnswers.worksWell || "";

    root.querySelector("#improvements").value =
        savedDesignAnswers.improvements || "";

    // Restore the progress indicator.
    updateF1Progress(root);

    // Display the current save state.
    const saveStatus =
        root.querySelector("#saveStatus");

    if (Object.keys(savedDesignAnswers).length > 0) {
        saveStatus.textContent =
            "Previously saved answers restored for this browser tab session.";
    }


    // Save written comments as participants type.
    root.oninput = function (event) {
        if (
            event.target.matches("#worksWell, #improvements")
        ) {
            saveCurrentF1Answers(sketchCode, position);
        }
    };

    // Save selected radio answers when changed.
    root.onchange = function (event) {
        if (
            event.target.matches('input[type="radio"]')
        ) {
            saveCurrentF1Answers(sketchCode, position);
        }
    };
}


// Generate or retrieve the anonymous retry token.
function getF1RetryToken() {
    const key = "project_lakas_f1_retry_token_v1";

    let token = sessionStorage.getItem(key);

    if (!token) {
        if (
            !window.crypto ||
            !window.crypto.getRandomValues
        ) {
            throw new Error(
                "Secure random token generation is unavailable."
            );
        }

        const bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);

        // Set UUID version 4 and variant bits.
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        const hex = Array.from(bytes, byte =>
            byte.toString(16).padStart(2, "0")
        );

        token = [
            hex.slice(0, 4).join(""),
            hex.slice(4, 6).join(""),
            hex.slice(6, 8).join(""),
            hex.slice(8, 10).join(""),
            hex.slice(10, 16).join("")
        ].join("-");

        sessionStorage.setItem(key, token);
    }

    return token;
}


// Prepare all five designs for submission.
function createF1SubmissionPayload() {
    const designs = {};

    EVALUATION_CONFIG.sketchOrder.forEach(
        (code, index) => {

            const saved =
                f1Draft.designs[code] || {};

            const answers = {};

            // Include all 12 answers, even if unanswered.
            for (let i = 1; i <= 12; i++) {
                const itemNumber =
                    String(i).padStart(2, "0");

                answers[`item_${itemNumber}`] =
                    saved[`item_${itemNumber}`] || "";
            }

            designs[code] = {
                ...answers,

                worksWell:
                    saved.worksWell || "",

                improvements:
                    saved.improvements || "",

                presentationPosition: index + 1
            };
        }
    );

    return {
        retryToken: getF1RetryToken(),
        designs: designs
    };
}

// Display a visual review of all five design responses.
function showF1ResponseReview() {
    const submissionSection =
        document.getElementById("submissionSection");

    if (!submissionSection) return null;

    let reviewPanel =
        document.getElementById("responseReviewPanel");

    if (!reviewPanel) {
        reviewPanel = document.createElement("div");
        reviewPanel.id = "responseReviewPanel";
        reviewPanel.className = "response-review-panel";

        submissionSection.appendChild(reviewPanel);
    }

    // Remember which design card is open, so it can be reopened.
    const previouslyOpenCard =
        reviewPanel.querySelector("details[open]");

    const previouslyOpenCode =
        previouslyOpenCard
            ? previouslyOpenCard.dataset.code
            : null;

    reviewPanel.replaceChildren();

    // Prepare designs in presentation order.
    const designs = EVALUATION_CONFIG.sketchOrder
        .map((code, index) => ({
            code,
            position: index + 1,
            answers: f1Draft.designs[code] || {}
        }));

    // Calculate overall response totals.
    let answeredCount = 0;
    let cannotJudgeCount = 0;
    let unansweredCount = 0;

    designs.forEach(({ answers }) => {
        F1_ITEMS.forEach((item, index) => {
            const itemNumber =
                String(index + 1).padStart(2, "0");

            const value =
                answers[`item_${itemNumber}`] || "";

            if (value === "CJ") {
                cannotJudgeCount++;
            } else if (["1", "2", "3", "4", "5"].includes(value)) {
                answeredCount++;
            } else {
                unansweredCount++;
            }
        });
    });

    // Main heading.
    const heading = document.createElement("h3");
    heading.textContent = "Response Review";
    reviewPanel.appendChild(heading);

    const description = document.createElement("p");
    description.textContent =
        "Check your answers for each design. Select a design card to expand or collapse its responses.";
    reviewPanel.appendChild(description);

    // Overall response summary.
    const summary = document.createElement("div");

    summary.style.display = "grid";
    summary.style.gridTemplateColumns =
        "repeat(auto-fit, minmax(110px, 1fr))";
    summary.style.gap = "10px";
    summary.style.margin = "16px 0";

    const summaryItems = [
        {
            label: "Answered",
            value: answeredCount
        },
        {
            label: "Cannot Judge",
            value: cannotJudgeCount
        },
        {
            label: "Unanswered",
            value: unansweredCount
        }
    ];

    summaryItems.forEach(item => {
        const card = document.createElement("div");

        card.style.padding = "14px";
        card.style.border = "1px solid #d0d0d0";
        card.style.borderRadius = "8px";
        card.style.textAlign = "center";

        const number = document.createElement("strong");
        number.textContent = item.value;
        number.style.display = "block";
        number.style.fontSize = "24px";

        const label = document.createElement("span");
        label.textContent = item.label;
        label.style.fontSize = "12px";

        card.append(number, label);
        summary.appendChild(card);
    });

    reviewPanel.appendChild(summary);

    // Create five collapsible design cards.
    let openCard = null;

        designs.forEach(({ code, position, answers }) => {
        const material =
            EVALUATION_CONFIG.materials[code];

        const card = document.createElement("details");
        card.dataset.code = code;

        card.style.border = "1px solid #d0d0d0";
        card.style.borderRadius = "8px";
        card.style.marginBottom = "12px";
        card.style.padding = "12px";

        const cardHeading = document.createElement("summary");

        cardHeading.style.cursor = "pointer";
        cardHeading.style.fontWeight = "600";

        cardHeading.textContent =
            `${position} of 5 — ${material.name} (${code})`;

        card.appendChild(cardHeading);

        // Ensure only one design card is expanded at a time.
        card.addEventListener("toggle", () => {
            if (card.open) {
                if (openCard && openCard !== card) {
                    openCard.open = false;
                }

                openCard = card;
            } else if (openCard === card) {
                openCard = null;
            }
        });

        // Individual questionnaire responses.
        const answerContainer =
            document.createElement("div");

        answerContainer.style.marginTop = "14px";

        F1_ITEMS.forEach((item, index) => {
            const itemNumber =
                String(index + 1).padStart(2, "0");

            const value =
                answers[`item_${itemNumber}`] || "";

            const option =
                F1_SCALE.find(entry => entry.value === value);

            const answerRow =
                document.createElement("div");

            answerRow.style.display = "flex";
            answerRow.style.justifyContent = "space-between";
            answerRow.style.alignItems = "center";
            answerRow.style.gap = "12px";
            answerRow.style.padding = "10px 0";
            answerRow.style.borderBottom =
                "1px solid #e5e5e5";

            const question = document.createElement("span");

            question.style.flex = "1";
            question.style.fontSize = "13px";

            question.textContent =
                `${itemNumber}. ${item}`;

            const answerBadge =
                document.createElement("span");

            answerBadge.style.padding = "5px 9px";
            answerBadge.style.borderRadius = "6px";
            answerBadge.style.fontSize = "12px";
            answerBadge.style.fontWeight = "600";
            answerBadge.style.whiteSpace = "nowrap";

            if (value === "CJ") {
                answerBadge.textContent = "CJ";
                answerBadge.style.background = "#fff1cc";
                answerBadge.style.color = "#805500";
            } else if (["1", "2", "3", "4", "5"].includes(value)) {
                answerBadge.textContent = value;
                answerBadge.style.background = "#e5f0e8";
                answerBadge.style.color = "#245b35";
            } else {
                answerBadge.textContent = "Not answered";
                answerBadge.style.background = "#eeeeee";
                answerBadge.style.color = "#555555";
            }

            answerRow.append(question, answerBadge);
            answerContainer.appendChild(answerRow);
        });

        card.appendChild(answerContainer);

        // Written feedback.
        const feedbackHeading =
            document.createElement("h4");

        feedbackHeading.textContent = "Written Feedback";
        feedbackHeading.style.marginTop = "18px";

        card.appendChild(feedbackHeading);

        const feedbackItems = [
            {
                label: "What Works Well?",
                value: answers.worksWell
            },
            {
                label: "Suggested Improvements",
                value: answers.improvements
            }
        ];

        feedbackItems.forEach(item => {
            const feedbackBox =
                document.createElement("div");

            feedbackBox.style.background = "#f5f5f5";
            feedbackBox.style.padding = "12px";
            feedbackBox.style.borderRadius = "6px";
            feedbackBox.style.marginBottom = "10px";

            const label = document.createElement("strong");
            label.textContent = item.label;

            const response = document.createElement("p");
            response.textContent =
                item.value || "No comment provided.";

            response.style.marginBottom = "0";
            response.style.fontSize = "13px";

            feedbackBox.append(label, response);
            card.appendChild(feedbackBox);
        });

        reviewPanel.appendChild(card);

        if (code === previouslyOpenCode) {
            card.open = true;
        }
    });

    reviewPanel.hidden = false;

    return reviewPanel;
}

// Connect the Review Responses button.
const reviewResponsesButton =
    document.getElementById("reviewResponsesButton");


if (reviewResponsesButton) {
    reviewResponsesButton.addEventListener("click", () => {
        const reviewPanel =
            document.getElementById("responseReviewPanel");

        if (reviewPanel && !reviewPanel.hidden) {
            reviewPanel.hidden = true;

            reviewResponsesButton.textContent =
                "Review Responses";

            return;
        }

        const newReviewPanel = showF1ResponseReview();

        if (newReviewPanel) {
            reviewResponsesButton.textContent =
                "Hide Response Review";

            newReviewPanel.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
}

/*
 * PROJECT L.A.K.A.S.
 * Apps Script Bridge Connection
 */

(function setupF1Bridge() {

    const bridgeFrame =
        document.getElementById("f1SubmissionBridge");

    if (!bridgeFrame) {
        console.error(
            "F1 Submission Bridge iframe not found."
        );
        return;
    }

    const allowedOrigins = new Set([
        "https://script.google.com",
        "https://script.googleusercontent.com"
    ]);

    window.f1BridgeReady = false;

    window.addEventListener("message", function(event) {

        if (event.source !== bridgeFrame.contentWindow) {
            return;
        }

        if (!allowedOrigins.has(event.origin)) {
            return;
        }

        if (
            !event.data ||
            event.data.type !== "PROJECT_LAKAS_BRIDGE_READY"
        ) {
            return;
        }

        window.f1BridgeReady = true;

        console.log(
            "PROJECT LAKAS: Submission bridge is ready."
        );

    });

    // Load the deployed Apps Script Web App.
    bridgeFrame.src =
        "https://script.google.com/macros/s/AKfycbzntkKXBkR-pxIB2iUtcaSEKCxWT4MWlb5-HcrwU9XpHISNms_ZXNeOmRe0xA9fuun4kw/exec";

})();
