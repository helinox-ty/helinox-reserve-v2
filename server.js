const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_KEY || 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 설정
app.use(cors());

// JSON 요청 파싱
app.use(bodyParser.json());

// 데이터 파일 경로
const dataDir = path.join(__dirname, 'data');
const reservationsFile = path.join(dataDir, 'reservations.json');
const blockedDatesFile = path.join(dataDir, 'blockedDates.json');
const usersFile = path.join(dataDir, 'users.json');

// 데이터 디렉토리 확인/생성
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 예약 데이터 파일 확인/생성
if (!fs.existsSync(reservationsFile)) {
    fs.writeFileSync(reservationsFile, JSON.stringify([]));
}

// 예약 불가 날짜 파일 확인/생성
if (!fs.existsSync(blockedDatesFile)) {
    fs.writeFileSync(blockedDatesFile, JSON.stringify([]));
}

// 사용자 데이터 파일 확인/생성
if (!fs.existsSync(usersFile)) {
    const defaultAdmin = {
        username: 'admin',
        password: 'helinox2023', // 실제 환경에서는 해시된 비밀번호 사용
        role: 'admin'
    };
    fs.writeFileSync(usersFile, JSON.stringify([defaultAdmin]));
}

// 서버 IP 주소 가져오기
function getServerIP() {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return 'localhost';
}

// 루트 경로
app.get('/', (req, res) => {
    res.json({ status: 'Helinox Camping Reservation API Server is running' });
});

// 로그인 API
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ message: '사용자 이름과 비밀번호를 입력해주세요.' });
    }
    
    try {
        const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            // 실제 환경에서는 JWT 등 안전한 인증 방식 사용
            res.json({ 
                success: true, 
                user: { 
                    username: user.username, 
                    role: user.role 
                } 
            });
        } else {
            res.status(401).json({ message: '사용자 이름 또는 비밀번호가 올바르지 않습니다.' });
        }
    } catch (error) {
        console.error('로그인 처리 중 오류:', error);
        res.status(500).json({ message: '로그인 처리 중 오류가 발생했습니다.' });
    }
});

// 예약 목록 조회 API
app.get('/api/reservations', async (req, res) => {
    try {
        // Supabase에서 예약 목록 조회
        const { data, error } = await supabase
            .from('reservations')
            .select('*')
            .order('date', { ascending: true });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('예약 목록 조회 오류:', error);
        res.status(500).json({ message: '예약 목록을 가져오는 중 오류가 발생했습니다.' });
    }
});

// 예약 생성 API
app.post('/api/reservations', async (req, res) => {
    const { name, email, phone, checkIn, checkOut } = req.body;
    
    // 입력값 검증
    if (!name || !email || !phone || !checkIn || !checkOut) {
        return res.status(400).json({ message: '모든 필수 필드를 입력해주세요.' });
    }
    
    try {
        // 예약 생성
        const { data, error } = await supabase
            .from('reservations')
            .insert([
                { 
                    name, 
                    email, 
                    phone, 
                    checkIn, 
                    checkOut,
                    status: 'pending' // 기본 상태는 대기중
                }
            ])
            .select();

        if (error) throw error;

        res.status(201).json({ 
            message: '예약이 생성되었습니다. 관리자 승인 후 확정됩니다.', 
            reservation: data[0] 
        });
    } catch (error) {
        console.error('예약 생성 오류:', error);
        res.status(500).json({ message: '예약 생성 중 오류가 발생했습니다.' });
    }
});

// 예약 상태 업데이트 API
app.patch('/api/reservations/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: '유효한 상태값이 필요합니다. (pending, approved, rejected)' });
    }
    
    try {
        const { data, error } = await supabase
            .from('reservations')
            .update({ status })
            .eq('id', id)
            .select();

        if (error) throw error;
        
        if (data.length === 0) {
            return res.status(404).json({ message: '해당 ID의 예약을 찾을 수 없습니다.' });
        }

        res.json({ 
            message: '예약 상태가 업데이트되었습니다.', 
            reservation: data[0] 
        });
    } catch (error) {
        console.error('예약 상태 업데이트 오류:', error);
        res.status(500).json({ message: '예약 상태 업데이트 중 오류가 발생했습니다.' });
    }
});

// 예약 삭제 API
app.delete('/api/reservations/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const { data, error } = await supabase
            .from('reservations')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ 
            message: '예약이 성공적으로 삭제되었습니다.',
            id
        });
    } catch (error) {
        console.error('예약 삭제 오류:', error);
        res.status(500).json({ message: '예약 삭제 중 오류가 발생했습니다.' });
    }
});

// 예약 불가 날짜 목록 API
app.get('/api/blocked-dates', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('blocked_dates')
            .select('*')
            .order('start', { ascending: true });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('예약 불가 날짜 조회 오류:', error);
        res.status(500).json({ message: '예약 불가 날짜 목록을 가져오는 중 오류가 발생했습니다.' });
    }
});

// 예약 불가 날짜 추가 API
app.post('/api/blocked-dates', async (req, res) => {
    const { start, end, reason } = req.body;
    
    // 입력값 검증
    if (!start || !end || !reason) {
        return res.status(400).json({ message: '시작일, 종료일, 사유는 필수입니다.' });
    }
    
    // 날짜 유효성 검증
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: '유효하지 않은 날짜 형식입니다.' });
    }
    
    if (startDate > endDate) {
        return res.status(400).json({ message: '종료일은 시작일보다 같거나 나중이어야 합니다.' });
    }
    
    try {
        const { data, error } = await supabase
            .from('blocked_dates')
            .insert([{ start, end, reason }])
            .select();

        if (error) throw error;

        res.status(201).json({ 
            message: '예약 불가 날짜가 설정되었습니다.',
            blockedDate: data[0] 
        });
    } catch (error) {
        console.error('예약 불가 날짜 설정 오류:', error);
        res.status(500).json({ message: '예약 불가 날짜 설정 중 오류가 발생했습니다.' });
    }
});

// 예약 불가 날짜 삭제 API
app.delete('/api/blocked-dates/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const { data, error } = await supabase
            .from('blocked_dates')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ 
            message: '예약 불가 날짜가 삭제되었습니다.',
            id 
        });
    } catch (error) {
        console.error('예약 불가 날짜 삭제 오류:', error);
        res.status(500).json({ message: '예약 불가 날짜 삭제 중 오류가 발생했습니다.' });
    }
});

// 서버 시작
app.listen(PORT, () => {
    const serverIP = getServerIP();
    console.log(`서버가 시작되었습니다 - http://${serverIP}:${PORT}`);
}); 