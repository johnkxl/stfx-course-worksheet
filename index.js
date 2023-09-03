function createRow(row) {
    for (let j = 0; j < 7; j++) {
        // create empty td element for each day of the week
        let cell = document.createElement("td");
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
            let courseBtn = document.createElement("button");
            courseBtn.setAttribute("class", "course-btn");
            let courseText = document.createTextNode(`${matchingCourses[j].COURSE} ${matchingCourses[j].TITLE}`);
            let courseTermProf = document.createTextNode(`${matchingCourses[j].TERM} ${matchingCourses[j].PROFS}`);
            courseBtn.appendChild(courseText);
            courseBtn.appendChild(document.createElement("br"));
            courseBtn.appendChild(courseTermProf);
            coursesDiv.appendChild(courseBtn);
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
    
    const firstRow = scheduleTableBody.getElementsByTagName("tr")[1];
    const mondayCell = scheduleTableBody.getElementsByTagName("td")[1];
    mondayCell.setAttribute("rowspan", "4");
    let someText = document.createTextNode("test");
    mondayCell.appendChild(someText);
    
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
                    let courseBtnCourseArr = btn.innerHTML.split(" ").slice(0,2)
                    let btnCourseMatch = `${courseBtnCourseArr[0]} ${courseBtnCourseArr[1]}`
                    let specificCourse = courseData.find(course => course.COURSE == btnCourseMatch);
                    console.log(`${courseBtnCourseArr[0]} ${courseBtnCourseArr[1]}`)
                    console.log(specificCourse.TIMEBLOCK);
                    
                    let timeblockArr = specificCourse.TIMEBLOCK.split("/");
                    for (let i = 0; i < timeblockArr.length; i++) {
                        addToSchedule(`${specificCourse.COURSE} ${specificCourse.TITLE} ${specificCourse.TERM} ${specificCourse.PROFS} ${specificCourse.ROOM}`, timeblockArr[i], timeblocks);
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

function addToSchedule(course, block, keys) {
    console.log(course, block, keys);
    const courseEventText = document.createTextNode(course);
    const startBlock = keys.find(key => key.Timeblock === block);
    console.log(startBlock);
    let startHour = startBlock.Start.slice(0, startBlock.Start.indexOf(":"));
    console.log(startHour);

    if (startBlock.Start[startBlock.Start.length - 2] === 'P' && startHour < 12) {
        startHour = parseInt(startHour) + 12;
    }
    console.log(startHour);
    console.log(scheduleTableBody[0]);
    const startRow = scheduleTableBody.getElementsByTagName("tr")[4 * (startHour - 7) - 3];
    console.log(startRow);
    const daysInRow = startRow.getElementsByTagName("td");
    const blockDay = startBlock.Day;
    console.log(blockDay);

    

    if (blockDay === 'Monday') {
        daysInRow[mondayCell].innerHTML = "";
        daysInRow[mondayCell].appendChild(courseEventText);
    } else if (blockDay === 'Tuesday') {
        daysInRow[tuesdayCell].innerHTML = "";
        daysInRow[tuesdayCell].appendChild(courseEventText);
    } else if (blockDay === 'Wednesday') {
        daysInRow[wednesdayCell].innerHTML = "";
        daysInRow[wednesdayCell].appendChild(courseEventText);
    } else if (blockDay === 'Thursday') {
        daysInRow[thursdayCell].innerHTML = "";
        daysInRow[thursdayCell].appendChild(courseEventText);
    } else if (blockDay === 'Friday') {
        daysInRow[fridayCell].innerHTML = "";
        daysInRow[fridayCell].appendChild(courseEventText);
    } else if (blockDay === 'Saturday') {
        daysInRow[saturdayCell].innerHTML = "";
        daysInRow[saturdayCell].appendChild(courseEventText);
    } else if (blockDay === 'Sunday') {
        daysInRow[sundayCell].innerHTML = "";
        daysInRow[sundayCell].appendChild(courseEventText);
    } 
}