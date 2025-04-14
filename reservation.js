function checkReservation() {
    const reservationNumber = document.getElementById('reservationNumber').value;
    const reservationName = document.getElementById('reservationName').value;

    // 로컬 스토리지에서 예약 정보 가져오기
    const reservations = JSON.parse(localStorage.getItem('reservations')) || [];
    
    // 예약 정보 찾기
    const reservation = reservations.find(res => 
        res.name === reservationName && 
        res.reservationNumber === reservationNumber
    );

    const resultDiv = document.getElementById('reservationResult');
    const noReservationDiv = document.getElementById('noReservation');

    if (reservation) {
        // 예약 정보 표시
        document.getElementById('resultNumber').textContent = reservation.reservationNumber;
        document.getElementById('resultName').textContent = reservation.name;
        document.getElementById('resultDepartment').textContent = reservation.department;
        document.getElementById('resultDate').textContent = reservation.date;
        document.getElementById('resultPeople').textContent = `${reservation.people}명`;
        document.getElementById('resultStatus').textContent = reservation.status || '확정';

        resultDiv.classList.remove('d-none');
        noReservationDiv.classList.add('d-none');
    } else {
        resultDiv.classList.add('d-none');
        noReservationDiv.classList.remove('d-none');
    }
}

function cancelReservation() {
    if (confirm('정말로 예약을 취소하시겠습니까?')) {
        const reservationNumber = document.getElementById('resultNumber').textContent;
        const reservationName = document.getElementById('resultName').textContent;

        // 로컬 스토리지에서 예약 정보 가져오기
        const reservations = JSON.parse(localStorage.getItem('reservations')) || [];
        
        // 예약 정보 찾기
        const reservationIndex = reservations.findIndex(res => 
            res.name === reservationName && 
            res.reservationNumber === reservationNumber
        );

        if (reservationIndex !== -1) {
            // 예약 상태를 취소로 변경
            reservations[reservationIndex].status = '취소';
            localStorage.setItem('reservations', JSON.stringify(reservations));

            // UI 업데이트
            document.getElementById('resultStatus').textContent = '취소';
            document.getElementById('resultStatus').classList.remove('status-confirmed');
            document.getElementById('resultStatus').classList.add('status-cancelled');
            
            alert('예약이 취소되었습니다.');
        }
    }
}

function submitReservation(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const department = document.getElementById('department').value;
    const date = document.getElementById('date').value;
    const people = document.getElementById('people').value;

    // 예약 정보 생성
    const reservation = {
        name: name,
        department: department,
        date: date,
        people: people,
        status: '확정',
        reservationNumber: Math.random().toString(36).substr(2, 8).toUpperCase()
    };

    // 로컬 스토리지에 저장
    const reservations = JSON.parse(localStorage.getItem('reservations')) || [];
    reservations.push(reservation);
    localStorage.setItem('reservations', JSON.stringify(reservations));

    // 성공 메시지 표시
    document.getElementById('successNumber').textContent = reservation.reservationNumber;
    document.getElementById('successName').textContent = name;
    document.getElementById('successDate').textContent = date;
    document.getElementById('reservationSuccess').classList.remove('d-none');

    // 폼 초기화
    event.target.reset();
}

// 페이지 로드 시 예약 번호 생성 (실제로는 서버에서 생성되어야 함)
document.addEventListener('DOMContentLoaded', function() {
    const reservations = JSON.parse(localStorage.getItem('reservations')) || [];
    reservations.forEach(reservation => {
        if (!reservation.reservationNumber) {
            reservation.reservationNumber = Math.random().toString(36).substr(2, 8).toUpperCase();
        }
    });
    localStorage.setItem('reservations', JSON.stringify(reservations));
}); 