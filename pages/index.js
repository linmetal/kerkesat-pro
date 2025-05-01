
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({
    date: '', time: '', quantity: '', location: '', notes: ''
  });

  useEffect(() => {
    fetchOrders();
    const sub = supabase
      .channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('date', { ascending: false });
    if (data) setOrders(data);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await supabase.from('orders').insert([{ ...form, status: 'Pending' }]);
    setForm({ date: '', time: '', quantity: '', location: '', notes: '' });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-4">Concrete Orders</h1>
      <form onSubmit={handleSubmit} className="grid gap-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <input name="date" type="date" value={form.date} onChange={handleChange} required className="border p-2" />
          <input name="time" type="time" value={form.time} onChange={handleChange} required className="border p-2" />
          <input name="quantity" placeholder="Quantity (m³)" value={form.quantity} onChange={handleChange} required className="border p-2" />
          <input name="location" placeholder="Location" value={form.location} onChange={handleChange} required className="border p-2" />
        </div>
        <textarea name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} className="border p-2" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Add Order</button>
      </form>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Date</th>
            <th className="border px-2 py-1">Time</th>
            <th className="border px-2 py-1">Quantity</th>
            <th className="border px-2 py-1">Location</th>
            <th className="border px-2 py-1">Notes</th>
            <th className="border px-2 py-1">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o, i) => (
            <tr key={i} className="text-center">
              <td className="border px-2 py-1">{o.date}</td>
              <td className="border px-2 py-1">{o.time}</td>
              <td className="border px-2 py-1">{o.quantity} m³</td>
              <td className="border px-2 py-1">{o.location}</td>
              <td className="border px-2 py-1">{o.notes}</td>
              <td className="border px-2 py-1">{o.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
