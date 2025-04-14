const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const os = require('os');
const supabase = require('./utils/supabase');

const app = express();
const PORT = process.env.PORT || 3000;

// 서버의 IP 주소 가져오기
function getServerIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            // IPv4이고 내부 주소가 아닌 경우
            if (interface.family === 'IPv4' && !interface.internal) {
                return interface.address;
            }
        }
    }
    return 'localhost'; // 기본값
}

const SERVER_IP = getServerIP();

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // 현재 디렉토리의 정적 파일 제공

// 데이터 파일 경로
const DATA_DIR = path.join(__dirname, 'data');
const RESERVATIONS_FILE = path.join(DATA_DIR, 'reservations.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// 데이터 디렉토리 생성
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// 데이터 파일 초기화
if (!fs.existsSync(RESERVATIONS_FILE)) {
    fs.writeFileSync(RESERVATIONS_FILE, JSON.stringify([]));
}

if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([
        {
            email: 'admin@helinox.com',
            password: 'admin1234',
            role: 'admin'
        }
    ]));
}

// 루트 경로 핸들러
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Helinox Camping API Server' });
});

// 관리자 페이지 핸들러
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// 로그인 API
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const users = JSON.parse(fs.readFileSync(USERS_FILE));
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        res.json({ success: true, user });
    } else {
        res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
});

// 예약 목록 조회 API
app.get('/api/reservations', (req, res) => {
    const reservations = JSON.parse(fs.readFileSync(RESERVATIONS_FILE));
    res.json(reservations);
});

// 예약 생성 API
app.post('/createReservation', async (req, res) => {
    try {
        console.log('Received reservation request:', req.body);
        
        const { name, department, date, people } = req.body;

        // 필수 필드 검증
        if (!name || !department || !date || !people) {
            return res.status(400).json({
                success: false,
                message: '모든 필수 정보를 입력해주세요.'
            });
        }

        // Supabase에 예약 정보 저장
        const { data, error } = await supabase
            .from('reservations')
            .insert([
                {
                    name,
                    department,
                    reservation_date: date,
                    people: parseInt(people),
                    status: 'pending',
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        console.log('Reservation created:', data);

        res.status(200).json({
            success: true,
            message: '예약이 성공적으로 생성되었습니다.',
            data
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 예약 상태 업데이트 API
app.put('/api/reservations/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const reservations = JSON.parse(fs.readFileSync(RESERVATIONS_FILE));
    const index = reservations.findIndex(r => r.id === id);
    
    if (index === -1) {
        return res.status(404).json({ success: false, message: '예약을 찾을 수 없습니다.' });
    }
    
    reservations[index].status = status;
    fs.writeFileSync(RESERVATIONS_FILE, JSON.stringify(reservations, null, 2));
    
    res.json({ success: true, reservation: reservations[index] });
});

// 예약 불가 날짜 관련 API
app.get('/api/blocked-dates', (req, res) => {
    const blockedDates = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'blocked-dates.json')));
    res.json(blockedDates);
});

app.post('/api/blocked-dates', (req, res) => {
    const { start, end, reason } = req.body;
    
    // 입력 검증
    if (!start || !end || !reason) {
        return res.status(400).json({ 
            success: false, 
            message: '시작일, 종료일, 사유는 필수 입력 항목입니다.' 
        });
    }

    // 날짜 형식 검증
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ 
            success: false, 
            message: '올바른 날짜 형식이 아닙니다.' 
        });
    }

    // 시작일이 종료일보다 늦은 경우
    if (startDate > endDate) {
        return res.status(400).json({ 
            success: false, 
            message: '시작일은 종료일보다 빠른 날짜여야 합니다.' 
        });
    }

    const blockedDate = {
        id: Date.now().toString(),
        start,
        end,
        reason
    };
    
    const blockedDates = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'blocked-dates.json')));
    blockedDates.push(blockedDate);
    fs.writeFileSync(path.join(DATA_DIR, 'blocked-dates.json'), JSON.stringify(blockedDates, null, 2));
    
    res.json({ success: true, blockedDate });
});

app.delete('/api/blocked-dates/:id', (req, res) => {
    const { id } = req.params;
    const blockedDates = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'blocked-dates.json')));
    const initialLength = blockedDates.length;
    blockedDates = blockedDates.filter(date => date.id !== id);
    
    if (blockedDates.length === initialLength) {
        res.status(404).json({ 
            success: false, 
            message: '해당 예약 불가 기간을 찾을 수 없습니다.' 
        });
    } else {
        fs.writeFileSync(path.join(DATA_DIR, 'blocked-dates.json'), JSON.stringify(blockedDates, null, 2));
        res.json({ success: true });
    }
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
    console.log(`서버가 다음 주소에서 실행 중입니다:`);
    console.log(`- 내부 접속: http://localhost:${PORT}`);
    console.log(`- 외부 접속: http://${SERVER_IP}:${PORT}`);
});