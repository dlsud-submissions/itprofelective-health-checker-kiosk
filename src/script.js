// =====================================================================
// Health Self-Check Kiosk
// Demonstrates: if-else (validation), switch-case (BMI classification),
// and loops (field validation pass + rendering the session log).
// =====================================================================

// TODO: paste your deployed Google Apps Script Web App URL here.
// See the "Connecting to Google Sheets" guide for how to get this.
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyyYjw7dykia0zPiaZELhK0MoauGPitXeWq6--bj11m6U8PD1iXB9RjkMpCxC38ajkO/exec";

const form = document.getElementById("bmiForm");
const formStatus = document.getElementById("formStatus");
const resultCard = document.getElementById("resultCard");
const bmiValueEl = document.getElementById("bmiValue");
const gaugeFill = document.getElementById("gaugeFill");
const gaugeNeedle = document.getElementById("gaugeNeedle");
const resultGreeting = document.getElementById("resultGreeting");
const resultCategory = document.getElementById("resultCategory");
const resultMessage = document.getElementById("resultMessage");
const syncStatus = document.getElementById("syncStatus");
const resetBtn = document.getElementById("resetBtn");
const logList = document.getElementById("logList");
const logEmpty = document.getElementById("logEmpty");

// In-memory session log (array of past submissions this visit)
const sessionLog = [];

// Fields that must be present before we do anything else.
// Looping over this list lets us validate every field in one pass
// instead of writing a separate if-check for each one by hand.
const REQUIRED_FIELDS = [
  { id: "name", label: "Full Name" },
  { id: "age", label: "Age" },
  { id: "sex", label: "Sex" },
  { id: "weight", label: "Weight" },
  { id: "height", label: "Height" },
];

form.addEventListener("submit", function (e) {
  e.preventDefault();
  clearFieldErrors();

  const values = {
    name: document.getElementById("name").value.trim(),
    age: document.getElementById("age").value,
    sex: document.getElementById("sex").value,
    weight: document.getElementById("weight").value,
    height: document.getElementById("height").value,
  };

  // ---- LOOP: validate every required field in a single pass ----
  const missing = [];
  for (const field of REQUIRED_FIELDS) {
    const value = values[field.id];
    if (!value || String(value).trim() === "") {
      missing.push(field.label);
      markInvalid(field.id, "Required");
    }
  }

  if (missing.length > 0) {
    formStatus.textContent = `Please fill out: ${missing.join(", ")}.`;
    return;
  }

  const age = parseFloat(values.age);
  const weight = parseFloat(values.weight);
  const heightCm = parseFloat(values.height);

  // ---- IF-ELSE: range / sanity validation ----
  if (isNaN(age) || age <= 0 || age > 120) {
    markInvalid("age", "Enter an age between 1 and 120");
    formStatus.textContent = "Please enter a valid age.";
    return;
  } else if (isNaN(weight) || weight <= 0) {
    markInvalid("weight", "Enter a weight greater than 0");
    formStatus.textContent = "Please enter a valid weight.";
    return;
  } else if (isNaN(heightCm) || heightCm <= 0) {
    markInvalid("height", "Enter a height greater than 0");
    formStatus.textContent = "Please enter a valid height.";
    return;
  } else {
    formStatus.textContent = "";
  }

  const heightM = heightCm / 100;
  const bmi = +(weight / (heightM * heightM)).toFixed(1);

  let category, message, badgeClass, gaugeColor;

  // ---- SWITCH-CASE: classify BMI into a category ----
  switch (true) {
    case bmi < 18.5:
      category = "Underweight";
      message =
        "Consider a balanced, calorie-sufficient diet. Small, frequent meals can help.";
      badgeClass = "badge--underweight";
      gaugeColor = "#5fa8d3";
      break;
    case bmi < 25:
      category = "Normal";
      message =
        "Great! Keep up your healthy habits with regular activity and balanced meals.";
      badgeClass = "badge--normal";
      gaugeColor = "#4ade9c";
      break;
    case bmi < 30:
      category = "Overweight";
      message =
        "Consider more physical activity and mindful eating to move toward a healthy range.";
      badgeClass = "badge--overweight";
      gaugeColor = "#e8a44c";
      break;
    default:
      category = "Obese";
      message =
        "We recommend consulting a healthcare provider for a personalized plan.";
      badgeClass = "badge--obese";
      gaugeColor = "#e8664f";
  }

  showResult(values.name, bmi, category, message, badgeClass, gaugeColor);
  addToLog({ name: values.name, bmi, category, badgeClass });
  recordSubmission({
    name: values.name,
    age,
    sex: values.sex,
    weight,
    heightCm,
    bmi,
    category,
  });
});

resetBtn.addEventListener("click", function () {
  form.reset();
  clearFieldErrors();
  resultCard.classList.add("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
});

function markInvalid(fieldId, message) {
  const input = document.getElementById(fieldId);
  input.classList.add("invalid");
  const err = document.getElementById(`err-${fieldId}`);
  if (err) err.textContent = message;
}

function clearFieldErrors() {
  for (const field of REQUIRED_FIELDS) {
    document.getElementById(field.id).classList.remove("invalid");
    const err = document.getElementById(`err-${field.id}`);
    if (err) err.textContent = "";
  }
}

function showResult(name, bmi, category, message, badgeClass, gaugeColor) {
  resultCard.classList.remove("hidden");
  bmiValueEl.textContent = bmi.toFixed(1);
  resultGreeting.textContent = `${name}, here's your reading:`;

  resultCategory.textContent = category;
  resultCategory.className = `badge ${badgeClass}`;
  resultMessage.textContent = message;

  // Map BMI (clamped 15-40) onto the 0-180deg gauge sweep
  const clamped = Math.min(Math.max(bmi, 15), 40);
  const percent = ((clamped - 15) / (40 - 15)) * 100;
  const angleDeg = (percent / 100) * 180;

  gaugeFill.style.stroke = gaugeColor;
  gaugeFill.style.strokeDashoffset = String(100 - percent);
  gaugeNeedle.style.transform = `rotate(${angleDeg - 90}deg)`;

  resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function addToLog(entry) {
  sessionLog.unshift(entry);
  if (sessionLog.length > 8) sessionLog.pop();
  renderLog();
}

// ---- LOOP: render every entry in the session log ----
function renderLog() {
  logList.innerHTML = "";

  if (sessionLog.length === 0) {
    logList.appendChild(logEmpty);
    return;
  }

  sessionLog.forEach((entry) => {
    const li = document.createElement("li");

    const left = document.createElement("span");
    left.textContent = `${entry.name} — BMI ${entry.bmi.toFixed(1)}`;

    const right = document.createElement("span");
    right.textContent = entry.category;
    right.className = `log-cat ${entry.badgeClass}`;

    li.appendChild(left);
    li.appendChild(right);
    logList.appendChild(li);
  });
}

// ---- Send the submission to the Google Apps Script Web App ----
function recordSubmission(record) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === "YOUR_WEB_APP_URL") {
    syncStatus.textContent =
      "Not saved to Google Sheet yet — add your Apps Script URL in script.js.";
    return;
  }

  syncStatus.textContent = "Saving to Google Sheet…";

  fetch(APPS_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(record),
  })
    .then(() => {
      syncStatus.textContent = "Saved to Google Sheet.";
    })
    .catch((err) => {
      console.error("Could not record submission:", err);
      syncStatus.textContent =
        "Could not reach Google Sheet (saved locally only).";
    });
}
