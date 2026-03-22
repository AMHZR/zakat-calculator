import { calculateZakat } from "./calculator.js";
import { fetchLatestMetalPrices } from "./pricing.js";

const STORAGE_KEY = "zakat-calculator-state";
const CURRENCY_SYMBOLS = {
  AED: {
    type: "image",
    alt: "UAE dirham symbol",
    src: "./assets/currency/aed-dirham-symbol.png"
  },
  USD: {
    type: "text",
    value: "$"
  },
  SAR: {
    type: "image",
    alt: "Saudi riyal symbol",
    src: "./assets/currency/sar-riyal-symbol.svg"
  },
  GBP: {
    type: "text",
    value: "£"
  },
  EUR: {
    type: "text",
    value: "€"
  },
  INR: {
    type: "text",
    value: "₹"
  },
  PKR: {
    type: "text",
    value: "Rs"
  }
};

const defaultState = {
  currency: "AED",
  nisabBasis: "gold",
  hawlCompleted: true,
  includePersonalJewelry: false,
  cash: "",
  bankBalances: "",
  unspentIncome: "",
  receivables: "",
  investments: "",
  businessInventory: "",
  otherAssets: "",
  debtsDue: "",
  businessLiabilities: "",
  goldPricePerGram: "",
  silverPricePerGram: "",
  goldGrams: "",
  silverGrams: "",
  personalGoldGrams: "",
  personalSilverGrams: ""
};

const steps = [
  { title: "Setup your zakat basis", counter: "Step 1 of 5" },
  { title: "Cash and balances", counter: "Step 2 of 5" },
  { title: "Gold and silver", counter: "Step 3 of 5" },
  { title: "Assets and investments", counter: "Step 4 of 5" },
  { title: "Debts and result", counter: "Step 5 of 5" }
];

const form = document.querySelector("[data-calculator-form]");
const root = document.documentElement;
const landingView = document.querySelector("[data-landing-view]");
const journeyView = document.querySelector("[data-journey-view]");
const enterJourneyButton = document.querySelector("[data-enter-journey]");
const learnOpenButtons = Array.from(document.querySelectorAll("[data-open-learn]"));
const learnCloseButtons = Array.from(document.querySelectorAll("[data-close-learn]"));
const learnModal = document.querySelector("[data-learn-modal]");
const learnPanel = learnModal?.querySelector(".learn-panel");
const resetButton = document.querySelector("[data-reset-calculator]");
const fetchPricesButton = document.querySelector("[data-fetch-prices]");
const priceStatus = document.querySelector("[data-price-status]");
const currencyPrefixes = Array.from(document.querySelectorAll("[data-currency-prefix]"));
const stepPanels = Array.from(document.querySelectorAll("[data-step-panel]"));
const stepButtons = Array.from(document.querySelectorAll("[data-step-jump]"));
const backButton = document.querySelector("[data-step-back]");
const nextButton = document.querySelector("[data-step-next]");
const stepCounter = document.querySelector("[data-step-counter]");
const stepTitle = document.querySelector("[data-step-title]");
const stepStatus = document.querySelector("[data-step-status]");
const progressFill = document.querySelector("[data-progress-fill]");
const printButton = document.querySelector("[data-print-report]");
const NAVIGABLE_FIELD_SELECTOR = "input:not([type='checkbox']):not([type='radio']), select";
const TEXT_INPUT_SELECTOR = "input:not([type='checkbox']):not([type='radio'])";
let lastStableAppHeight = window.innerHeight || 0;

function setupFieldPlaceholders() {
  const fields = Array.from(document.querySelectorAll(".field"));

  fields.forEach((field) => {
    const help = field.querySelector(".field-help");
    const control = field.querySelector(".choice-row, input:not([type='radio']), select");
    const helpText = help?.querySelector(".field-help-card")?.textContent?.trim();

    if (!help || !control) {
      return;
    }

    if (helpText && control.tagName === "INPUT") {
      control.placeholder = helpText;
    } else if (helpText && control.tagName === "SELECT") {
      control.title = helpText;
    } else if (helpText && control.classList.contains("choice-row")) {
      control.setAttribute("aria-description", helpText);
    }

    help.remove();
  });
}

setupFieldPlaceholders();

function getPanelFields(panel) {
  return Array.from(panel.querySelectorAll(NAVIGABLE_FIELD_SELECTOR)).filter((field) => !field.disabled);
}

function getPanelTextInputs(panel) {
  return Array.from(panel.querySelectorAll(TEXT_INPUT_SELECTOR)).filter((field) => !field.disabled);
}

function updateKeyboardViewport() {
  if (!window.visualViewport) {
    root.style.setProperty("--app-height", "100dvh");
    root.style.setProperty("--keyboard-offset", "0px");
    return;
  }

  const viewport = window.visualViewport;
  const viewportHeight = Math.round(viewport.height + viewport.offsetTop);
  const keyboardOffset = Math.max(0, window.innerHeight - viewportHeight);
  const keyboardThreshold = 120;

  if (keyboardOffset < keyboardThreshold) {
    lastStableAppHeight = viewportHeight;
  }

  root.style.setProperty("--app-height", `${lastStableAppHeight || viewportHeight}px`);
  root.style.setProperty("--keyboard-offset", `${keyboardOffset >= keyboardThreshold ? keyboardOffset : 0}px`);
}

function scrollFieldIntoView(field, { behavior = "smooth" } = {}) {
  if (!(field instanceof HTMLElement)) {
    return;
  }

  const panel = field.closest("[data-step-panel]");

  if (!(panel instanceof HTMLElement)) {
    return;
  }

  const panelRect = panel.getBoundingClientRect();
  const fieldRect = field.getBoundingClientRect();
  const keyboardOffset = Number.parseFloat(getComputedStyle(root).getPropertyValue("--keyboard-offset")) || 0;
  const topPadding = 18;
  const bottomPadding = keyboardOffset > 0 ? keyboardOffset + 28 : 28;
  const visibleTop = panelRect.top + topPadding;
  const visibleBottom = panelRect.bottom - bottomPadding;

  if (fieldRect.top >= visibleTop && fieldRect.bottom <= visibleBottom) {
    return;
  }

  const delta = fieldRect.top < visibleTop
    ? fieldRect.top - visibleTop
    : fieldRect.bottom - visibleBottom;

  panel.scrollBy({
    top: delta,
    behavior
  });
}

function updateInputNavigation() {
  stepPanels.forEach((panel) => {
    const textInputs = getPanelTextInputs(panel);

    textInputs.forEach((input, index) => {
      input.setAttribute("enterkeyhint", index === textInputs.length - 1 ? "done" : "next");
      input.dataset.inputNavIndex = String(index);
    });
  });
}

function focusAdjacentField(currentField) {
  if (!(currentField instanceof HTMLElement)) {
    return false;
  }

  const panel = currentField.closest("[data-step-panel]");

  if (!(panel instanceof HTMLElement)) {
    return false;
  }

  const textInputs = getPanelTextInputs(panel);
  const currentIndex = textInputs.indexOf(currentField);

  if (currentIndex === -1) {
    return false;
  }

  const nextField = textInputs[currentIndex + 1];

  if (!nextField) {
    currentField.blur();
    return false;
  }

  nextField.focus({ preventScroll: true });
  scrollFieldIntoView(nextField);
  return true;
}

updateInputNavigation();
updateKeyboardViewport();

const summaryFields = {
  status: Array.from(document.querySelectorAll("[data-summary-status]")),
  message: Array.from(document.querySelectorAll("[data-summary-message]")),
  netAssets: Array.from(document.querySelectorAll("[data-summary-net-assets]")),
  nisabValue: Array.from(document.querySelectorAll("[data-summary-nisab]")),
  zakatDue: Array.from(document.querySelectorAll("[data-summary-zakat]")),
  breakdown: Array.from(document.querySelectorAll("[data-summary-breakdown]")),
  goldNisab: Array.from(document.querySelectorAll("[data-summary-gold-nisab]")),
  silverNisab: Array.from(document.querySelectorAll("[data-summary-silver-nisab]"))
};

const printFields = {
  generated: document.querySelector("[data-print-generated]"),
  status: document.querySelector("[data-print-status]"),
  message: document.querySelector("[data-print-message]"),
  zakat: document.querySelector("[data-print-zakat]"),
  netAssets: document.querySelector("[data-print-net-assets]"),
  nisab: document.querySelector("[data-print-nisab]"),
  currency: document.querySelector("[data-print-currency]"),
  nisabBasis: document.querySelector("[data-print-nisab-basis]"),
  hawl: document.querySelector("[data-print-hawl]"),
  jewelryChoice: document.querySelector("[data-print-jewelry-choice]"),
  goldPrice: document.querySelector("[data-print-gold-price]"),
  silverPrice: document.querySelector("[data-print-silver-price]"),
  goldNisab: document.querySelector("[data-print-gold-nisab]"),
  silverNisab: document.querySelector("[data-print-silver-nisab]"),
  inputs: document.querySelector("[data-print-inputs]"),
  breakdown: document.querySelector("[data-print-breakdown]")
};

let currentStep = 0;
let latestRender = null;
let lastLearnTrigger = null;

function setText(elements, value) {
  elements.forEach((element) => {
    element.textContent = value;
  });
}

function setJourneyVisibility(started) {
  landingView.hidden = started;
  journeyView.hidden = !started;
}

function openLearnModal(trigger) {
  if (!learnModal) {
    return;
  }

  lastLearnTrigger = trigger || document.activeElement;
  learnModal.hidden = false;
  learnModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  learnPanel?.focus({ preventScroll: true });
}

function closeLearnModal() {
  if (!learnModal) {
    return;
  }

  learnModal.hidden = true;
  learnModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  if (lastLearnTrigger instanceof HTMLElement) {
    lastLearnTrigger.focus({ preventScroll: true });
  }
}

function setStatusPills(label, state) {
  summaryFields.status.forEach((element) => {
    element.textContent = label;
    element.dataset.state = state;
  });
}

function getCurrencyPrefix(currency) {
  return CURRENCY_SYMBOLS[currency] || {
    type: "text",
    value: currency || defaultState.currency
  };
}

function updateCurrencyPrefixes(currency) {
  const prefix = getCurrencyPrefix(currency);

  currencyPrefixes.forEach((element) => {
    element.replaceChildren();
    element.dataset.kind = prefix.type;

    if (prefix.type === "image") {
      const image = document.createElement("img");
      image.className = "currency-prefix-mark";
      image.src = prefix.src;
      image.alt = prefix.alt;
      image.decoding = "async";
      element.appendChild(image);
      return;
    }

    element.textContent = prefix.value;
  });
}

function formatUpdateTime(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(parsed);
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { ...defaultState, ...saved };
  } catch {
    return { ...defaultState };
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures so calculation still works in private or locked-down contexts.
  }
}

function formatMoney(value, currency) {
  if (!Number.isFinite(value)) {
    return "0.00";
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function collectState() {
  const formData = new FormData(form);

  return {
    currency: formData.get("currency") || defaultState.currency,
    nisabBasis: formData.get("nisabBasis") || defaultState.nisabBasis,
    hawlCompleted: formData.get("hawlCompleted") === "on",
    includePersonalJewelry: formData.get("includePersonalJewelry") === "on",
    cash: formData.get("cash") || "",
    bankBalances: formData.get("bankBalances") || "",
    unspentIncome: formData.get("unspentIncome") || "",
    receivables: formData.get("receivables") || "",
    investments: formData.get("investments") || "",
    businessInventory: formData.get("businessInventory") || "",
    otherAssets: formData.get("otherAssets") || "",
    debtsDue: formData.get("debtsDue") || "",
    businessLiabilities: formData.get("businessLiabilities") || "",
    goldPricePerGram: formData.get("goldPricePerGram") || "",
    silverPricePerGram: formData.get("silverPricePerGram") || "",
    goldGrams: formData.get("goldGrams") || "",
    silverGrams: formData.get("silverGrams") || "",
    personalGoldGrams: formData.get("personalGoldGrams") || "",
    personalSilverGrams: formData.get("personalSilverGrams") || ""
  };
}

function populateForm(state) {
  for (const [key, value] of Object.entries(state)) {
    const field = form.elements.namedItem(key);

    if (!field) {
      continue;
    }

    if (field instanceof RadioNodeList) {
      field.value = value;
      continue;
    }

    if (field.type === "checkbox") {
      field.checked = Boolean(value);
      continue;
    }

    field.value = value;
  }
}

function renderBreakdown(result, currency) {
  const items = [
    ["Gross zakatable assets", result.values.grossAssets],
    ["Included gold", result.values.goldValue],
    ["Included silver", result.values.silverValue],
    ["Included personal jewelry", result.values.includedJewelryValue],
    ["Immediate deductions", result.values.deductions]
  ];

  summaryFields.breakdown.forEach((element) => {
    element.replaceChildren();

    for (const [label, value] of items) {
      const row = document.createElement("div");
      row.className = "breakdown-row";

      const span = document.createElement("span");
      span.textContent = label;

      const strong = document.createElement("strong");
      strong.textContent = formatMoney(value, currency);

      row.appendChild(span);
      row.appendChild(strong);
      element.appendChild(row);
    }
  });
}

function formatBoolean(value) {
  return value ? "Yes" : "No";
}

function renderPrintReport(state, result, statusLabel, currency) {
  const nisabLabel = state.nisabBasis === "silver" ? "Silver nisab" : "Gold nisab";
  const inputItems = [
    ["Cash on hand", state.cash, "money"],
    ["Bank balances", state.bankBalances, "money"],
    ["Unspent income still held", state.unspentIncome, "money"],
    ["Recoverable money owed to you", state.receivables, "money"],
    ["Gold held as savings or investment", state.goldGrams, "grams"],
    ["Silver held as savings or investment", state.silverGrams, "grams"],
    ["Personal-use gold jewelry", state.personalGoldGrams, "grams"],
    ["Personal-use silver jewelry", state.personalSilverGrams, "grams"],
    ["Investments", state.investments, "money"],
    ["Business inventory", state.businessInventory, "money"],
    ["Other zakatable assets", state.otherAssets, "money"],
    ["Personal debts due", state.debtsDue, "money"],
    ["Business payables due", state.businessLiabilities, "money"]
  ];

  const filteredInputs = inputItems.filter(([, value]) => value !== "");

  printFields.generated.textContent = `Generated ${new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date())}`;
  printFields.status.textContent = statusLabel;
  printFields.message.textContent = result.statusMessage;
  printFields.zakat.textContent = formatMoney(result.values.zakatDue, currency);
  printFields.netAssets.textContent = formatMoney(result.values.netZakatableAssets, currency);
  printFields.nisab.textContent = result.values.selectedNisabValue === null
    ? "Enter market price"
    : formatMoney(result.values.selectedNisabValue, currency);
  printFields.currency.textContent = currency;
  printFields.nisabBasis.textContent = nisabLabel;
  printFields.hawl.textContent = formatBoolean(state.hawlCompleted);
  printFields.jewelryChoice.textContent = formatBoolean(state.includePersonalJewelry);
  printFields.goldPrice.textContent = state.goldPricePerGram === ""
    ? "Not entered"
    : formatMoney(Number(state.goldPricePerGram), currency);
  printFields.silverPrice.textContent = state.silverPricePerGram === ""
    ? "Not entered"
    : formatMoney(Number(state.silverPricePerGram), currency);
  printFields.goldNisab.textContent = result.values.goldNisabValue === null
    ? "Enter gold price"
    : formatMoney(result.values.goldNisabValue, currency);
  printFields.silverNisab.textContent = result.values.silverNisabValue === null
    ? "Enter silver price"
    : formatMoney(result.values.silverNisabValue, currency);
  printFields.inputs.replaceChildren();
  if (filteredInputs.length > 0) {
    for (const [label, value, kind] of filteredInputs) {
      const displayValue = kind === "grams"
        ? `${value} g`
        : formatMoney(Number(value || 0), currency);
      const card = document.createElement("div");
      card.className = "print-detail-card";
      const span = document.createElement("span");
      span.textContent = label;
      const strong = document.createElement("strong");
      strong.textContent = displayValue;
      card.appendChild(span);
      card.appendChild(strong);
      printFields.inputs.appendChild(card);
    }
  } else {
    const card = document.createElement("div");
    card.className = "print-detail-card";
    const span = document.createElement("span");
    span.textContent = "Entered asset and debt amounts";
    const strong = document.createElement("strong");
    strong.textContent = "No optional amounts were entered";
    card.appendChild(span);
    card.appendChild(strong);
    printFields.inputs.appendChild(card);
  }

  const breakdownItems = [
    ["Gross zakatable assets", result.values.grossAssets],
    ["Included gold", result.values.goldValue],
    ["Included silver", result.values.silverValue],
    ["Included personal jewelry", result.values.includedJewelryValue],
    ["Immediate deductions", result.values.deductions],
    ["Net zakatable wealth", result.values.netZakatableAssets],
    ["Zakat due", result.values.zakatDue]
  ];

  printFields.breakdown.replaceChildren();
  for (const [label, value] of breakdownItems) {
    const row = document.createElement("div");
    row.className = "breakdown-row";
    const span = document.createElement("span");
    span.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = formatMoney(value, currency);
    row.appendChild(span);
    row.appendChild(strong);
    printFields.breakdown.appendChild(row);
  }
}

function render(state) {
  const result = calculateZakat(state);
  const currency = state.currency || defaultState.currency;

  const statusLabel = result.status === "zakat_due"
    ? "Zakat is due"
    : result.status === "below_nisab"
      ? "You are below nisab"
      : result.status === "awaiting_hawl"
        ? "A hawl confirmation is still needed"
        : "We still need your metal prices";

  setStatusPills(statusLabel, result.status);
  setText(summaryFields.message, result.statusMessage);
  setText(summaryFields.netAssets, formatMoney(result.values.netZakatableAssets, currency));
  setText(summaryFields.zakatDue, formatMoney(result.values.zakatDue, currency));
  setText(
    summaryFields.nisabValue,
    result.values.selectedNisabValue === null
      ? "Enter market price"
      : formatMoney(result.values.selectedNisabValue, currency)
  );
  setText(
    summaryFields.goldNisab,
    result.values.goldNisabValue === null
      ? "Enter gold price"
      : formatMoney(result.values.goldNisabValue, currency)
  );
  setText(
    summaryFields.silverNisab,
    result.values.silverNisabValue === null
      ? "Enter silver price"
      : formatMoney(result.values.silverNisabValue, currency)
  );

  renderBreakdown(result, currency);
  renderPrintReport(state, result, statusLabel, currency);
  latestRender = { state, result, statusLabel, currency };
}

function findFocusable(panel) {
  return panel.querySelector("[data-step-focus]") || getPanelFields(panel)[0] || panel.querySelector("button");
}

function renderStep() {
  stepPanels.forEach((panel, index) => {
    const isActive = index === currentStep;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
  });

  stepButtons.forEach((button, index) => {
    const isActive = index === currentStep;
    button.classList.toggle("is-active", isActive);
    button.classList.toggle("is-complete", index < currentStep);
    button.setAttribute("aria-current", isActive ? "step" : "false");
  });

  stepCounter.textContent = steps[currentStep].counter;
  stepTitle.textContent = steps[currentStep].title;
  stepStatus.textContent = `${currentStep} done • ${steps.length - currentStep - 1} pending`;
  if (progressFill) {
    progressFill.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
  }

  backButton.disabled = currentStep === 0;

  if (currentStep === steps.length - 1) {
    nextButton.hidden = true;
    printButton.hidden = false;
  } else {
    nextButton.hidden = false;
    nextButton.textContent = currentStep === steps.length - 2 ? "See result" : "Continue";
    printButton.hidden = true;
  }
}

function setCurrentStep(nextStep, { focus = true } = {}) {
  currentStep = Math.max(0, Math.min(nextStep, steps.length - 1));
  renderStep();

  if (!focus) {
    return;
  }

  const activePanel = stepPanels[currentStep];
  const focusable = findFocusable(activePanel);

  if (focusable) {
    focusable.focus({ preventScroll: true });
    scrollFieldIntoView(focusable, { behavior: "auto" });
  }
}

function setPriceStatus(message, tone = "neutral") {
  priceStatus.textContent = message;
  priceStatus.dataset.tone = tone;
}

function applyState(state) {
  populateForm(state);
  saveState(state);
  updateCurrencyPrefixes(state.currency);
  render(state);
}

function startJourney({ step = 0, focus = true } = {}) {
  setJourneyVisibility(true);
  setCurrentStep(step, { focus });
}

function handleChange(event) {
  const state = collectState();
  saveState(state);
  updateCurrencyPrefixes(state.currency);
  render(state);

  if (event?.target?.name === "currency") {
    refreshLivePrices();
  }
}

async function refreshLivePrices() {
  const state = collectState();
  fetchPricesButton.disabled = true;
  setPriceStatus("Fetching live gold and silver prices...", "neutral");

  try {
    const livePrices = await fetchLatestMetalPrices(state.currency);
    const nextState = {
      ...state,
      goldPricePerGram: String(livePrices.goldPricePerGram),
      silverPricePerGram: String(livePrices.silverPricePerGram)
    };

    applyState(nextState);

    const goldUpdated = formatUpdateTime(livePrices.updatedAt.gold);
    const fxUpdated = formatUpdateTime(livePrices.updatedAt.fx);
    const parts = [
      `Live prices loaded in ${livePrices.currency}.`,
      goldUpdated ? `Gold API updated ${goldUpdated}.` : null,
      livePrices.currency !== "USD" && fxUpdated ? `FX updated ${fxUpdated}.` : null
    ].filter(Boolean);

    setPriceStatus(parts.join(" "), "success");
  } catch (error) {
    console.error(error);
    setPriceStatus("Could not load live prices. You can still enter gold and silver prices manually.", "error");
  } finally {
    fetchPricesButton.disabled = false;
  }
}

const initialState = loadState();
populateForm(initialState);
updateCurrencyPrefixes(initialState.currency);
render(initialState);
setJourneyVisibility(false);
renderStep();
setPriceStatus("Use live prices or enter them manually.", "neutral");

form.addEventListener("input", handleChange);
form.addEventListener("change", handleChange);
form.addEventListener("focusin", (event) => {
  const field = event.target;

  if (!(field instanceof HTMLElement) || !field.matches(NAVIGABLE_FIELD_SELECTOR)) {
    return;
  }

  requestAnimationFrame(() => {
    scrollFieldIntoView(field, { behavior: "smooth" });
  });

  window.setTimeout(() => {
    if (document.activeElement === field) {
      scrollFieldIntoView(field, { behavior: "smooth" });
    }
  }, 180);
});

form.addEventListener("keydown", (event) => {
  const field = event.target;

  if (
    event.key !== "Enter"
    || event.shiftKey
    || event.altKey
    || event.ctrlKey
    || event.metaKey
    || !(field instanceof HTMLElement)
    || !field.matches(TEXT_INPUT_SELECTOR)
  ) {
    return;
  }

  event.preventDefault();
  focusAdjacentField(field);
});

enterJourneyButton.addEventListener("click", () => {
  startJourney();
});

learnOpenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openLearnModal(button);
  });
});

learnCloseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closeLearnModal();
  });
});

backButton.addEventListener("click", () => {
  setCurrentStep(currentStep - 1);
});

nextButton.addEventListener("click", () => {
  setCurrentStep(currentStep + 1);
});

stepButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setCurrentStep(Number(button.dataset.stepJump));
  });
});

resetButton.addEventListener("click", () => {
  form.reset();
  applyState(defaultState);
  setPriceStatus("Use live prices or enter them manually.", "neutral");
  setCurrentStep(0, { focus: false });
});

fetchPricesButton.addEventListener("click", () => {
  refreshLivePrices();
});

printButton.addEventListener("click", () => {
  if (!latestRender) {
    return;
  }

  window.print();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && learnModal && !learnModal.hidden) {
    closeLearnModal();
  }
});

window.addEventListener("resize", updateKeyboardViewport);

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", () => {
    updateKeyboardViewport();

    const activeField = document.activeElement;

    if (activeField instanceof HTMLElement && activeField.matches(NAVIGABLE_FIELD_SELECTOR)) {
      scrollFieldIntoView(activeField, { behavior: "smooth" });
    }
  });
}

if (!initialState.goldPricePerGram && !initialState.silverPricePerGram) {
  refreshLivePrices();
}
