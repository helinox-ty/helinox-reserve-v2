import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export const handler = async (event) => {
  try {
    const data = JSON.parse(event.body);
    const { error } = await supabase.from('reservations').insert([data]);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: '예약 성공!' }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
