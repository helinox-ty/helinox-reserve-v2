const supabase = require('./utils/supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: '예약 목록을 성공적으로 불러왔습니다.',
        reservations: data 
      }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        message: '예약 목록을 불러오는 중 오류가 발생했습니다.', 
        error: error.message 
      }),
    };
  }
}; 