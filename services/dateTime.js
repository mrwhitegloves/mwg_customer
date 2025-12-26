export const formatDateKey = (date) => {
  const day = date.toLocaleString('en-US', { weekday: 'short' });
  const dateNum = date.getDate();
  return `${day}-${dateNum}`;
};

export const generateNext14Days = () => {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const key = formatDateKey(d);
    const label = `${d.toLocaleString('en-US', { weekday: 'short' })}-${d.getDate()}`;
    days.push({ date: d, key, label });
  }

  return days;
};

export const generateTimeSlots = () => {
  const slots = [];
  for (let h = 8; h <= 17; h++) {
    ['00', '30'].forEach((m) => {
      if (h === 17 && m === '30') return; // 5:30 PM is after 5 PM
      const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const ampm = h >= 12 ? 'PM' : 'AM';
      slots.push(`${hour12}:${m} ${ampm}`);
    });
  }
  return slots; // ["8:00 AM","8:30 AM",...,"5:00 PM"]
};


// export const isTimeSlotEnabled = (slot, selectedDateKey) => {
//   const todayKey = formatDateKey(new Date());
//   if (selectedDateKey !== todayKey) return true; // Future dates → all enabled

//   const [time, ampm] = slot.split(' ');
//   const [hourStr, minute] = time.split(':');
//   let hour24 = parseInt(hourStr, 10);
//   if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
//   if (ampm === 'AM' && hour24 === 12) hour24 = 0;

//   const slotDate = new Date();
//   slotDate.setHours(hour24, minute === '30' ? 30 : 0, 0, 0);

//   return slotDate > new Date(); // only future or equal-to-now slots
// };

export const isTimeSlotEnabled = (slot, selectedDateKey) => {
  const todayKey = formatDateKey(new Date());

  // ✅ Future dates → all slots enabled
  if (selectedDateKey !== todayKey) return true;

  // ✅ Parse slot time
  const [time, ampm] = slot.split(' ');
  const [hourStr, minuteStr] = time.split(':');

  let hour24 = parseInt(hourStr, 10);
  if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
  if (ampm === 'AM' && hour24 === 12) hour24 = 0;

  // ✅ Slot datetime
  const slotDate = new Date();
  slotDate.setHours(hour24, parseInt(minuteStr), 0, 0);

  // ✅ Current time + 31 minutes
  const nowPlus31 = new Date(Date.now() + 31 * 60 * 1000);

  return slotDate >= nowPlus31;
};

