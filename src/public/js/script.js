document.addEventListener('DOMContentLoaded', loadClassPlans);
document.getElementById('courseForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const courseId = this.dataset.id;
    const courseTitle = document.getElementById('courseTitle').value;
    const courseStartTime = document.getElementById('courseStartTime').value;
    const courseEndTime = document.getElementById('courseEndTime').value;
    const courseHomework = document.getElementById('courseHomework').value;
    const who = document.getElementById('who').value;
    const classLevel = document.getElementById('classLevel').value;
    const isTrialClass = document.getElementById('isTrialClass').value;
    const classCategory = document.getElementById('classCategory').value;
    const classSize = document.getElementById('classSize').value;
    
    if (courseId) {
        updateClassPlan(courseId, courseTitle, courseStartTime, courseEndTime, courseHomework, who, classLevel, isTrialClass, classCategory, classSize);
    } else {
        addClassPlan(courseTitle, courseStartTime, courseEndTime, courseHomework, who, classLevel, isTrialClass, classCategory, classSize);
    }
    
    this.reset();
    delete this.dataset.id;
});

function addClassPlan(title, startTime, endTime, homework, who, classLevel, isTrialClass, classCategory, classSize) {
    fetch('/classroom/plan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, startTime, endTime, homework, who, classLevel, isTrialClass, classCategory, classSize })
    })
    .then(response => response.json())
    .then(course => {
        if(course.code==0){
            displayClassPlan({ id: course.data, title, startTime, endTime, homework, who, classLevel, isTrialClass, classCategory, classSize },'add');
        }else{
            alert(course.msg);
        }
    });
}

function updateClassPlan(id, title, startTime, endTime, homework, who, classLevel, isTrialClass, classCategory, classSize) {
    fetch(`/classroom/plan/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, startTime, endTime, homework, who, classLevel, isTrialClass, classCategory, classSize })
    })
    .then(() => {
        loadClassPlans();
    });
}

function displayClassPlan(course, type) {
    const courseList = document.getElementById('courseList');
    
    const li = document.createElement('li');
    li.innerHTML = `
        <div>
            <strong>${course.title}</strong>
            <p>Start: ${new Date(course.startTime).toLocaleString()}</p>
            <p>End: ${new Date(course.endTime).toLocaleString()}</p>
            <p>Homework: ${course.homework}</p>
            <p>Who: ${course.who}</p>
            <p>Class Level: ${course.classLevel}</p>
            <p>Is Trial Class: ${course.isTrialClass === 'true' ? 'Yes' : 'No'}</p>
            <p>Class Category: ${course.classCategory}</p>
            <p>Class Size: ${course.classSize}</p>
        </div>
        <div>
            <button class="edit">Edit</button>
            <button class="delete">Delete</button>
        </div>
    `;
    
    li.querySelector('.delete').addEventListener('click', () => {
        deleteClassPlan(course.id);
    });

    li.querySelector('.edit').addEventListener('click', () => {
        document.getElementById('courseTitle').value = course.title;
        document.getElementById('courseStartTime').value = course.startTime;
        document.getElementById('courseEndTime').value = course.endTime;
        document.getElementById('courseHomework').value = course.homework;
        document.getElementById('who').value = course.who;
        document.getElementById('classLevel').value = course.classLevel;
        document.getElementById('isTrialClass').value = course.isTrialClass;
        document.getElementById('classCategory').value = course.classCategory;
        document.getElementById('classSize').value = course.classSize;
        document.getElementById('courseForm').dataset.id = course.id;
    });
    
    if(type=='add'){
        courseList.insertBefore(li, courseList.firstChild);
    } else{
        courseList.appendChild(li);
    }   
}


function loadClassPlans() {
    fetch('/classroom/plan/query')
        .then(response => response.json())
        .then(courses => {
            if(courses.code==0){
                const courseList = document.getElementById('courseList');
                courseList.innerHTML = '';
                courses.data.forEach(course => {
                    displayClassPlan(course);
                });
            }else{
                alert(courses.msg);
            }
        });
}

function deleteClassPlan(id) {
    fetch(`/classroom/plan/${id}`, {
        method: 'DELETE'
    })
    .then(() => {
        loadClassPlans();
    });
}
