const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const selectedCourseList = [];

function createRow(row) {
    for (let j = 0; j < 7; j++) {
        // create empty td element for each day of the week
        let cell = document.createElement("td");
        cell.setAttribute("class", `${daysOfWeek[j]}-cell`);
        // let tdText = document.createTextNode("empty");
        // cell.appendChild(tdText);

        row.appendChild(cell);
    }
}


let courseData = [];
let timeblocks = [];

function parseCSVTimeblock(file) {
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: function (results) {
            timeblocks = results.data;
        }
    });
}




// Function to parse CSV file and store the data in courseData
function parseCSV(file) {
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: function (results) {
            courseData = results.data;
        }
    });
}

// Function to find a course by its course code
function find_course(courseQuery) {
    const matchingCourses = courseData.filter(course => course.COURSE.startsWith(courseQuery));
    return matchingCourses;
}

function initializeApp() {
    for (let i = 0; i < tablinks.length; i++) {
        let subjName = tablinks[i].innerText;
        let subjID = tablinks[i].id;
        let subjDiv = document.createElement("div");
        let subjTitle = document.createElement("h2");
        let titleText = document.createTextNode(subjName);
        subjTitle.appendChild(titleText);
        subjTitle.setAttribute("class", "subj-title");
        
        // This will have to be filled with the subj courses. Will have to use SQL.
        let subjTemp = document.createTextNode(`This will be filled with ${subjName} courses.`);

        let coursesDiv = document.createElement("div");
        coursesDiv.setAttribute("class", "courseBtn-flexbox");



        subjDiv.appendChild(subjTitle);
        

        // This code makes it not work
        let matchingCourses = find_course(subjID.slice(0, subjID.indexOf("-")));
        
        for (let j = 0; j < matchingCourses.length; j++) {
            // let courseBtn = document.createElement("button");
            // courseBtn.setAttribute("class", "course-btn");
            const courseOptionContainer = document.createElement("div");
            courseOptionContainer.setAttribute("class", "course-option-container");

            const courseInfo = document.createElement("div");
            courseInfo.setAttribute("class", "course-info");
            const courseTitleHeading = document.createElement("h5");
            let courseText = document.createTextNode(`${matchingCourses[j].COURSE} ${matchingCourses[j].TITLE}`);
            courseTitleHeading.appendChild(courseText);
            let courseProfRoom = document.createTextNode(`${matchingCourses[j].PROFS} ${matchingCourses[j].ROOM}`);
            courseInfo.appendChild(courseTitleHeading);
            courseInfo.appendChild(courseText);
            courseInfo.appendChild(document.createElement("br"));
            courseInfo.appendChild(courseProfRoom);
            // coursesDiv.appendChild(courseBtn);

            const timesDiv = document.createElement("div");
            timesDiv.setAttribute("class", "course-times-div");
            timesDiv.appendChild(document.createTextNode(matchingCourses[j].TERM));
            const allTimeBlocks = matchingCourses[j].TIMEBLOCK.split("/");
            for (period of allTimeBlocks) {
                const blockToTimes = translateTimeblock(period, timeblocks);
                const dayOfClass = blockToTimes[1];
                const classTimes = blockToTimes[5];
                timesDiv.appendChild(document.createElement("br"));
                timesDiv.appendChild(document.createTextNode(`${dayOfClass}: ${classTimes}`));
            }

            const courseBtn = document.createElement("button");
            courseBtn.setAttribute("class", "course-btn");
            courseBtn.appendChild(document.createTextNode("Add Course"));

            courseOptionContainer.appendChild(courseInfo);
            courseOptionContainer.appendChild(timesDiv);
            courseOptionContainer.appendChild(courseBtn);

            coursesDiv.appendChild(courseOptionContainer);

        }
        
        

        subjDiv.appendChild(coursesDiv);

        if (coursesDiv.innerHTML === "") {
            subjDiv.appendChild(subjTemp);   
        }

        subjDiv.setAttribute("class", "tabcontent");
        subjDiv.setAttribute("id", `tab-${subjID.slice(0, subjID.indexOf("-"))}`)

        searchDiv.appendChild(subjDiv);
    }
}

const scheduleTable = document.getElementById("schedule");
const scheduleTableBody = scheduleTable.getElementsByTagName("tbody")[0];
const tablinks = document.getElementsByClassName("tablink");
const searchDiv = document.getElementById("course-search");

document.addEventListener("DOMContentLoaded", () => {

    for (let i = 0; i < 15; i++) {
        // table row creation
        // one for every half-houur

        let hour = 8 + i;

        let row = document.createElement("tr");

        let timeCell = document.createElement("th");
        let timeText = document.createTextNode(`${hour}:00`);

        timeCell.appendChild(timeText);
        timeCell.setAttribute("rowspan", "4");
        timeCell.setAttribute("class", "timelabel");
        row.appendChild(timeCell);
        
        createRow(row);

        scheduleTableBody.appendChild(row);

        for (let i = 0; i < 3; i++) {
            let row = document.createElement("tr");
            createRow(row);
            scheduleTableBody.appendChild(row);
        }
    }
    
    /*
    const firstRow = scheduleTableBody.getElementsByTagName("tr")[1];
    const mondayCell = scheduleTableBody.getElementsByTagName("td")[1];
    mondayCell.setAttribute("rowspan", "4");
    let someText = document.createTextNode("test");
    mondayCell.appendChild(someText);
    */
    
    fetch('timeblockgrid.csv')
        .then(response => response.text())
        .then(data => {
            return parseCSVTimeblock(data);
        });


    
    fetch('stfx-tbl-copy.csv')
        .then(response => response.text())
        .then(data => {
            return parseCSV(data);
        })
        .then(() => {
            // Call the initializeApp function once parsing is complete
            initializeApp();
        })
        .then(() => {
            document.getElementById("defaultOpen-btn").click();
        })
        .then(() => {
            document.getElementById("defaultOpen-btn").remove();
        })
        .then(() => {
            const courseBtns = Array.from(document.getElementsByClassName("course-btn"));
            courseBtns.forEach(btn => {
                btn.addEventListener('click', function handleClick() {
                    console.log('course clicked');
                    // console.log(btn.innerHTML.split(" ").slice(0,2));
                    let courseBtnCourseArr = btn.parentElement.firstElementChild.innerHTML.split(" ").slice(0,2)
                    let btnCourseMatch = `${courseBtnCourseArr[0]} ${courseBtnCourseArr[1]}`
                    let specificCourse = courseData.find(course => course.COURSE == btnCourseMatch);
                    console.log(`${courseBtnCourseArr[0]} ${courseBtnCourseArr[1]}`)
                    console.log(specificCourse.TIMEBLOCK);

                    if (!(selectedCourseList.includes(`${specificCourse.COURSE.replace(/\s/g, "")}-added`))) {
                        let timeblockArr = specificCourse.TIMEBLOCK.split("/");
                        for (let i = 0; i < timeblockArr.length; i++) {
                            addToSchedule([specificCourse.COURSE, specificCourse.PROFS, specificCourse.ROOM], timeblockArr[i], timeblocks);
                        }
    
                        // Keep track of selected courses 
                        const selectedCourse = document.createElement("div");
                        selectedCourse.setAttribute("class", "selected-course");
                        selectedCourse.setAttribute("id", `${specificCourse.COURSE.replace(/\s/g, "")}-added`);
                        selectedCourse.setAttribute("data-timeblock", specificCourse.TIMEBLOCK);
                        
                        const selectedCourseTitle = document.createElement("h4");
                        selectedCourseTitle.appendChild(document.createTextNode(`${specificCourse.COURSE} ${specificCourse.TITLE}`));
                        selectedCourse.appendChild(selectedCourseTitle);
    
                        const selectedCourseInfo = document.createElement("p");
                        selectedCourseInfo.appendChild(document.createTextNode(`${specificCourse.TERM}\n${specificCourse.PROFS}\n${specificCourse.ROOM}`));
                        selectedCourse.appendChild(selectedCourseInfo);
    
                        const selectedCourseFlex = document.createElement("div");
                        selectedCourseFlex.setAttribute("class", "selected-course-container");
                        selectedCourseFlex.appendChild(selectedCourse);
    
                        const courseRemoveBtn = document.createElement("button");
                        courseRemoveBtn.appendChild(document.createTextNode("Remove"));
                        courseRemoveBtn.setAttribute("onclick", "removeFromSelection(this)");
                        selectedCourseFlex.appendChild(courseRemoveBtn);
    
                        // courseRemoveBtn.addEventListener("click", removeCourse()
    
                        const selectedCoursesDiv = document.getElementById("selected-courses-div");
                        selectedCoursesDiv.appendChild(selectedCourseFlex);
    
                        // removeFromSelection(selectedCourseInfo);
                        selectedCourseList.push(`${specificCourse.COURSE.replace(/\s/g, "")}-added`);
                    }
                })
            })
        })
        .catch(error => {
            console.error('Error fetching or parsing CSV file:', error);
        });
    

    
    


    // Display default message in courses div
    /*
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    */
    // document.getElementById("defaultOpen-btn").click();
    // document.getElementById("defaultOpen-btn").remove();
});

function openPage(pageName, elmnt, color) {
    // Hide all elements with class="tabcontent" by default */
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Revome the background color of all tablinks/buttons
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].style.backgroundColor = "";
    }

    // Show the specific content
    document.getElementById("tab-" + pageName).style.display = "block";

    // Add the specific colour to the button used to open the tab content
    elmnt.style.backgroundColor = color;
}

const sundayCell = 0;
const mondayCell = 1;
const tuesdayCell = 2;
const wednesdayCell = 3;
const thursdayCell = 4;
const fridayCell = 5;
const saturdayCell = 6;

function cellDayID(dayString, row) {
    const dayData = dayString.slice(0, 3);
}

function translateTimeblock(block, keys) {
    const startBlock = keys.find(key => key.Timeblock === block);
    const startToFinish = `${startBlock.Start}-${startBlock.End}`;
    console.log(startBlock);
    let startHour = parseInt(startBlock.Start.slice(0, startBlock.Start.indexOf(":")));
    let startMin = parseInt(startBlock.Start.slice(startBlock.Start.indexOf(":") + 1, startBlock.Start.indexOf(":") + 3));
    let startMinBlock = startMin / 15;
    console.log(startHour, startMin);

    if (startBlock.Start[startBlock.Start.length - 2] === 'P' && startHour < 12) {
        startHour = startHour + 12;
    }
    console.log(startHour);
    console.log(scheduleTableBody[0]);
    const startTime = 4 * (startHour - 7) - 3 + startMinBlock;
    const startRow = scheduleTableBody.getElementsByTagName("tr")[startTime];

    console.log(startRow);
    const daysInRow = startRow.getElementsByTagName("td");
    const blockDay = startBlock.Day;
    console.log(daysInRow);
    console.log(blockDay);

    const duration = getBlockDuration(block, keys, startHour, startMin);

    return [daysInRow, blockDay, duration, startRow, startTime, startToFinish];
}

function getBlockDuration(block, keys, startHour, startMin) {
    console.log(block, keys, startHour, startHour);
    const endBlock = keys.find(key => key.Timeblock === block);

    let endHour = parseInt(endBlock.End.slice(0, endBlock.End.indexOf(":")));
    let endMin = parseInt(endBlock.End.slice(endBlock.End.indexOf(":") + 1, endBlock.End.indexOf(":") + 3));
    // let restOfBlock = 0;
    if (endBlock.End[endBlock.End.length - 2] === 'P' && endHour < 12) {
        endHour += 12;
    }
    console.log(endHour, endMin);

    const rowSpan = Math.ceil(((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 15);

    /*
    if (endMin > 0) {
        restOfBlock += 1;
    } else if (endMin == 0) {
        restOfBlock = 0;
    }
    
    const endRow = scheduleTableBody.getElementsByTagName("tr")[4 * (endHour - 7) - 3 + restOfBlock];

    // const daysInEndRow = endRow.getElementsByTagName("td");
    */
    return rowSpan;

}

function addToSchedule(course, block, keys) {
    console.log(course, block, keys);
    //--> Need to delete rows replaced by rowspan (corresponding to same day)
    //--> Must implement better day identification

    // const courseEventText = document.createTextNode(course);
    
    const translatedTimeblock = translateTimeblock(block, keys);
    const daysInRow = translatedTimeblock[0];
    const blockDay = translatedTimeblock[1];
    const duration = translatedTimeblock[2];
    const startRow = translatedTimeblock[3];
    const startTime = translatedTimeblock[4];
    const startToFinish = translatedTimeblock[5];
    console.log(daysInRow, blockDay, duration, startRow);
    
    const dayData = blockDay.slice(0, 3);
    let dayCell = -1;
    for (day of daysInRow) {
        if (day.className.slice(0,3) === dayData) {
            dayCell = day;
            break;
        } else {
            continue;
        }
    }
    console.log(dayCell);
    dayCell.innerHTML = ""
    renderCourseEventInfo(dayCell, course, duration, startToFinish);

    
    const allRows = scheduleTable.getElementsByTagName("tr");

    
    for (let i = 1; i < duration; i++) {
        const duringBlock = allRows[startTime + i].getElementsByTagName("td");
        for (let dayEl of duringBlock) {
            if (dayEl.className.slice(0,3) === dayData) {
                dayEl.remove();
            }
        }

        // let tbd = thisRow.nextElementSibling;
        // tbd.getElementsByClassName(`${dayData}`).remove();
    }
    
}

function removeFromSelection(elment) {
    // const courseHeader = elment.parentElement.firstElementChild;
    // const thisCourseName = courseHeader.innerHTML;

    const selectedTimeblocks = elment.previousSibling.getAttribute("data-timeblock").split("/");
    console.log(elment.previousSibling);
    console.log(selectedTimeblocks);
    console.log(timeblocks);

    
    for (block of selectedTimeblocks) {
        console.log(block);
        const translatedTimeblock = translateTimeblock(block, timeblocks);
        const daysInRow = translatedTimeblock[0];
        const blockDay = translatedTimeblock[1];
        const duration = translatedTimeblock[2];
        const startTime = translatedTimeblock[4];
        const dayData = blockDay.slice(0, 3);

        const allRows = scheduleTable.getElementsByTagName("tr");

        for (let i = 1; i < duration; i++) {
            const duringBlock = allRows[startTime + i].getElementsByTagName("td");
            console.log(duringBlock);
            for (let j = 0; j < duringBlock.length; j++) {
                const dayEl = duringBlock[j];
                if (dayEl.className.slice(0,3) !== daysOfWeek[j]) {
                    const replacementBlock = document.createElement("td");
                    replacementBlock.setAttribute("class", `$${dayData}-cell`);
                    console.log(replacementBlock);
                    allRows[startTime + i].insertBefore(replacementBlock, dayEl);
                    break;
                }
            }
        }
        
    
        if (blockDay === 'Monday') {
            daysInRow[mondayCell].innerHTML = "";
            daysInRow[mondayCell].removeAttribute("rowspan");
        } else if (blockDay === 'Tuesday') {
            daysInRow[tuesdayCell].innerHTML = "";
            daysInRow[tuesdayCell].removeAttribute("rowspan");
        } else if (blockDay === 'Wednesday') {
            daysInRow[wednesdayCell].innerHTML = "";
            daysInRow[wednesdayCell].removeAttribute("rowspan");
        } else if (blockDay === 'Thursday') {
            daysInRow[thursdayCell].innerHTML = "";
            daysInRow[thursdayCell].removeAttribute("rowspan");
        } else if (blockDay === 'Friday') {
            daysInRow[fridayCell].innerHTML = "";
            daysInRow[fridayCell].removeAttribute("rowspan");
        } else if (blockDay === 'Saturday') {
            daysInRow[saturdayCell].innerHTML = "";
            daysInRow[saturdayCell].removeAttribute("rowspan");
        } else if (blockDay === 'Sunday') {
            daysInRow[sundayCell].innerHTML = "";
            daysInRow[sundayCell].removeAttribute("rowspan");
        } 
    }
    
    const idToRemove = elment.id;
    const idIndexInList = selectedCourseList.indexOf(`${idToRemove.replace(/\s/g, "")}-added`)
    selectedCourseList.splice(idIndexInList, 1);
    elment.parentElement.remove();
    console.log(selectedCourseList);
    // console.log(thisCourseName);
}

function renderCourseEventInfo(elment, course, duration, startToFinish) {
    for (let i = 0; i < course.length - 1; i++) {
        elment.appendChild(document.createTextNode(course[i]));
        elment.appendChild(document.createElement("br"));
    }
    
    elment.appendChild(document.createTextNode(startToFinish));
    elment.appendChild(document.createElement("br"));
    elment.appendChild(document.createTextNode(course[course.length -1]));
    elment.setAttribute("rowspan", `${duration}`);
}