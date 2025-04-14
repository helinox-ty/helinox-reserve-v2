// 예약 목록 표시
function displayReservations() {
    const reservations = JSON.parse(localStorage.getItem('reservations')) || [];
    const reservationList = document.getElementById('reservationList');
    reservationList.innerHTML = '';

    reservations.forEach(reservation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${reservation.reservationNumber}</td>
            <td>${reservation.name}</td>
            <td>${reservation.department}</td>
            <td>${reservation.date}</td>
            <td>${reservation.people}명</td>
            <td><span class="status-badge status-${reservation.status === '확정' ? 'confirmed' : 'cancelled'}">${reservation.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editReservation('${reservation.reservationNumber}')">수정</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteReservation('${reservation.reservationNumber}')">삭제</button>
            </td>
        `;
        reservationList.appendChild(row);
    });
}

// 예약 수정
function editReservation(reservationNumber) {
    const reservations = JSON.parse(localStorage.getItem('reservations')) || [];
    const reservation = reservations.find(res => res.reservationNumber === reservationNumber);
    
    if (reservation) {
        // 수정 폼 표시
        const newName = prompt('이름을 입력하세요', reservation.name);
        const newDepartment = prompt('부서를 입력하세요', reservation.department);
        const newDate = prompt('날짜를 입력하세요 (YYYY-MM-DD)', reservation.date);
        const newPeople = prompt('인원 수를 입력하세요', reservation.people);
        
        if (newName && newDepartment && newDate && newPeople) {
            reservation.name = newName;
            reservation.department = newDepartment;
            reservation.date = newDate;
            reservation.people = newPeople;
            
            localStorage.setItem('reservations', JSON.stringify(reservations));
            displayReservations();
            alert('예약 정보가 수정되었습니다.');
        }
    }
}

// 예약 삭제
function deleteReservation(reservationNumber) {
    if (confirm('정말로 이 예약을 삭제하시겠습니까?')) {
        const reservations = JSON.parse(localStorage.getItem('reservations')) || [];
        const filteredReservations = reservations.filter(res => res.reservationNumber !== reservationNumber);
        
        localStorage.setItem('reservations', JSON.stringify(filteredReservations));
        displayReservations();
        alert('예약이 삭제되었습니다.');
    }
}

// 예약 불가 날짜 추가
function addBlockDate() {
    const dateInput = document.getElementById('blockDate');
    const date = dateInput.value;
    
    if (date) {
        const blockedDates = JSON.parse(localStorage.getItem('blockedDates')) || [];
        
        if (!blockedDates.includes(date)) {
            blockedDates.push(date);
            localStorage.setItem('blockedDates', JSON.stringify(blockedDates));
            displayBlockedDates();
            dateInput.value = '';
        } else {
            alert('이미 등록된 날짜입니다.');
        }
    }
}

// 예약 불가 날짜 표시
function displayBlockedDates() {
    const blockedDates = JSON.parse(localStorage.getItem('blockedDates')) || [];
    const blockedDatesContainer = document.getElementById('blockedDates');
    blockedDatesContainer.innerHTML = '';
    
    blockedDates.forEach(date => {
        const dateItem = document.createElement('div');
        dateItem.className = 'blocked-date-item';
        dateItem.innerHTML = `
            <span>${date}</span>
            <button class="btn btn-sm btn-outline-danger" onclick="removeBlockedDate('${date}')">삭제</button>
        `;
        blockedDatesContainer.appendChild(dateItem);
    });
}

// 예약 불가 날짜 삭제
function removeBlockedDate(date) {
    const blockedDates = JSON.parse(localStorage.getItem('blockedDates')) || [];
    const filteredDates = blockedDates.filter(d => d !== date);
    
    localStorage.setItem('blockedDates', JSON.stringify(filteredDates));
    displayBlockedDates();
}

// 캠핑장 운영 상태 변경
document.getElementById('campgroundStatus').addEventListener('change', function(e) {
    localStorage.setItem('campgroundStatus', e.target.checked);
});

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    displayReservations();
    displayBlockedDates();
    
    // 캠핑장 운영 상태 복원
    const campgroundStatus = localStorage.getItem('campgroundStatus');
    if (campgroundStatus !== null) {
        document.getElementById('campgroundStatus').checked = campgroundStatus === 'true';
    }
});

// 예약 데이터를 가져오는 함수
async function fetchReservations() {
    try {
        const response = await fetch('/api/reservations');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('예약 데이터를 가져오는 중 오류 발생:', error);
        return [];
    }
}

// 예약 목록을 화면에 표시하는 함수
function displayReservations(reservations) {
    const reservationList = document.getElementById('reservationList');
    reservationList.innerHTML = '';

    reservations.forEach(reservation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${reservation.name}</td>
            <td class="px-6 py-4 whitespace-nowrap">${reservation.department}</td>
            <td class="px-6 py-4 whitespace-nowrap">${formatDate(reservation.start_date)} ~ ${formatDate(reservation.end_date)}</td>
            <td class="px-6 py-4 whitespace-nowrap">${reservation.number_of_people}명</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 rounded-full ${getStatusClass(reservation.status)}">
                    ${getStatusText(reservation.status)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="viewReservation(${reservation.id})" class="text-blue-600 hover:text-blue-800">상세보기</button>
            </td>
        `;
        reservationList.appendChild(row);
    });
}

// 예약 상태에 따른 스타일 클래스 반환
function getStatusClass(status) {
    switch (status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'approved':
            return 'bg-green-100 text-green-800';
        case 'rejected':
            return 'bg-red-100 text-red-800';
        case 'cancelled':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// 예약 상태 텍스트 반환
function getStatusText(status) {
    switch (status) {
        case 'pending':
            return '대기중';
        case 'approved':
            return '승인됨';
        case 'rejected':
            return '거절됨';
        case 'cancelled':
            return '취소됨';
        default:
            return '알 수 없음';
    }
}

// 날짜 포맷팅 함수
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 예약 상세 정보 표시
async function viewReservation(id) {
    try {
        const response = await fetch(`/api/reservations/${id}`);
        const reservation = await response.json();
        
        const modal = document.getElementById('reservationModal');
        const details = document.getElementById('reservationDetails');
        
        details.innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="font-semibold">예약자</p>
                    <p>${reservation.name}</p>
                </div>
                <div>
                    <p class="font-semibold">부서</p>
                    <p>${reservation.department}</p>
                </div>
                <div>
                    <p class="font-semibold">연락처</p>
                    <p>${reservation.phone}</p>
                </div>
                <div>
                    <p class="font-semibold">이메일</p>
                    <p>${reservation.email}</p>
                </div>
                <div class="col-span-2">
                    <p class="font-semibold">예약 기간</p>
                    <p>${formatDate(reservation.start_date)} ~ ${formatDate(reservation.end_date)}</p>
                </div>
                <div>
                    <p class="font-semibold">인원</p>
                    <p>${reservation.number_of_people}명</p>
                </div>
                <div>
                    <p class="font-semibold">이용 목적</p>
                    <p>${reservation.purpose || '없음'}</p>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('예약 상세 정보를 가져오는 중 오류 발생:', error);
    }
}

// 모달 닫기
function closeModal() {
    const modal = document.getElementById('reservationModal');
    modal.classList.add('hidden');
}

// 예약 승인
async function approveReservation() {
    const id = getCurrentReservationId(); // 현재 선택된 예약 ID를 가져오는 함수
    try {
        const response = await fetch(`/api/reservations/${id}/approve`, {
            method: 'POST'
        });
        if (response.ok) {
            alert('예약이 승인되었습니다.');
            closeModal();
            loadReservations();
        }
    } catch (error) {
        console.error('예약 승인 중 오류 발생:', error);
    }
}

// 예약 거절
async function rejectReservation() {
    const id = getCurrentReservationId();
    try {
        const response = await fetch(`/api/reservations/${id}/reject`, {
            method: 'POST'
        });
        if (response.ok) {
            alert('예약이 거절되었습니다.');
            closeModal();
            loadReservations();
        }
    } catch (error) {
        console.error('예약 거절 중 오류 발생:', error);
    }
}

// 예약 필터링
function filterReservations() {
    const status = document.getElementById('statusFilter').value;
    const date = document.getElementById('dateFilter').value;
    
    // 필터링된 예약 목록을 가져오는 API 호출
    fetch(`/api/reservations?status=${status}&date=${date}`)
        .then(response => response.json())
        .then(data => displayReservations(data))
        .catch(error => console.error('예약 필터링 중 오류 발생:', error));
}

// 페이지 로드 시 예약 목록 표시
document.addEventListener('DOMContentLoaded', () => {
    loadReservations();
});

// 예약 목록 로드
async function loadReservations() {
    const reservations = await fetchReservations();
    displayReservations(reservations);
}

function openReservationModal() {
    document.getElementById('reservationModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeReservationModal() {
    document.getElementById('reservationModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
} 