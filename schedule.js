const DEBUG = true;
import { sendResizeMessage } from "./resize-iframe.js";
const KEY_CLASS = 0;
const KEY_TEACHER = 1;
const KEY_SUBJECT = 2;
const KEY_ROOM = 3;
const KEY_DAY = 4;
const KEY_HOUR = 5;
const KEY_WEEK = 6;
const KEY_MONITOR_PLACE = 0;
const KEY_MONITOR_TEACHER = 1;
const KEY_MONITOR_WEEK = 2;
const KEY_MONITOR_DAY = 3;
const KEY_MONITOR_BEFORE_HOUR = 4;
const WEEK_TITLES = {
    A: "Woche A (ungerade Wochen)",
    B: "Woche B (gerade Wochen)",
};
const ROOMS_WITH_INFO = ["N2.10", "N2.12", "N3.25", "131"];
var time = null;
var schedule = [];
var classes = [];
var rooms = [];
var teachers = [];
var subjects = [];
var monitors = [];
const teacherSelect = document.getElementById("teacher");
const classSelect = document.getElementById("class");
const roomSelect = document.getElementById("room");
const subjectSelect = document.getElementById("subject");
const title = document.getElementById("title");
const timeDisplay = document.getElementById("time");
const schedules = document.getElementById("schedules");
const weekTpl = document.getElementById("weekTpl")
    .content.firstElementChild;
const hourTpl = document.getElementById("hourTpl")
    .content.firstElementChild;
const entryTpl = document.getElementById("entryTpl")
    .content.firstElementChild;
const monitorTpl = document.getElementById("monitorTpl").content.firstElementChild;
function onSelectionChange(ev) {
    document.querySelectorAll("select").forEach((element) => {
        if (element.id !== ev.target.id) {
            element.value = "0";
        }
    });
    refreshSchedule();
}
function refreshForm() {
    timeDisplay.textContent = time.toLocaleDateString();
    document
        .querySelectorAll("select option")
        .forEach((element) => element.remove());
    teachers.forEach((teacher, i) => {
        const option = document.createElement("option");
        option.value = `${i}`;
        option.textContent = teacher;
        if (teacher === localStorage.getItem("teacher")) {
            option.selected = true;
            title.textContent = ` von ${teacher}`;
        }
        teacherSelect.appendChild(option);
    });
    const optionAvailableTeachers = document.createElement("option");
    optionAvailableTeachers.value = "-1";
    optionAvailableTeachers.textContent = "Freistunden";
    optionAvailableTeachers.classList.add("show-available-teachers-info");
    teacherSelect.add(optionAvailableTeachers, 1);
    rooms.forEach((room, i) => {
        const option = document.createElement("option");
        option.value = `${i}`;
        option.textContent = room;
        if (ROOMS_WITH_INFO.includes(room)) {
            option.classList.add("show-room-info");
        }
        roomSelect.appendChild(option);
    });
    const optionAvailableRooms = document.createElement("option");
    optionAvailableRooms.value = "-1";
    optionAvailableRooms.textContent = "freie Räume";
    roomSelect.add(optionAvailableRooms, 1);
    classes.forEach((className, i) => {
        const option = document.createElement("option");
        option.value = `${i}`;
        option.textContent = className;
        classSelect.appendChild(option);
    });
    subjects.forEach((subject, i) => {
        const option = document.createElement("option");
        option.value = `${i}`;
        option.textContent = subject;
        subjectSelect.appendChild(option);
    });
}
function refreshTitle() {
    const selectedTeacher = teacherSelect.querySelector(":checked").textContent;
    const selectedClass = classSelect.querySelector(":checked").textContent;
    const selectedRoom = roomSelect.querySelector(":checked").textContent;
    if (selectedTeacher) {
        title.textContent = `Stundenplan von ${selectedTeacher}`;
    }
    else if (selectedClass) {
        title.textContent = `Stundenplan der ${selectedClass}`;
    }
    else if (selectedRoom) {
        title.textContent = `Raumplan von Raum ${selectedRoom}`;
    }
    else {
        title.textContent = "";
    }
}
function refreshSchedule() {
    refreshTitle();
    schedules.innerHTML = "";
    const teacherId = parseInt(teacherSelect.value);
    const roomId = parseInt(roomSelect.value);
    const classId = parseInt(classSelect.value);
    const subjectId = parseInt(subjectSelect.value);
    if (teacherId === 0 && roomId === 0 && classId === 0 && subjectId === 0) {
        sendResizeMessage();
        return;
    }
    let highlightDay = new Date().getDay();
    let highlightWeek = getWeekNumber() % 2 === 1 ? "A" : "B";
    // On Weekends: highlight left most column of the following week
    if (highlightDay === 6) {
        highlightDay = 0;
    }
    if (highlightDay === 0) {
        highlightWeek = highlightWeek === "A" ? "B" : "A";
    }
    ["A", "B"].forEach((week) => {
        const weekEle = weekTpl.cloneNode(true);
        weekEle.dataset.week = week;
        schedules.appendChild(weekEle);
        weekEle.querySelector(".week-title").textContent = WEEK_TITLES[week];
        for (let hour = 1; hour <= 10; ++hour) {
            const hourEle = hourTpl.cloneNode(true);
            hourEle.dataset.hour = hour.toString();
            for (let day = 1; day <= 5; ++day) {
                hourEle.querySelectorAll("td")[day].dataset.time = `${day}-${hour}`;
            }
            hourEle.querySelectorAll("td")[0].textContent = `${hour}`;
            weekEle.querySelector("tbody").appendChild(hourEle);
            if (teacherId === -1) {
                showAvailableTeachers(hourEle, week);
                continue;
            }
            if (roomId === -1) {
                showAvailableRooms(hourEle, week);
                continue;
            }
            schedule.forEach((entry) => {
                if (entry.hour !== hour)
                    return;
                if (entry.week !== "" && entry.week !== week)
                    return;
                if (classId !== 0 && entry.classId !== classId)
                    return;
                if (teacherId !== 0 && entry.teacherId !== teacherId)
                    return;
                if (roomId !== 0 && entry.roomId !== roomId)
                    return;
                if (subjectId !== 0 && entry.subject !== subjects[subjectId])
                    return;
                insertEntry(hourEle, entry);
            });
        }
        if (week === highlightWeek) {
            weekEle
                .querySelectorAll(`:is(th, td):nth-child(${highlightDay + 1})`)
                .forEach((element) => element.classList.add("highlight"));
        }
        joinHoursToBlocks(weekEle);
        if (teacherId !== 0) {
            insertMonitors(weekEle, teacherId);
        }
        deleteEmptyRowsAndWeeks(weekEle);
    });
    sendResizeMessage();
}
function showAvailableTeachers(hourEle, week) {
    let hour = parseInt(hourEle.dataset.hour);
    if (hour % 2 === 0) {
        hour--;
    }
    for (let day = 1; day <= 5; ++day) {
        let possibleTeachers = [];
        schedule.forEach((entry) => {
            if (entry.hour !== hour - 2 &&
                entry.hour !== hour - 1 &&
                entry.hour !== hour + 2 &&
                entry.hour !== hour + 3)
                return;
            if (entry.week !== "" && entry.week !== week)
                return;
            if (entry.day !== day)
                return;
            if (!entry.teacherId)
                return;
            if (possibleTeachers.indexOf(entry.teacherId) === -1) {
                possibleTeachers.push(entry.teacherId);
            }
        });
        schedule.forEach((entry) => {
            if (entry.hour !== hour && entry.hour !== hour + 1)
                return;
            if (entry.week !== "" && entry.week !== week)
                return;
            if (entry.day !== day)
                return;
            if (!entry.teacherId)
                return;
            if (possibleTeachers.indexOf(entry.teacherId) !== -1) {
                delete possibleTeachers[possibleTeachers.indexOf(entry.teacherId)];
            }
        });
        possibleTeachers.sort((a, b) => {
            return teachers[a].localeCompare(teachers[b]);
        });
        possibleTeachers.forEach((id) => {
            const div = document.createElement("div");
            div.textContent = teachers[id];
            hourEle.querySelectorAll("td")[day].appendChild(div);
        });
    }
}
function showAvailableRooms(hourEle, week) {
    const hour = parseInt(hourEle.dataset.hour);
    for (let day = 1; day <= 5; ++day) {
        let possibleRooms = [...rooms.keys()];
        schedule.forEach((entry) => {
            if (entry.hour !== hour)
                return;
            if (entry.week !== "" && entry.week !== week)
                return;
            if (entry.day !== day)
                return;
            if (!entry.roomId)
                return;
            if (entry.roomId in possibleRooms) {
                delete possibleRooms[possibleRooms.indexOf(entry.roomId)];
            }
        });
        possibleRooms.forEach((id) => {
            const div = document.createElement("div");
            div.textContent = rooms[id];
            hourEle.querySelectorAll("td")[day].appendChild(div);
        });
    }
}
function insertEntry(hourEle, entry) {
    const entryEle = entryTpl.cloneNode(true);
    hourEle.querySelectorAll("td")[entry.day].appendChild(entryEle);
    entryEle.querySelector(".entry__class").textContent = classes[entry.classId];
    entryEle.querySelector(".entry__teacher").textContent =
        teachers[entry.teacherId];
    entryEle.querySelector(".entry__room").textContent = rooms[entry.roomId];
    entryEle.querySelector(".entry__subject").textContent = entry.subjectAndType;
}
function joinHoursToBlocks(weekEle) {
    for (let hour = 1; hour <= 10; hour += 2) {
        for (let day = 1; day <= 5; day++) {
            const tdOdd = weekEle.querySelector(`td[data-time="${day}-${hour}"]`);
            const tdEven = weekEle.querySelector(`td[data-time="${day}-${hour + 1}"]`);
            if (tdOdd.innerHTML === tdEven.innerHTML) {
                tdOdd.rowSpan = 2;
                tdEven.remove();
            }
        }
    }
}
function insertMonitors(weekEle, teacherId) {
    const week = weekEle.dataset.week;
    monitors.forEach((entry) => {
        if (entry[KEY_MONITOR_TEACHER] !== teacherId ||
            entry[KEY_MONITOR_WEEK] !== week) {
            return;
        }
        const monitorEle = monitorTpl.cloneNode(true);
        monitorEle.firstElementChild.textContent = entry[KEY_MONITOR_PLACE];
        weekEle
            .querySelector(`[data-time="${entry[KEY_MONITOR_DAY]}-${entry[KEY_MONITOR_BEFORE_HOUR]}"]`)
            .prepend(monitorEle);
    });
}
/**
 * workaround for browsers without :has css selector
 */
function deleteEmptyRowsAndWeeks(weekEle) {
    for (let hour = 9; hour >= 1; hour -= 2) {
        const div = weekEle.querySelector(`tbody tr:nth-child(${hour}) td:not(:first-child) div, tbody tr:nth-child(${hour + 1}) td:not(:first-child) div`);
        if (div !== null) {
            break;
        }
        weekEle.querySelector(`tbody tr:last-child`).remove();
        weekEle.querySelector(`tbody tr:last-child`).remove();
        if (hour === 1) {
            weekEle.remove();
        }
    }
}
function getWeekNumber() {
    // https://stackoverflow.com/questions/6117814/get-week-of-year-in-javascript-like-in-php
    const d = new Date();
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    var yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
fetch(DEBUG ? "data/schedule.json" : "json.php")
    .then((response) => response.json())
    .then((json) => {
    time = new Date(json.time);
    classes = json.classes;
    rooms = json.rooms;
    teachers = json.teachers;
    monitors = json.monitors;
    schedule = json.schedule.map((entry) => {
        return {
            classId: entry[KEY_CLASS],
            teacherId: entry[KEY_TEACHER],
            subject: entry[KEY_SUBJECT].replace(/(\d+| (BK|NK|VK|GK|LK).*$)/g, ""),
            roomId: entry[KEY_ROOM],
            day: entry[KEY_DAY],
            hour: entry[KEY_HOUR],
            week: entry[KEY_WEEK],
            subjectAndType: entry[KEY_SUBJECT],
        };
    });
    subjects = [
        "",
        ...new Set(schedule
            .map((entry) => entry.subject)
            .filter((subject) => subject !== "")),
    ];
    subjects.sort();
    refreshForm();
    refreshSchedule();
});
teacherSelect.addEventListener("change", (ev) => {
    const selectedText = teacherSelect.querySelector(":checked").textContent;
    localStorage.setItem("teacher", selectedText);
    onSelectionChange(ev);
});
classSelect.addEventListener("change", (ev) => onSelectionChange(ev));
roomSelect.addEventListener("change", onSelectionChange);
subjectSelect.addEventListener("change", onSelectionChange);
document
    .getElementById("print")
    .addEventListener("click", () => window.print());
