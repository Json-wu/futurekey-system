

const url = "/classroom";
const subid = document.getElementById('teacherId').value;
const teacher_name = document.getElementById('teacherName').value;
let current_eventId = "";
let today_course = [];
let current_course = null;
let timezoneSet = 'UTC';
let current_date;

document.addEventListener('DOMContentLoaded', () => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    timezoneSet = timeZone;
    document.getElementById('timezoneSelect').value = timeZone;
    // document.getElementById('timezone').innerText = 'timezone： ' + timeZone;

    current_date = formatDate();

    const selectedDate = document.getElementById('selectedDate');
    selectedDate.value = formatDate();
    fetchData();
    fetchNewMessages();

    // Poll for new messages every 30 seconds
    setInterval(fetchNewMessages, 30000);
});

function updateTimezone() {
    const timeZone = document.getElementById('timezoneSelect').value;
    timezoneSet = timeZone;
    // document.getElementById('timezone').innerText = 'timezone： ' + timeZone;

    fetchData();
}
// Function to open the leave modal
function openLeaveModal(course) {
    if (course) {
        document.getElementById('leaveCourse').value = JSON.stringify(course);
        document.getElementById('leave_time').innerText = formatDateTime(course.start_dt) + " ~ " + formatTime(course.end_dt);
    } else {
        // if today is not a class day, the leave date is today
        if (today_course.length == 0) {
            alert("You don't have any classes scheduled today, so there's no need to take a leave!");
            return;
        } else {
            document.getElementById('leaveCourse').value = '';
            document.getElementById('leave_time').innerText = current_date
        }
    }
    document.getElementById('leaveModal').style.display = 'flex';
}

// Function to close the leave modal
function closeLeaveModal() {
    document.getElementById('leaveCourse').value = '';
    document.getElementById('leaveModal').style.display = 'none';
}

// Function to submit the leave request
function submitLeaveRequest(course) {
    const reason = document.getElementById('leaveReason').value;
    const comment = document.getElementById('leaveComment').value;
    try {
        let course;
        if (document.getElementById('leaveCourse').value != '') {
            course = JSON.parse(document.getElementById('leaveCourse').value);
        }
        let body = {
            code: subid,
            name: teacher_name,
            reason,
            comment
        };
        if (course) {
            body.courseId = course.id;
            body.start_dt = formatDateTime(course.start_dt);
            body.end_dt = formatDateTime(course.end_dt);
        } else {
            body.courseId = null;
            const selectedDate = document.getElementById('selectedDate');
            body.start_dt = formatDate(selectedDate.value) + ' 00:00';
            body.end_dt = formatDate(selectedDate.value) + ' 23:59';
        }
        fetch(url + '/leave/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }).then(response => response.json())
            .then(data => {
                if (data.code == 0) {
                    fetchData();
                    // alert('Leave request submitted successfully!');
                } else {
                    alert(data.msg);
                }
            })
            .catch(error => {
                alert('Leave request submitted error!');
                console.log('Error:', error)
            });
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
    closeLeaveModal();
}

// Function for class hour statistics (dummy function, implement your own logic)
function showStatistics() {
    document.getElementById('courseDiv').style.display = 'none';
    document.getElementById('Statistics').style.display = 'block';
}
function hideStatistics() {
    document.getElementById('courseDiv').style.display = 'block';
    document.getElementById('Statistics').style.display = 'none';
}
function hideDetail() {
    current_course = null;
    current_eventId = "";
    document.getElementById('courseDiv').style.display = 'block';
    document.getElementById('courseDetails').style.display = 'none';
}

// 课时统计
async function calculateStatistics() {
    let sDate = new Date(document.getElementById('startDate').value);
    let eDate = new Date(document.getElementById('endDate').value);

    if (isNaN(sDate) || isNaN(eDate) || sDate > eDate) {
        alert('Please enter valid start and end dates');
        return;
    }
    sDate = document.getElementById('startDate').value;
    eDate = document.getElementById('endDate').value

    // get the total duration of all courses
    try {
        const response = await fetch(url + '/total/getdatabysubid', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ subid, sDate, eDate })
        });

        const data = await response.json();
        if (data.code !== 0) {
            alert('查询过程中发生错误');
            return;
        }
        const teacherDurations = data.data.find(item => item.type === 'teacher');
        if (teacherDurations) {
            let totalDuration = teacherDurations.duration;
            const TotalList = document.getElementById('TotalList');
            TotalList.innerHTML = '';

            // const options = { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
            // const formatter = new Intl.DateTimeFormat('en-US', options);

            teacherDurations.items.forEach(course => {
                const row = document.createElement('tr');
                row.innerHTML = `
                <td>${course.title}</td>
                <td>${formatDateTime(course.sdate)}</td>
                <td>${formatDateTime(course.edate)}</td>
                <td>${course.hours}</td>
            `;
                TotalList.appendChild(row);
            });

            document.getElementById('totalDuration').textContent = `Total Duration: ${totalDuration.toFixed(2)} hours`;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('Error fetching data');
    }
}

function printDiv(divId) {
    const divToPrint = document.getElementById(divId);
    const newWin = window.open('', 'Print-Window');
    newWin.document.open();
    newWin.document.write('<html><head><title>Print</title><style>body{font-family: Arial, sans-serif;} table{width: 100%; border-collapse: collapse;} th, td{border: 1px solid #ddd; padding: 10px; text-align: left;} th{background-color: #f2f2f2;} tbody tr:nth-child(even){background-color: #f9f9f9;}</style></head><body onload="window.print()">' + divToPrint.innerHTML + '</body></html>');
    newWin.document.close();
    setTimeout(function () { newWin.close(); }, 10);
}

async function showDetails(courseId) {
    document.getElementById('courseDiv').style.display = 'none';
    document.getElementById('courseDetails').style.display = 'block';

    current_eventId = courseId;

    const response = await fetch(url + '/course/QueryById?id=' + courseId);
    const result = await response.json();

    if (result.code != 0) {
        alert('Network response was not ok ' + response.statusText);
    }
    courseData = result.data;
    current_course = courseData;

    document.getElementById('courseName').textContent = courseData.title;
    document.getElementById('courseTime').textContent = formatDateTime(courseData.start_dt) + ' - ' + formatTime(courseData.end_dt);
    document.getElementById('courseTimezone').textContent = courseData.tz;
    document.getElementById('courseLevel').textContent = courseData.class_level;
    document.getElementById('courseType').textContent = courseData.class_category;
    document.getElementById('who').textContent = courseData.who ? replaceCommas(courseData.who) : '';
    document.getElementById('signedup').innerHTML = courseData.signed_up;
    document.getElementById('coursePreview').textContent = courseData.preview;
    document.getElementById('courseHomework').textContent = courseData.homework;

    document.getElementById('uploadedFiles_preview').innerHTML = '';
    document.getElementById('uploadedFiles_homework').innerHTML = '';
    // 加载已上传的文件
    if (courseData.value1) {
        loadUploadedFiles(courseData.value1.split('/'), 'uploadedFiles_preview');
    }
    if (courseData.value2) {
        loadUploadedFiles(courseData.value2.split('/'), 'uploadedFiles_homework');
    }

    displayData(courseData.student);
}
function loadUploadedFiles(files, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    files.forEach(filename => {
        if (filename === '') return;
        const fileItem = document.createElement('div');
        fileItem.classList.add('uploaded-file');
        fileItem.innerHTML = `
            <span><a href="/download/${filename}" target="_blank">${subStrFilename(filename)}</a></span>
            <i class="fas fa-trash delete-icon" onclick="deleteFile('${filename}', '${containerId}')"></i>
        `;
        container.appendChild(fileItem);
    });
}
function hideDetails() {
    document.getElementById('courseDiv').style.display = 'block';
    document.getElementById('courseDetails').style.display = 'none';
}
function replaceNumberToNull(str) {
    return str ? str.replace(/\d+/g, '') : str;
}
function displayData(data) {
    const studentList = document.getElementById('studentList');
    studentList.innerHTML = "";
    data.forEach(student => {
        const scode = student.code;
        if (scode == '' || student.name == '') return;
        const studentItem = document.createElement('div');
        studentItem.classList.add('rating-container');
        studentItem.id = scode;

        const studentInfo = document.createElement('div');
        studentInfo.classList.add('dropdown');
        // studentInfo.onclick = () => toggleDetails(scode);
        studentInfo.innerHTML = `
                <span onclick="toggleDetails(${scode})">${replaceNumberToNull(student.name)}</span>
                <div class="radio-group">
                    <label><input type="radio" name="attendance_${scode}" value="1" ${student.state === '1' ? 'checked' : ''} onchange="confirmHandleStatusChange('${scode}','${student.name}', 1)">Late</label>
                    <label><input type="radio" name="attendance_${scode}" value="9" ${student.state === '9' ? 'checked' : ''} onchange="confirmHandleStatusChange('${scode}','${student.name}', 9)">Absent</label>
                </div>
                <i class="fas fa-angle-right" id="arrow_${scode}" onclick="toggleDetails(${scode})"></i>
            `;
        // <span class="arrow" id="arrow_${scode}">&#9660;</span>

        const studentDetails = document.createElement('div');
        studentDetails.classList.add('details', 'hidden');
        studentDetails.id = `details_${scode}`;

        const listening = document.createElement('div');
        listening.classList.add('rating-item');
        listening.innerHTML = `
                <span style="width:80px">Listening</span>
                <div class="stars" data-rating="${student.read}" data-category="listening" data-code="${scode}">
                    <span class="star ${student.read >= 1 * 20 ? 'selected' : ''}">&#9733;</span>
                    <span class="star ${student.read >= 2 * 20 ? 'selected' : ''}">&#9733;</span>
                    <span class="star ${student.read >= 3 * 20 ? 'selected' : ''}">&#9733;</span>
                    <span class="star ${student.read >= 4 * 20 ? 'selected' : ''}">&#9733;</span>
                    <span class="star ${student.read >= 5 * 20 ? 'selected' : ''}">&#9733;</span>
                </div>
                <span class="score score_read" >${student.read}%</span>
            `;
        const stars1 = listening.querySelectorAll('.stars');
        stars1.forEach(starContainer => {
            starContainer.addEventListener('click', (e) => {
                const category = starContainer.getAttribute('data-category');
                const selectedStar = e.target;
                const starIndex = Array.from(starContainer.children).indexOf(selectedStar) + 1;

                // Update the star selection visually
                updateStars(starContainer, starIndex);

                // Update the score
                listening.getElementsByClassName(`score`)[0].textContent = starIndex * 20 + '%';
            });
        });

        const readingWriting = document.createElement('div');
        readingWriting.classList.add('rating-item');
        readingWriting.innerHTML = `
                <span style="width:80px">Reading/Writing</span>
                <div class="stars" data-rating="${student.write}" data-category="reading-writing" data-code="${scode}">
                    <span class="star ${student.write >= 1 * 20 ? 'selected' : ''}">&#9733;</span>
                    <span class="star ${student.write >= 2 * 20 ? 'selected' : ''}">&#9733;</span>
                    <span class="star ${student.write >= 3 * 20 ? 'selected' : ''}">&#9733;</span>
                    <span class="star ${student.write >= 4 * 20 ? 'selected' : ''}">&#9733;</span>
                    <span class="star ${student.write >= 5 * 20 ? 'selected' : ''}">&#9733;</span>
                </div>
                <span class="score score_write">${student.write}%</span>
            `;
        const stars2 = readingWriting.querySelectorAll('.stars');
        stars2.forEach(starContainer => {
            starContainer.addEventListener('click', (e) => {
                const category = starContainer.getAttribute('data-category');
                const selectedStar = e.target;
                const starIndex = Array.from(starContainer.children).indexOf(selectedStar) + 1;

                // Update the star selection visually
                updateStars(starContainer, starIndex);

                // Update the score
                readingWriting.getElementsByClassName(`score`)[0].textContent = starIndex * 20 + '%';
            });
        });

        const focus = document.createElement('div');
        focus.classList.add('rating-item');
        focus.innerHTML = `
                <span style="width:80px">Focus</span>
                <div class="stars" data-rating="${student.level}" data-category="focus" data-code="${scode}">
                    <span class="star ${student.level >= 1 * 20 ? 'selected' : ''}">&#9733;</span>
                    <span class="star ${student.level >= 2 * 20 ? 'selected' : ''}">&#9733;</span>
                    <span class="star ${student.level >= 3 * 20 ? 'selected' : ''}">&#9733;</span>
                    <span class="star ${student.level >= 4 * 20 ? 'selected' : ''}">&#9733;</span>
                    <span class="star ${student.level >= 5 * 20 ? 'selected' : ''}">&#9733;</span>
                </div>
                <span class="score score_level">${student.level}%</span>
            `;
        const stars3 = focus.querySelectorAll('.stars');
        stars3.forEach(starContainer => {
            starContainer.addEventListener('click', (e) => {
                const category = starContainer.getAttribute('data-category');
                const selectedStar = e.target;
                const starIndex = Array.from(starContainer.children).indexOf(selectedStar) + 1;

                // Update the star selection visually
                updateStars(starContainer, starIndex);

                // Update the score
                focus.getElementsByClassName(`score`)[0].textContent = starIndex * 20 + '%';
            });
        });

        let homewk = null;
        if (student.homework && student.homework != "undefined") {
            homewk = document.createElement('div');
            homewk.classList.add('rating-item');
            homewk.innerHTML = ` <span style="width:80px">Homework</span><a href="baidu.com"> <span><a href="/download/${student.homework}" target="_blank">${subStrFilename(student.homework)}</a></span></a>`;
        }


        const commentBox = document.createElement('div');
        commentBox.classList.add('comment-box');
        commentBox.innerHTML = `
                <label>Comment</label>
                <textarea id="comment_${scode}" maxlength="200">${student.evaluate}</textarea>
                <div class="char-counter">
                    <span id="charCount_${scode}">${student.evaluate.length}</span>/200
                </div>
            `;
        commentBox.querySelector('textarea').oninput = (event) => handleComment(event, scode);
        // Character count for the comment box

        studentDetails.appendChild(listening);
        studentDetails.appendChild(readingWriting);
        studentDetails.appendChild(focus);
        if (homewk) {
            studentDetails.appendChild(homewk);
        }

        studentDetails.appendChild(commentBox);

        studentItem.appendChild(studentInfo);
        studentItem.appendChild(studentDetails);

        studentList.appendChild(studentItem);
    });
}

// 截取文件名，保持后缀
function subStrFilename(filename) {
    const extension = filename.substring(filename.lastIndexOf('.'));
    const name = filename.substring(0, filename.lastIndexOf('.'));
    if (name.length > 5) {
        return '...' + name.substring(name.length - 5) + extension;
    }
    return filename;
}
function uploadFile(fid, sid) {
    const files = document.getElementById(fid).files;
    const uploadedFilesContainer = document.getElementById(sid);
    const existingFiles = uploadedFilesContainer.children.length;

    if (existingFiles + files.length > 2) {
        alert('You can upload up to two attachments only.');
        return;
    }
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = 'file-' + Date.now() + '-' + i;

        // 创建 FormData 对象
        const formData = new FormData();
        formData.append('file', file);

        // 向服务器发送文件
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json()) // 假设服务器返回JSON
            .then(result => {
                if (result.code !== 0) {
                    alert('Failed to upload file.');
                    return;
                }
                // 显示已上传文件
                const fileElement = document.createElement('div');
                fileElement.className = 'uploaded-file';
                fileElement.id = fileId;
                fileElement.innerHTML = `
                        <span><a href="/download/${result.data.filePath}" target="_blank" id="${result.data.filePath}">${subStrFilename(result.data.filePath)}</a></span>
                        <i class="fas fa-trash delete-icon" onclick="deleteFile('${fileId}', '${result.data.filePath}')"></i>
                    `;
                uploadedFilesContainer.appendChild(fileElement);
            })
            .catch(error => {
                alert('Failed to upload file.');
                console.error('Error:', error);
            });
    }
}

function deleteFile(fileId, filename) {
    // 向服务器发送删除请求
    fetch('/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename: filename })
    })
        .then(response => response.json()) // 假设服务器返回JSON
        .then(result => {
            if (result.code == 0) {
                // 删除前端显示的文件
                const fileElement = document.getElementById(fileId);
                fileElement.parentNode.removeChild(fileElement);
            } else {
                alert('Failed to delete file.');
            }
        })
        .catch(error => {
            alert('Failed to delete file.');
            console.error('Error:', error);
        });
}

async function fetchData() {
    try {
        const selectedDate = document.getElementById('selectedDate');
        current_date = selectedDate.value;
        const response = await fetch(url + '/course/GetData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ date: current_date, subid })
        });
        const result = await response.json();

        if (result.code != 0) {
            alert('Network response was not ok ' + response.statusText);
        }
        const courseList = document.getElementById('courseList');
        courseList.innerHTML = '';
        today_course = result.data;

        if (result.data.length == 0) {
            const courseItem = document.createElement('div');
            courseItem.classList.add('course-item');
            courseItem.textContent = "You didn't schedule any classes today, have a great time！！！";
            courseList.appendChild(courseItem);
            return;
        }

        result.data.forEach((course, index) => {
            const courseItem = document.createElement('div');
            courseItem.id = "div_" + course.id;
            courseItem.classList.add('course-item');
            if (course.attend == 9) {
                courseItem.classList.add('course-item-absent');
            }
            if (index % 3 == 0) {
                courseItem.innerHTML += `<div class="course-icon">🎓</div>`;
            } else if (index % 3 == 1) {
                courseItem.innerHTML += `<div class="course-icon">🎨</div>`;
            } else {
                courseItem.innerHTML += `<div class="course-icon">💻</div>`;
            }
            courseItem.innerHTML +=
                `<div class="course-info">
                    <h4 onclick="showDetails('${course.id}')">${course.title}</h4>
                   
                    <p><i class="fas fa-clock" title="course time"></i>&nbsp;&nbsp;${formatTime(course.start_dt)} ~ ${formatTime(course.end_dt)} <i class="fas fa-user-slash leave-icon ${course.isleave ? 'show' : 'hide'}" title="The teacher has requested leave"></i></p>
                    <p><i class="fas fa-user" title="student name"></i>&nbsp;&nbsp;${course.who ? replaceCommas(course.who) : ''}</p>
                    <p><i class="fas fa-plus add-course" title="singned up"></i>&nbsp;&nbsp;${course.signed_up}</p>
                    <div class="attendance-group">
                        <label><input type="radio" name="attendance_${course.id}" value="1" onchange="confirmAttendanceChange('${course.id}','1')">Attendance</label>
                        <label><input type="radio" name="attendance_${course.id}" value="9" onchange="confirmAttendanceChange('${course.id}','9')">NoAttendance</label>
                    </div>
                </div>
                <div class="course-arrow" onclick="showDetails('${course.id}')"><i class="fas fa-angle-right"></i></div>`;
            // courseItem.onclick = () => showDetails(course.id);
            courseList.appendChild(courseItem);
        });

        // 页面加载完毕后设置radio选中状态
        result.data.forEach(course => {
            const attendanceRadio = document.querySelector(`input[name="attendance_${course.id}"][value="${course.attend}"]`);
            if (attendanceRadio) {
                attendanceRadio.checked = true;
            }
        });
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}

async function fetchNewMessages() {
    const response = await fetch(url + '/message?code=' + subid, {
        method: 'GET'
    });
    const result = await response.json();

    if (result.code != 0) {
        alert('Network response was not ok ' + response.statusText);
        return;
    }
    messages = [];
    result.data.forEach(item => {
        const newMessage = {
            text: item.msg,
            url: item.url,
            time: item.create_date
        };
        messages.push(newMessage);
    });

    // 存储消息到 localStorage
    localStorage.setItem('messages', JSON.stringify(messages));

    updateNotificationCount(messages.length);
}

async function changeDate(days) {
    const dateInput = document.getElementById('selectedDate');
    const currentDate = new Date(dateInput.value);
    currentDate.setDate(currentDate.getDate() + days);
    dateInput.value = currentDate.toISOString().split('T')[0];
    await fetchData();
}

// 显示或隐藏消息弹出框
function toggleNotificationPopup() {
    const popup = document.getElementById('notification-popup');
    if (popup.style.display === 'none' || popup.style.display === '') {
        loadNotifications();
        popup.style.display = 'block';
    } else {
        popup.style.display = 'none';
    }
}

// 示例：更新消息数
function updateNotificationCount(count) {
    document.getElementById('notification-count').innerText = count;
}
// 加载消息记录
function loadNotifications() {
    const messages = JSON.parse(localStorage.getItem('messages')) || [];
    const notificationList = document.getElementById('notification-list');
    notificationList.innerHTML = '';
    messages.forEach(message => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<a href="${message.url}">${message.text}</a> &nbsp;&nbsp;<small>${message.time}</small>`;
        notificationList.appendChild(listItem);
    });
}

function toggleDetails(scode) {
    const details = document.getElementById('details_' + scode);
    const arrow = document.getElementById('arrow_' + scode);

    if (details.classList.contains('hidden')) {
        details.classList.remove('hidden');
        arrow.classList.add('rotated');
    } else {
        details.classList.add('hidden');
        arrow.classList.remove('rotated');
    }
}

function handleComment(e, scode) {
    console.log('handleComment');
    const comment = e.target.value;
    const charCount = document.getElementById('charCount_' + scode);
    charCount.textContent = comment.length;
}

function updateStars(container, rating) {
    const stars = container.children;
    for (let i = 0; i < stars.length; i++) {
        stars[i].classList.remove('selected');
        if (i < rating) {
            stars[i].classList.add('selected');
        }
    }
}

async function Save() {
    // 保存学生评价
    const studentInfos = [];
    const students = document.getElementById('studentList').children;
    for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const code = student.id;
        const read = student.getElementsByClassName('score_read')[0].textContent.replace('%', '');
        const write = student.getElementsByClassName('score_write')[0].textContent.replace('%', '');
        const level = student.getElementsByClassName('score_level')[0].textContent.replace('%', '');
        const evaluate = document.getElementById('comment_' + code).value;

        studentInfos.push({ code, read, write, level, evaluate });
    }

    const preview = document.getElementById('coursePreview').value;
    const homework = document.getElementById('courseHomework').value;
    let previewfiles = '';
    const previewFiles = Array.from(document.querySelectorAll('#uploadedFiles_preview .uploaded-file'));
    previewFiles.forEach(file => {
        const fileName = file.children[0].childNodes[0].id;
        previewfiles += fileName + '/';
    });

    const homeworkFiles = Array.from(document.querySelectorAll('#uploadedFiles_homework .uploaded-file'));
    let homeworkfiles = '';
    homeworkFiles.map(file => {
        const fileName = file.children[0].childNodes[0].id;
        homeworkfiles += fileName + '/';
    });

    const response = await fetch(url + '/course/SaveInfo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: current_eventId, students: studentInfos, preview, homework, previewfiles, homeworkfiles })
    });
    const result = await response.json();

    if (result.code != 0) {
        alert('Feedback submitted faild');
    } else {
        alert('Feedback submitted successfully');
    }
}

function confirmHandleStatusChange(code, name, state) {
    let msg = "Are you sure you reported the student as late? The system will immediately send a text message reminder to parents!?";
    if (state == 9) {
        msg = "Are you sure to report a student's absence from class? The system will immediately send a text message reminder to parents!?";
    }
    const confirmation = confirm(msg);
    if (confirmation) {
        handleStatusChange(code, name, state);
    } else {
        // 如果用户取消确认，则恢复原来的选中状态
        const originalValue = current_course.student.find(st => st.code == code).state;
        document.querySelector(`input[name="attendance_${code}"][value="${originalValue}"]`).checked = true;
    }
}

// Example function to handle status change
async function handleStatusChange(code, name, state) {
    console.log(`Studentcode: ${code}, Status: ${state}`);
    const response = await fetch(url + '/course/SignStudentStatus', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: current_eventId, code, name, state })
    });
    const result = await response.json();

    if (result.code != 0) {
        alert(`Failed to reported student ${replaceNumberToNull(name)}'s ${state == '1' ? 'lateness' : 'absence'} information!`);
    } else {
        current_course.student.find(st => st.code == code).state = state;
        // alert(`Successfully reported student ${replaceNumberToNull(name)}'s ${state == '1' ? 'lateness' : 'absence'} information!`);
    }
}

function confirmAttendanceChange(courseId, value) {
    let msg = "Are you sure you will attend?";
    if (value == 9) {
        msg = "Are you sure you won't attend?";
    }
    const confirmation = confirm(msg);
    if (confirmation) {
        handleAttendanceChange(courseId, value);
    } else {
        // 如果用户取消确认，则恢复原来的选中状态
        const originalValue = today_course.find(course => course.id == courseId).attend;
        document.querySelector(`input[name="attendance_${courseId}"][value="${originalValue}"]`).checked = true;
    }
}

async function handleAttendanceChange(courseId, attend) {
    const response = await fetch(url + '/course/EditData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: courseId, attend: attend })
    });
    const result = await response.json();

    if (result.code != 0) {
        alert(`Failed to report leave request!`);
        // 如果更新teamup失败，则恢复原来的选中状态
        const originalValue = today_course.find(course => course.id == courseId).attend;
        document.querySelector(`input[name="attendance_${courseId}"][value="${originalValue}"]`).checked = true;
    } else {
        const original = today_course.find(course => course.id == courseId);
        original.attend = attend;
        if (attend != 9) {
            document.getElementById("div_" + courseId).classList.remove('course-item-absent');
        } else {
            document.getElementById("div_" + courseId).classList.add('course-item-absent');
        }

        //alert(`Successfully reported leave request!`);
    }
}


function formatDate(date) {
    if (date == undefined) {
        date = new Date();
    } else {
        date = new Date(date);
    }
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezoneSet != timeZone) {
        date = new Date(date.toLocaleString('en-US', { timeZone: timezoneSet }));
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function formatDateTime(date) {
    if (date == undefined) {
        date = new Date();
    } else {
        date = new Date(date);
    }
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezoneSet != timeZone) {
        date = new Date(date.toLocaleString('en-US', { timeZone: timezoneSet }));
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}
function formatTime(date) {
    if (date == undefined) {
        date = new Date();
    } else {
        date = new Date(date);
    }
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezoneSet != timeZone) {
        date = new Date(date.toLocaleString('en-US', { timeZone: timezoneSet }));
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function replaceCommas(str) {
    console.log(str);
    let resStr = str.split(/[,，]+/).map(x => x.replace(/\d+$/, '')).join('，')
    resStr = resStr.substring(0, resStr.length - 1);
    return resStr;
}