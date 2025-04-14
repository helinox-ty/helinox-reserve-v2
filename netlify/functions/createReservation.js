const supabase = require('./utils/supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const { name, date, time, people } = JSON.parse(event.body);

    const { data, error } = await supabase
      .from('reservations')
      .insert([
        {
          name,
          date,
          time,
          people,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: '예약이 성공적으로 생성되었습니다.', data }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: '예약 생성 중 오류가 발생했습니다.', error: error.message }),
    };
  }
}; 