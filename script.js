document.addEventListener('DOMContentLoaded', function() {
    // 날짜 선택 제한 설정
    const dateInput = document.getElementById('date');
    const today = new Date();
    const maxDate = new Date();
    maxDate.setMonth(today.getMonth() + 1); // 1개월 후까지 예약 가능

    dateInput.min = today.toISOString().split('T')[0];
    dateInput.max = maxDate.toISOString().split('T')[0];

    // 예약 폼 제출 처리
    const reservationForm = document.getElementById('reservationForm');
    reservationForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        console.log('폼 제출 시작'); // 디버깅: 폼 제출 시작

        try {
            // 폼 데이터 수집
            const formData = {
                name: document.querySelector('input[name="이름"]').value,
                department: document.querySelector('input[name="부서"]').value,
                date: document.querySelector('input[name="날짜"]').value,
                people: parseInt(document.querySelector('select[name="인원"]').value)
            };

            console.log('요청 데이터:', formData); // 디버깅: 요청 데이터 확인

            // Netlify Function으로 POST 요청
            const response = await fetch(
                'https://incomparable-selkie-f5d92c.netlify.app/.netlify/functions/createReservation',
                {
                    method: 'POST', // 명시적 POST 메서드
                    headers: {
                        'Content-Type': 'application/json', // JSON 형식 지정
                    },
                    body: JSON.stringify(formData) // 데이터 JSON 직렬화
                }
            );

            console.log('응답 상태:', response.status); // 디버깅: 응답 상태 코드
            
            const responseData = await response.json();
            console.log('응답 데이터:', responseData); // 디버깅: 응답 데이터

            if (response.ok) {
                // 성공 시 UI 업데이트
                document.getElementById('successName').textContent = formData.name;
                document.getElementById('successDate').textContent = formData.date;
                document.getElementById('reservationSuccess').classList.remove('hidden');
                
                // 폼 초기화
                reservationForm.reset();
                
                alert('예약이 성공적으로 완료되었습니다!');
            } else {
                // HTTP 에러 처리
                throw new Error(responseData.message || '예약 처리 중 오류가 발생했습니다.');
            }
        } catch (error) {
            // 네트워크 오류 등 예외 처리
            console.error('예약 처리 중 오류 발생:', error);
            alert(`예약 처리 중 오류가 발생했습니다: ${error.message}`);
        }
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

console.log('API 테스트 시작...');

fetch('https://incomparable-selkie-f5d92c.netlify.app/.netlify/functions/createReservation', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin
    },
    body: JSON.stringify({
        name: "테스트",
        department: "개발팀",
        date: "2024-03-20",
        people: 2
    })
})
.then(res => {
    console.log('응답 상태:', res.status);
    return res.json();
})
.then(data => {
    console.log('응답 데이터:', data);
})
.catch(error => {
    console.error('에러:', error);
}); 