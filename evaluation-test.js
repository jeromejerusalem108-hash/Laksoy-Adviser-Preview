
/*
 * PROJECT L.A.K.A.S.
 * F1 Evaluation Questionnaire
 * Bilingual statements and collapsible feedback drawer
 */

const F1_ITEMS = [
    {
        en: "The sketch shows a connection with nipa.",
        tl: "Ipinapakita ng guhit ang kaugnayan nito sa nipa."
    },
    {
        en: "The cultural presentation seems respectful to me.",
        tl: "Sa aking palagay, magalang ang pagkakalahad ng kultura."
    },
    {
        en: "The name or logo is easy to identify.",
        tl: "Madaling makilala ang pangalan o logo."
    },
    {
        en: "The text shown is readable.",
        tl: "Madaling basahin ang tekstong ipinakita."
    },
    {
        en: "The colours and lettering work well together.",
        tl: "Maganda ang pagkakatugma ng mga kulay at estilo ng letra."
    },
    {
        en: "The information identifies the intended product as Laksoy.",
        tl: "Ipinakikilala ng impormasyon ang produktong Laksoy."
    },
    {
        en: "The intended package shape is clear.",
        tl: "Malinaw ang nilalayong hugis ng pakete."
    },
    {
        en: "The layout of the package parts is easy to understand.",
        tl: "Madaling maunawaan ang pagkakaayos ng mga bahagi ng pakete."
    },
    {
        en: "The intended opening or access is clear in the drawing.",
        tl: "Malinaw sa guhit kung paano bubuksan o maa-access ang pakete."
    },
    {
        en: "The planned label placement is clear.",
        tl: "Malinaw kung saan ilalagay ang etiketa."
    },
    {
        en: "The drawing is clear enough for me to judge the visible design.",
        tl: "Sapat ang linaw ng guhit upang masuri ko ang nakikitang disenyo."
    },
    {
        en: "The visible design elements look consistent with one another.",
        tl: "Magkakatugma ang mga nakikitang elemento ng disenyo."
    }
];

const F1_SCALE = [
    { value: "1", label: "1 - Strongly disagree" },
    { value: "2", label: "2 - Disagree" },
    { value: "3", label: "3 - Neither agree nor disagree" },
    { value: "4", label: "4 - Agree" },
    { value: "5", label: "5 - Strongly agree" },
    { value: "CJ", label: "CJ - Cannot judge" }
];

/*
 * Feedback choices.
 * The IDs are stable internal values.
 * English labels are used in the submission record.
 */

const F1_STRENGTH_OPTIONS = [
    {
        value: "appearance",
        en: "Overall visual appearance",
        tl: "Kabuuang hitsura"
    },
    {
        value: "colours",
        en: "Colour combination",
        tl: "Kombinasyon ng mga kulay"
    },
    {
        value: "typography",
        en: "Typography and lettering",
        tl: "Tipograpiya at estilo ng letra"
    },
    {
        value: "logo",
        en: "Logo and brand identity",
        tl: "Logo at pagkakakilanlan ng tatak"
    },
    {
        value: "culture",
        en: "Filipino cultural elements and motifs",
        tl: "Mga elementong pangkultura at disenyong Pilipino"
    },
    {
        value: "nipa",
        en: "Connection to nipa and Laksoy",
        tl: "Kaugnayan sa nipa at Laksoy"
    },
    {
        value: "shape",
        en: "Packaging shape and structure",
        tl: "Hugis at estruktura ng pakete"
    },
    {
        value: "layout",
        en: "Layout and arrangement of design elements",
        tl: "Layout at pagkakaayos ng mga elemento ng disenyo"
    },
    {
        value: "readability",
        en: "Readability of text and product information",
        tl: "Pagiging madaling basahin ng teksto at impormasyon ng produkto"
    }
];

const F1_OTHER_VALUE = "other";

/*
 * Draft storage is limited to the current browser tab session.
 */

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

// True while a participant is editing after opening a review item.
let f1ReviewNavigationActive = false;

/*
 * Track which designs have been viewed during this session.
 */

const F1_VISITED_KEY =
    "project_lakas_f1_visited_v1";

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

let f1VisitedDesigns = loadF1VisitedDesigns();

/*
 * Update the final submission section.
 */

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
            : visited + " of " + total + " design presentations viewed.";
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

/*
 * Update questionnaire progress.
 * Unanswered statements remain permitted.
 */

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

    const progressTrack =
        root.querySelector("#progressTrack");

    if (progressFill) {
        progressFill.style.width =
            (answered / F1_ITEMS.length * 100) + "%";
    }

    if (progressText) {
        progressText.textContent =
            `${answered} of ${F1_ITEMS.length} answered`;
    }

    if (progressTrack) {
        progressTrack.setAttribute(
            "aria-valuenow",
            String(answered)
        );
    }
}

/*
 * Build a readable value for the existing worksWell field.
 * This preserves the existing submission field and schema.
 */

function createWorksWellText(selections, otherText) {
    const selectedLabels = F1_STRENGTH_OPTIONS
        .filter(option => selections.includes(option.value))
        .map(option => option.en);

    if (
        selections.includes(F1_OTHER_VALUE) &&
        otherText.trim()
    ) {
        selectedLabels.push(
            "Others: " + otherText.trim()
        );
    }

    return selectedLabels.join("; ");
}

/*
 * Update the drawer counter and the conditional Others field.
 */

function updateWorksWellDrawer(root) {
    if (!root) return;

    const selected = Array.from(
        root.querySelectorAll(
            'input[name="worksWellOption"]:checked'
        )
    );

    const counter =
        root.querySelector("#worksWellCount");

    const otherCheckbox =
        root.querySelector(
            'input[name="worksWellOption"][value="other"]'
        );

    const otherResponse =
        root.querySelector("#otherResponse");

    if (counter) {
        const count = selected.length;

        counter.textContent =
            count === 1
                ? "1 selected"
                : `${count} selected`;
    }

    if (otherResponse) {
        otherResponse.hidden =
            !(otherCheckbox && otherCheckbox.checked);
    }
}

/*
 * Save the currently displayed design.
 */

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

    const selectedStrengths = Array.from(
        root.querySelectorAll(
            'input[name="worksWellOption"]:checked'
        )
    ).map(input => input.value);

    const otherText =
        root.querySelector("#worksWellOther")?.value || "";

    designAnswers.worksWellSelections =
        selectedStrengths;

    designAnswers.worksWellOther =
        otherText;

    // Existing spreadsheet field.
    designAnswers.worksWell =
        createWorksWellText(selectedStrengths, otherText);

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
    updateWorksWellDrawer(root);

    // Refresh an open response review.
    const openReviewPanel =
        document.getElementById("responseReviewPanel");

    if (openReviewPanel && !openReviewPanel.hidden) {
        showF1ResponseReview();
    }
}

/*
 * Generate the questionnaire.
 */

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

            <p>
                Suriin ang ipinakitang guhit ng disenyo ng pakete
                at ibigay ang iyong pagtataya gamit ang
                iskala ng rating sa ibaba.
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
            <br>
            Pumili ng isang sagot para sa bawat pahayag.
            Maaari mong laktawan ang isang pahayag o piliin
            ang CJ kung hindi mo ito kayang tasahin.
        </p>

        <div id="f1Questions"></div>

        <h3 class="section-heading">
            Written Feedback
        </h3>

        <p class="section-description">
            Share your observations and suggestions
            about the displayed design.
            <br>
            Ibahagi ang iyong mga obserbasyon at mungkahi
            tungkol sa ipinakitang disenyo.
        </p>

        <details class="feedback-drawer" id="worksWellDrawer">
            <summary>
                <span class="drawer-title">
                    <strong>What Works Well?</strong>
                    <span>Ano ang maganda sa disenyong ito?</span>
                </span>

                <span class="drawer-controls">
                    <span
                        class="selection-count"
                        id="worksWellCount"
                        aria-live="polite"
                    >0 selected</span>

                    <span class="drawer-arrow" aria-hidden="true">
                        ▾
                    </span>
                </span>
            </summary>

            <div class="drawer-content">
                <p class="drawer-instruction">
                    Select all that apply.
                    <br>
                    Piliin ang lahat ng naaangkop.
                </p>

                <div
                    class="strength-options"
                    id="strengthOptions"
                ></div>

                <div
                    class="other-response"
                    id="otherResponse"
                    hidden
                >
                    <label for="worksWellOther">
                        Please specify:
                        <span class="option-tagalog">
                            Pakitukoy:
                        </span>
                    </label>

                    <input
                        type="text"
                        id="worksWellOther"
                        name="worksWellOther"
                        maxlength="500"
                        placeholder="Enter your answer here..."
                    >
                </div>
            </div>
        </details>

        <div class="comment-card">
            <label for="improvements">
                Suggested Improvements
            </label>

            <span class="tagalog-label">
                Mga mungkahing pagpapabuti
            </span>

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

    // Keep a direct route back to the review when editing from a review link.
    if (f1ReviewNavigationActive) {
        const returnButton = document.createElement("button");

        returnButton.type = "button";
        returnButton.id = "returnToResponseReviewButton";
        returnButton.textContent = "Return to Response Review";
        returnButton.style.display = "block";
        returnButton.style.position = "sticky";
        returnButton.style.top = "0";
        returnButton.style.zIndex = "10";
        returnButton.style.margin = "0 0 18px";
        returnButton.style.padding = "10px 14px";
        returnButton.style.border = "1px solid #356347";
        returnButton.style.borderRadius = "6px";
        returnButton.style.background = "#e9efe8";
        returnButton.style.color = "#183b2b";
        returnButton.style.fontWeight = "600";
        returnButton.style.cursor = "pointer";

        returnButton.addEventListener("click", (event) => {
            // Keep this interaction inside the evaluation drawer.
            // The HTML document-level outside-click handler must not close it.
            event.stopPropagation();

            f1ReviewNavigationActive = false;
            returnButton.remove();

            // Reopen the mobile evaluation drawer and hide its toggle before
            // returning the participant to the response-review section.
            if (window.innerWidth <= 760) {
                const evaluationPanel =
                    document.getElementById("evaluationPanel");
                const drawerToggle =
                    document.getElementById("drawerButton");

                if (evaluationPanel) {
                    evaluationPanel.classList.add("open");
                }

                if (drawerToggle) {
                    drawerToggle.classList.add("hidden");
                }
            }

            const updatedReview = showF1ResponseReview();

            if (updatedReview) {
                if (reviewResponsesButton) {
                    reviewResponsesButton.textContent =
                        "Hide Response Review";
                }

                updatedReview.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });

        root.insertBefore(returnButton, root.firstChild);
    }

    const questions =
        root.querySelector("#f1Questions");

    // Generate the 12 bilingual evaluation statements.
    F1_ITEMS.forEach((item, index) => {
        const itemNumber =
            String(index + 1).padStart(2, "0");

        const section =
            document.createElement("fieldset");

        section.className = "question-card";
        section.tabIndex = -1;

        const legend =
            document.createElement("legend");

        const number =
            document.createElement("span");

        number.className = "question-number";
        number.textContent = itemNumber + ".";

        const english =
            document.createElement("span");

        english.className = "question-english";
        english.textContent = item.en;

        const tagalog =
            document.createElement("span");

        tagalog.className = "question-tagalog";
        tagalog.textContent = item.tl;

        legend.appendChild(number);
        legend.appendChild(english);
        legend.appendChild(tagalog);

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

    // Generate the selectable feedback checklist.
    const strengthOptions =
        root.querySelector("#strengthOptions");

    F1_STRENGTH_OPTIONS.forEach(option => {
        const label =
            document.createElement("label");

        label.className = "strength-option";

        const checkbox =
            document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.name = "worksWellOption";
        checkbox.value = option.value;

        const text =
            document.createElement("span");

        text.appendChild(
            document.createTextNode(option.en)
        );

        const tagalog =
            document.createElement("span");

        tagalog.className = "option-tagalog";
        tagalog.textContent = option.tl;

        text.appendChild(tagalog);

        label.appendChild(checkbox);
        label.appendChild(text);

        strengthOptions.appendChild(label);
    });

    // Add the Others checkbox.
    const otherLabel =
        document.createElement("label");

    otherLabel.className = "strength-option";

    const otherCheckbox =
        document.createElement("input");

    otherCheckbox.type = "checkbox";
    otherCheckbox.name = "worksWellOption";
    otherCheckbox.value = F1_OTHER_VALUE;

    const otherLabelText =
        document.createElement("span");

    otherLabelText.appendChild(
        document.createTextNode("Others")
    );

    const otherTagalog =
        document.createElement("span");

    otherTagalog.className = "option-tagalog";
    otherTagalog.textContent = "Iba pa";

    otherLabelText.appendChild(otherTagalog);

    otherLabel.appendChild(otherCheckbox);
    otherLabel.appendChild(otherLabelText);

    strengthOptions.appendChild(otherLabel);

    /*
     * Restore saved rating answers.
     */

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

    /*
     * Restore feedback selections.
     *
     * If an older draft only has the original free-text
     * worksWell value, preserve it under Others.
     */

    let savedSelections = [];

    if (
        Array.isArray(savedDesignAnswers.worksWellSelections)
    ) {
        savedSelections =
            savedDesignAnswers.worksWellSelections.filter(value =>
                F1_STRENGTH_OPTIONS.some(
                    option => option.value === value
                ) || value === F1_OTHER_VALUE
            );

    } else if (
        typeof savedDesignAnswers.worksWell === "string" &&
        savedDesignAnswers.worksWell.trim()
    ) {
        savedSelections = [F1_OTHER_VALUE];
    }

    root.querySelectorAll(
        'input[name="worksWellOption"]'
    ).forEach(checkbox => {
        checkbox.checked =
            savedSelections.includes(checkbox.value);
    });

    const savedOtherText =
        typeof savedDesignAnswers.worksWellOther === "string"
            ? savedDesignAnswers.worksWellOther
            : (
                savedSelections.includes(F1_OTHER_VALUE)
                    ? savedDesignAnswers.worksWell || ""
                    : ""
            );

    root.querySelector("#worksWellOther").value =
        savedOtherText;

    // Restore the improvements response.
    root.querySelector("#improvements").value =
        savedDesignAnswers.improvements || "";

    // Restore the progress indicator and feedback counter.
    updateF1Progress(root);
    updateWorksWellDrawer(root);

    // Display the current save state.
    const saveStatus =
        root.querySelector("#saveStatus");

    if (Object.keys(savedDesignAnswers).length > 0) {
        saveStatus.textContent =
            "Previously saved answers restored for this browser tab session.";
    }

    /*
     * Save written responses as participants type.
     */

    root.oninput = function (event) {
        if (
            event.target.matches(
                "#improvements, #worksWellOther"
            )
        ) {
            saveCurrentF1Answers(sketchCode, position);
        }
    };

    /*
     * Save selected rating answers and checklist choices.
     */

    root.onchange = function (event) {
        if (
            event.target.matches('input[type="radio"]') ||
            event.target.matches(
                'input[name="worksWellOption"]'
            )
        ) {
            updateWorksWellDrawer(root);
            saveCurrentF1Answers(sketchCode, position);
        }
    };
}

/*
 * Generate or retrieve the anonymous retry token.
 */

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

/*
 * Prepare all five designs for submission.
 *
 * The existing worksWell and improvements field names
 * are retained for spreadsheet compatibility.
 */

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

/*
 * Open a specific design and questionnaire item from the response review.
 * Answers are saved as participants change them; rendering the selected design
 * restores its saved values before the participant edits the chosen item.
 */
function navigateToF1Question(sketchCode, questionIndex) {
    const loadDesign = window.loadModel;

    if (typeof loadDesign !== "function") {
        console.error(
            "PROJECT LAKAS: The prototype navigation function is unavailable."
        );
        return;
    }

    f1ReviewNavigationActive = true;

    const reviewPanel =
        document.getElementById("responseReviewPanel");

    if (reviewPanel) {
        reviewPanel.hidden = true;
    }

    if (reviewResponsesButton) {
        reviewResponsesButton.textContent = "Review Responses";
    }

    loadDesign(sketchCode);

    const questionnaire =
        document.getElementById("questionnaire");

    const questionCards =
        questionnaire
            ? questionnaire.querySelectorAll(".question-card")
            : [];

    const targetQuestion = questionCards[questionIndex];

    if (targetQuestion) {
        targetQuestion.focus({ preventScroll: true });

        targetQuestion.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}

/*
 * Display a visual review of all five design responses.
 */

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

    // Remember which design card is open.
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

    // Calculate response totals.
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
            } else if (
                ["1", "2", "3", "4", "5"].includes(value)
            ) {
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
        "Check your answers for each design. Select a question statement to open that exact question and edit your response. Select a design card to expand or collapse its responses.";
    reviewPanel.appendChild(description);

    const tagalogDescription =
        document.createElement("p");

    tagalogDescription.textContent =
        "Suriin ang iyong mga sagot para sa bawat disenyo. Piliin ang pahayag ng tanong upang buksan ang mismong tanong at baguhin ang sagot. Piliin ang isang card upang makita o itago ang mga sagot nito.";

    reviewPanel.appendChild(tagalogDescription);

    // Overall response summary.
    const summary = document.createElement("div");

    summary.style.display = "grid";
    summary.style.gridTemplateColumns =
        "repeat(auto-fit, minmax(110px, 1fr))";
    summary.style.gap = "10px";
    summary.style.margin = "16px 0";

    const summaryItems = [
        { label: "Answered", value: answeredCount },
        { label: "Cannot Judge", value: cannotJudgeCount },
        { label: "Unanswered", value: unansweredCount }
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

            const question = document.createElement("button");

            question.type = "button";
            question.style.flex = "1";
            question.style.padding = "6px 8px";
            question.style.border = "1px solid rgba(217, 165, 45, 0.78)";
            question.style.borderRadius = "5px";
            question.style.border = "0";
            question.style.background = "rgba(21, 57, 31, 0.14)";
            question.style.color = "#D9A52D";
            question.style.fontFamily = "Arial, sans-serif";
            question.style.fontSize = "13px";
            question.style.lineHeight = "1.5";
            question.style.textAlign = "left";
            question.style.textDecoration = "underline";
            question.style.textUnderlineOffset = "3px";
            question.style.whiteSpace = "pre-line";
            question.style.cursor = "pointer";

            question.textContent =
                `${itemNumber}. ${item.en}\n${item.tl}`;

            question.setAttribute(
                "aria-label",
                `Edit response for ${material.name}, question ${itemNumber}: ${item.en}`
            );

            question.title = "Click to edit this response";

            question.addEventListener("click", () => {
                navigateToF1Question(code, index);
            });

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
            } else if (
                ["1", "2", "3", "4", "5"].includes(value)
            ) {
                answerBadge.textContent = value;
                answerBadge.style.background = "#f1ead7";
                answerBadge.style.color = "#51452d";
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

        const feedbackBox =
            document.createElement("div");

        feedbackBox.style.background = "#f5f5f5";
        feedbackBox.style.padding = "14px";
        feedbackBox.style.borderRadius = "8px";

        // What Works Well heading and bilingual selections.
        const worksWellHeading =
            document.createElement("strong");

        worksWellHeading.textContent =
            "What Works Well? / Ano ang maganda sa disenyo?";

        worksWellHeading.style.display = "block";
        worksWellHeading.style.marginBottom = "10px";

        feedbackBox.appendChild(worksWellHeading);

        const selectedStrengths =
            Array.isArray(answers.worksWellSelections)
                ? answers.worksWellSelections
                : [];

        const selectedOptions = F1_STRENGTH_OPTIONS.filter(
            option => selectedStrengths.includes(option.value)
        );

        if (selectedOptions.length > 0) {
            const strengthGrid =
                document.createElement("div");

            strengthGrid.style.display = "grid";
            strengthGrid.style.gridTemplateColumns =
                "repeat(auto-fit, minmax(190px, 1fr))";
            strengthGrid.style.gap = "8px";
            strengthGrid.style.marginBottom = "12px";

            selectedOptions.forEach(option => {
                const strengthItem =
                    document.createElement("div");

                strengthItem.style.background = "#ffffff";
                strengthItem.style.border = "1px solid #dedede";
                strengthItem.style.borderRadius = "6px";
                strengthItem.style.padding = "10px";

                const english =
                    document.createElement("div");

                english.textContent = option.en;
                english.style.fontWeight = "600";
                english.style.fontSize = "13px";

                const tagalog =
                    document.createElement("div");

                tagalog.textContent = option.tl;
                tagalog.style.fontSize = "12px";
                tagalog.style.color = "#666666";
                tagalog.style.marginTop = "3px";

                strengthItem.append(english, tagalog);
                strengthGrid.appendChild(strengthItem);
            });

            feedbackBox.appendChild(strengthGrid);
        }

        // Show the participant's Others response separately.
        const hasOtherSelection =
            selectedStrengths.includes(F1_OTHER_VALUE);

        const otherText =
            typeof answers.worksWellOther === "string"
                ? answers.worksWellOther.trim()
                : "";

        if (hasOtherSelection) {
            const otherBox =
                document.createElement("div");

            otherBox.style.background = "#ffffff";
            otherBox.style.borderLeft = "3px solid #888888";
            otherBox.style.padding = "10px";
            otherBox.style.marginBottom = "12px";

            const otherHeading =
                document.createElement("div");

            otherHeading.textContent = "Others / Iba pa";
            otherHeading.style.fontWeight = "600";
            otherHeading.style.fontSize = "13px";

            otherBox.appendChild(otherHeading);

            const otherResponse =
                document.createElement("p");

            otherResponse.textContent =
                otherText || "No additional details provided. / Walang karagdagang detalye.";

            otherResponse.style.fontSize = "13px";
            otherResponse.style.margin = "5px 0 0";

            otherBox.appendChild(otherResponse);
            feedbackBox.appendChild(otherBox);
        } else if (selectedOptions.length === 0) {
            const noSelection =
                document.createElement("p");

            noSelection.textContent =
                answers.worksWell
                    ? answers.worksWell
                    : "No selection provided. / Walang piniling sagot.";

            noSelection.style.fontSize = "13px";
            noSelection.style.margin = "0 0 12px";

            feedbackBox.appendChild(noSelection);
        }

        // Suggested Improvements remains a separate text section.
        const improvementsHeading =
            document.createElement("strong");

        improvementsHeading.textContent =
            "Suggested Improvements / Mga mungkahing pagpapabuti";

        improvementsHeading.style.display = "block";
        improvementsHeading.style.marginTop = "6px";
        improvementsHeading.style.marginBottom = "6px";

        const improvementsResponse =
            document.createElement("p");

        improvementsResponse.textContent =
            answers.improvements
                ? answers.improvements
                : "No suggestion provided. / Walang mungkahing ibinigay.";

        improvementsResponse.style.fontSize = "13px";
        improvementsResponse.style.margin = "0";

        feedbackBox.append(
            improvementsHeading,
            improvementsResponse
        );

        card.appendChild(feedbackBox);
        reviewPanel.appendChild(card);

        if (code === previouslyOpenCode) {
            card.open = true;
        }
    });

    reviewPanel.hidden = false;

    return reviewPanel;
}
/*
 * Connect the Review Responses button.
 */

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
 * Apps Script Submission Bridge
 *
 * Existing submission bridge retained.
 */

(function setupF1Bridge() {

    const WEB_APP_URL =
        "https://script.google.com/macros/s/AKfycbzntkKXBkR-pxIB2iUtcaSEKCxWT4MWlb5-HcrwU9XpHISNms_ZXNeOmRe0xA9fuun4kw/exec";

    const TRUSTED_PARENT_ORIGIN =
        "https://jeromejerusalem108-hash.github.io";

    const bridgeFrame =
        document.getElementById("f1SubmissionBridge");

    const submitButton =
        document.getElementById("submitEvaluationButton");

    const submissionStatus =
        document.getElementById("submissionStatus");

    if (!bridgeFrame || !submitButton || !submissionStatus) {
        console.error(
            "PROJECT LAKAS: Required submission elements were not found."
        );
        return;
    }

    bridgeFrame.name = "f1SubmissionBridge";

    bridgeFrame.addEventListener("error", function () {
        bridgeFrame.dataset.loadError = "true";

        console.error(
            "PROJECT LAKAS: Submission iframe failed to load."
        );
    });

    let pendingRequestId = null;
    let submissionTimeout = null;

    // Generate a unique ID for each submission attempt.
    function generateRequestId() {
        if (
            !window.crypto ||
            !window.crypto.getRandomValues
        ) {
            throw new Error(
                "Secure request ID generation is unavailable."
            );
        }

        if (typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }

        const bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);

        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        const hex = Array.from(bytes, byte =>
            byte.toString(16).padStart(2, "0")
        );

        return [
            hex.slice(0, 4).join(""),
            hex.slice(4, 6).join(""),
            hex.slice(6, 8).join(""),
            hex.slice(8, 10).join(""),
            hex.slice(10, 16).join("")
        ].join("-");
    }

    // Check whether a message came from an accepted Apps Script origin.
    function isTrustedAppsScriptOrigin(origin) {
        try {
            const hostname = new URL(origin).hostname;

            return (
                hostname === "script.google.com" ||
                hostname.endsWith(".script.googleusercontent.com") ||
                hostname.endsWith("-script.googleusercontent.com")
            );

        } catch (error) {
            return false;
        }
    }

    // Display the submission result.
    function displaySubmissionResult(result) {

        if (!result || typeof result !== "object") {
            submissionStatus.textContent =
                "The server returned an invalid response. Please try again.";

            return;
        }

        if (result.success === true) {

            if (result.duplicate === true) {
                submissionStatus.textContent =
                    result.message ||
                    "This submission has already been received.";

            } else {
                submissionStatus.textContent =
                    (result.message || "Submission received.") +
                    " Submission reference: " +
                    (result.submissionId || "Unavailable") +
                    ". Records saved: " +
                    (result.recordsSaved ?? "Unavailable") +
                    ".";
            }

            return;
        }

        submissionStatus.textContent =
            result.message ||
            "The submission could not be processed. Please try again.";
    }

    // Receive the response from Apps Script.
    window.addEventListener("message", function(event) {

        if (!isTrustedAppsScriptOrigin(event.origin)) {
            return;
        }

        const data = event.data;

        if (
            !data ||
            data.type !== "PROJECT_LAKAS_RESULT"
        ) {
            return;
        }

        // Accept only the response for the current request.
        if (
            !pendingRequestId ||
            data.requestId !== pendingRequestId
        ) {
            return;
        }

        clearTimeout(submissionTimeout);
        submissionTimeout = null;
        pendingRequestId = null;

        submitButton.disabled = false;

        displaySubmissionResult(data.result);

    });

    // Submit the evaluation through a standard HTML form.
    function submitF1Evaluation() {

        if (pendingRequestId) {
            return;
        }

        try {

            const payload =
                createF1SubmissionPayload();

            const requestId =
                generateRequestId();

            const form =
                document.createElement("form");

            form.method = "POST";
            form.action = WEB_APP_URL;
            form.target = "f1SubmissionBridge";
            form.style.display = "none";

            const payloadInput =
                document.createElement("input");

            payloadInput.type = "hidden";
            payloadInput.name = "payload";
            payloadInput.value = JSON.stringify(payload);

            const requestIdInput =
                document.createElement("input");

            requestIdInput.type = "hidden";
            requestIdInput.name = "requestId";
            requestIdInput.value = requestId;

            form.appendChild(payloadInput);
            form.appendChild(requestIdInput);

            document.body.appendChild(form);

            pendingRequestId = requestId;

            submitButton.disabled = true;

            submissionStatus.textContent =
                "Submitting your evaluation. Please wait and do not close this page.";

            // Prevent the page from remaining locked indefinitely.
            submissionTimeout = setTimeout(() => {

                if (pendingRequestId !== requestId) {
                    return;
                }

                pendingRequestId = null;
                submissionTimeout = null;

                submitButton.disabled = false;

                submissionStatus.textContent =
                    "No confirmation was received. Your submission may still have reached the server. You may retry; the anonymous retry token helps prevent duplicate records.";

            }, 30000);

            form.submit();

        } catch (error) {

            if (submissionTimeout) {
                clearTimeout(submissionTimeout);
                submissionTimeout = null;
            }

            pendingRequestId = null;
            submitButton.disabled = false;

            submissionStatus.textContent =
                error.message ||
                "Unable to prepare your submission. Please try again.";

            console.error(
                "PROJECT LAKAS submission error:",
                error
            );
        }
    }

    // Connect the Submit Evaluation button.
    submitButton.addEventListener(
        "click",
        submitF1Evaluation
    );

    // Load the Apps Script web application into the hidden iframe.
    bridgeFrame.src = WEB_APP_URL;

    window.f1BridgeReady = true;

    console.log(
        "PROJECT LAKAS: Submission form bridge initialized."
    );

})();
