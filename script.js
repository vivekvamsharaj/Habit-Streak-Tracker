const KEY = "habitTracker30_v2";

let habits = JSON.parse(localStorage.getItem(KEY) || "[]");
let editingId = null;

function save() {
    localStorage.setItem(KEY, JSON.stringify(habits));
    render();
}

function addHabit() {
    const input = document.getElementById("habitInput");
    const name = input.value.trim();

    if (!name) {
        alert("Please enter a habit name.");
        input.focus();
        return;
    }

    const category = document.getElementById("category").value;

    habits.push({
        id: Date.now(),
        name: name,
        category: category,
        days: []
    });

    input.value = "";
    save();
}

document.getElementById("habitInput").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        addHabit();
    }
});

function toggleDay(id, day) {
    const habit = habits.find(h => h.id === id);

    if (!habit) return;

    if (habit.days.includes(day)) {
        habit.days = habit.days.filter(d => d !== day);
    } else {
        habit.days.push(day);
    }

    save();
}

function currentStreak(habit) {
    if (!habit.days || habit.days.length === 0) {
        return 0;
    }

    const completed = [...new Set(habit.days)].sort((a, b) => a - b);

    let streak = 1;

    for (let i = completed.length - 1; i > 0; i--) {
        if (completed[i] - completed[i - 1] === 1) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

function bestStreak(habit) {
    let best = 0;
    let run = 0;

    for (let day = 1; day <= 30; day++) {
        if (habit.days.includes(day)) {
            run++;
            best = Math.max(best, run);
        } else {
            run = 0;
        }
    }

    return best;
}

function badgesFor(habit) {
    const badges = [];
    const best = bestStreak(habit);
    const total = habit.days.length;

    if (total >= 3) {
        badges.push("🥉 3 Days");
    }

    if (best >= 7) {
        badges.push("🥈 7-Day Streak");
    }

    if (best >= 14) {
        badges.push("🥇 14-Day Streak");
    }

    if (total >= 30) {
        badges.push("🏆 30-Day Champion");
    }

    return badges;
}

function render() {
    const list = document.getElementById("habitList");

    list.innerHTML = "";

    if (habits.length === 0) {
        list.innerHTML = `
            <div class="empty">
                <h2>🌱 No habits yet</h2>
                <p>Add your first habit and start building a streak!</p>
            </div>
        `;
    }

    let totalCompleted = 0;
    let best = 0;

    habits.forEach(habit => {
        totalCompleted += habit.days.length;
        best = Math.max(best, bestStreak(habit));

        const percentage = Math.round(
            habit.days.length / 30 * 100
        );

        const streak = currentStreak(habit);

        const card = document.createElement("section");
        card.className = "habit-card";

        card.innerHTML = `
            <div class="habit-head">

                <div class="habit-title">
                    <h2>${escapeHtml(habit.name)}</h2>
                    <span class="category">
                        ${escapeHtml(habit.category)}
                    </span>
                </div>

                <div class="habit-actions">

                    <span class="streak">
                        🔥 ${streak}
                        Day${streak === 1 ? "" : "s"} Streak
                    </span>

                    <button
                        class="action"
                        onclick="openEdit(${habit.id})">
                        ✏️ Edit
                    </button>

                    <button
                        class="action delete"
                        onclick="deleteHabit(${habit.id})">
                        Delete
                    </button>

                </div>

            </div>

            <div class="progress-row">
                <span>Progress</span>
                <b>
                    ${habit.days.length}/30 days
                    (${percentage}%)
                </b>
            </div>

            <div class="progress">
                <span style="width:${percentage}%"></span>
            </div>

            <div class="days">
                ${createDays(habit)}
            </div>

            <div class="habit-footer">
                <span>
                    Completed: ${habit.days.length}/30
                </span>

                <span>
                    Best Streak: ${bestStreak(habit)} 🔥
                </span>
            </div>
        `;

        list.appendChild(card);
    });

    document.getElementById("habitCount").textContent = habits.length;

    document.getElementById("completedCount").textContent =
        totalCompleted;

    document.getElementById("overallRate").textContent =
        habits.length
            ? Math.round(
                totalCompleted /
                (habits.length * 30) *
                100
            ) + "%"
            : "0%";

    document.getElementById("bestStreak").textContent = best;

    renderChart();
    renderBadges();
}

function createDays(habit) {
    let html = "";

    for (let day = 1; day <= 30; day++) {
        const completed = habit.days.includes(day);

        html += `
            <button
                class="day ${completed ? "done" : ""}"
                onclick="toggleDay(${habit.id}, ${day})">
                ${completed ? "✓ " : ""}
                ${day}
            </button>
        `;
    }

    return html;
}

function renderChart() {
    const chart = document.getElementById("chart");
    const days = [];

    for (let i = 0; i < 7; i++) {
        const date = new Date();

        date.setDate(
            date.getDate() - (6 - i)
        );

        const day = date.getDate();

        const count = habits.reduce(
            (total, habit) => {
                return total +
                    (habit.days.includes(day) ? 1 : 0);
            },
            0
        );

        days.push({
            label: date.toLocaleDateString(
                undefined,
                { weekday: "short" }
            ),
            count: count
        });
    }

    const max = Math.max(
        1,
        ...days.map(x => x.count)
    );

    chart.innerHTML = days.map(day => {
        const height = Math.max(
            3,
            day.count / max * 110
        );

        return `
            <div class="bar-wrap">

                <span class="bar-value">
                    ${day.count}
                </span>

                <div
                    class="bar"
                    style="height:${height}px">
                </div>

                <span class="bar-label">
                    ${day.label}
                </span>

            </div>
        `;
    }).join("");
}

function renderBadges() {
    const container =
        document.getElementById("badges");

    const allBadges = [];

    habits.forEach(habit => {
        badgesFor(habit).forEach(badge => {
            allBadges.push(
                `${badge} • ${habit.name}`
            );
        });
    });

    if (allBadges.length === 0) {
        container.innerHTML = `
            <span class="badge">
                🌱 Complete 3 days to unlock your first badge
            </span>
        `;
        return;
    }

    container.innerHTML = allBadges.map(
        badge => `
            <span class="badge">
                ${escapeHtml(badge)}
            </span>
        `
    ).join("");
}

function deleteHabit(id) {
    const habit = habits.find(h => h.id === id);

    if (!habit) return;

    if (confirm(`Delete "${habit.name}"?`)) {
        habits = habits.filter(h => h.id !== id);
        save();
    }
}

function openEdit(id) {
    const habit = habits.find(h => h.id === id);

    if (!habit) return;

    editingId = id;

    document.getElementById("editName").value =
        habit.name;

    document.getElementById("editCategory").value =
        habit.category;

    document.getElementById("editModal")
        .classList.add("show");
}

function closeModal() {
    document.getElementById("editModal")
        .classList.remove("show");

    editingId = null;
}

function saveEdit() {
    const habit = habits.find(h => h.id === editingId);

    if (!habit) return;

    const name =
        document.getElementById("editName")
        .value.trim();

    if (!name) {
        alert("Habit name cannot be empty.");
        return;
    }

    habit.name = name;

    habit.category =
        document.getElementById("editCategory")
        .value;

    closeModal();
    save();
}

function toggleDark() {
    document.body.classList.toggle("dark");

    const isDark =
        document.body.classList.contains("dark");

    localStorage.setItem(
        "habitDark",
        isDark
    );

    document.getElementById("themeBtn")
        .textContent =
        isDark ? "☀️ Light" : "🌙 Dark";
}

function escapeHtml(text) {
    return text.replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[character])
    );
}

if (
    localStorage.getItem("habitDark") === "true"
) {
    document.body.classList.add("dark");

    document.getElementById("themeBtn")
        .textContent = "☀️ Light";
}

render();