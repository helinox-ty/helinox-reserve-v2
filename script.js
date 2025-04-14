document.addEventListener('DOMContentLoaded', function() {
    // 날짜 선택 제한 설정
    const dateInput = document.getElementById('date');
    const today = new Date();
    const maxDate = new Date();
    maxDate.setMonth(today.getMonth() + 1); // 1개월 후까지 예약 가능

    dateInput.min = today.toISOString().split('T')[0];
    dateInput.max = maxDate.toISOString().split('T')[0];

    // 예약 폼 제출 처리
    const reservationForm = document.querySelector('form');
    reservationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const department = document.getElementById('department').value;
        const date = document.getElementById('date').value;

        // 예약 정보 저장 (실제로는 서버로 전송해야 함)
        const reservation = {
            name: name,
            department: department,
            date: date
        };

        // 로컬 스토리지에 저장
        let reservations = JSON.parse(localStorage.getItem('reservations')) || [];
        reservations.push(reservation);
        localStorage.setItem('reservations', JSON.stringify(reservations));

        // 예약 완료 알림
        alert('예약이 완료되었습니다!');
        reservationForm.reset();
    });

    // 이미지 모달 기능
    const imageModal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    
    document.querySelectorAll('.gallery-item img').forEach(img => {
        img.addEventListener('click', function() {
            modalImage.src = this.src;
        });
    });
}); 