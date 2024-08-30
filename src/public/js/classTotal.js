async function queryDurations() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
        alert('请填写起始日期和结束日期');
        return;
    }

    try {
        const response = await fetch(`/classroom/total/getdata?sDate=${startDate}&eDate=${endDate}`);

        const data = await response.json();
        if (data.code !== 0) {
            alert('查询过程中发生错误');
            return;
        }
        const teacherDurations = data.data.filter(item => item.type === 'teacher');
        const studentDurations = data.data.filter(item => item.type === 'parent');
        displayResults(teacherDurations, studentDurations);
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('查询过程中发生错误');
    }
}

function displayResults(teacherDurations, studentDurations) {
    const teacherTotal = teacherDurations.reduce((total, duration) => total + duration.duration, 0);
    const studentTotal = studentDurations.reduce((total, duration) => total + duration.duration, 0);

    document.getElementById('teacherTotal').textContent = `${teacherTotal.toFixed(2)} hours`;
    document.getElementById('studentTotal').textContent = `${studentTotal.toFixed(2)} hours`;

    const teacherDetailsElement = document.getElementById('teacherDetails');
    teacherDetailsElement.innerHTML = '';
    for (const { name, duration, items } of teacherDurations) {
        const li = document.createElement('li');
        li.textContent = `${name}: ${duration} h`;
        li.onclick = () => showDetails(name, items);
        teacherDetailsElement.appendChild(li);
    }

    const studentDetailsElement = document.getElementById('studentDetails');
    studentDetailsElement.innerHTML = '';
    for (const { name, duration, items } of studentDurations) {
        const li = document.createElement('li');
        li.textContent = `${name}: ${duration} h`;
        li.onclick = () => showDetails(name, items);
        studentDetailsElement.appendChild(li);
    }
}

function showDetails(name, details) {
    const modal = document.getElementById('detailsModal');
    const modalTitle = document.getElementById('modalTitle');
    const detailsList = document.getElementById('detailsList');

    modalTitle.textContent = `${name} 的上课明细`;
    detailsList.innerHTML = '';

    details.forEach(detail => {
        const li = document.createElement('li');
        li.textContent = `title: ${detail.title}, sdate: ${new Date(detail.sdate).toLocaleString()}, edate: ${new Date(detail.edate).toLocaleString()}, time: ${detail.hours} hours， who: ${detail.who}`;
        detailsList.appendChild(li);
    });

    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('detailsModal');
    modal.style.display = 'none';
}

// 点击模态框外部关闭模态框
window.onclick = function (event) {
    const modal = document.getElementById('detailsModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}