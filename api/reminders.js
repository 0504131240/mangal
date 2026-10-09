import { getDoc } from './_firestore.js';
import { configured, sendToAll } from './_push.js';

// Reminder the day before each approved event, never on Shabbat:
//   Sat 22:00 → Sunday's events (after Shabbat ends)
//   Fri 12:00 → Saturday's events (before Shabbat starts)
//   22:00 on Sun–Thu → the next day's events
// Vercel Cron runs this on a UTC schedule and, on the Hobby plan, at some minute within the hour,
// so vercel.json calls it in both possible UTC hours (Israel is UTC+2 in winter, UTC+3 in summer)
// and only the call that falls in the right Israel hour sends.
const TZ = 'Asia/Jerusalem';
const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export function israelNow(now) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).map((x) => [x.type, x.value]));
  const date = `${p.year}-${p.month}-${p.day}`;
  return { date, hour: Number(p.hour), weekday: new Date(`${date}T00:00:00Z`).getUTCDay() };
}

function addDays(date, n) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// the event date to remind about at this Israel time, or null when this isn't a reminder slot
export function reminderDate({ date, hour, weekday }) {
  if (weekday === 5) return hour === 12 ? addDays(date, 1) : null;
  return hour === 22 ? addDays(date, 1) : null;
}

function prepTime(t) {
  const [h, m] = t.split(':').map(Number);
  const mins = (h * 60 + m - 60 + 1440) % 1440;
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

export function reminderText(e) {
  const parts = [];
  if (/^\d{2}:\d{2}$/.test(e.washTime || '')) parts.push(`נט"י ${e.washTime} (המקום פנוי מ-${prepTime(e.washTime)})`);
  if (e.guests) parts.push(`${e.guests} משתתפים`);
  if (e.level) parts.push(e.level);
  return parts.join(' · ');
}

export default async function handler(req, res) {
  // with CRON_SECRET set in Vercel, only Vercel Cron (which sends it) can call this
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'unauthorized' });
  if (!configured()) return res.status(503).json({ error: 'push-not-configured' });

  try {
    const now = israelNow(new Date());
    const target = reminderDate(now);
    if (!target) return res.status(200).json({ skipped: 'not a reminder slot', now });

    // mangalSettings/reminders holds only the approved upcoming events' date, time, size and level
    // (no names or phones, since it is readable without signing in); the admin app keeps it in sync
    const doc = await getDoc('mangalSettings/reminders');
    const events = (doc?.fields?.events?.arrayValue?.values || []).map((v) => {
      const f = v.mapValue?.fields || {};
      return {
        date: f.date?.stringValue,
        washTime: f.washTime?.stringValue,
        guests: Number(f.guests?.integerValue || 0),
        level: f.level?.stringValue,
      };
    }).filter((e) => e.date === target);
    if (!events.length) return res.status(200).json({ skipped: 'no events', target });

    const [, m, d] = target.split('-');
    const day = `יום ${DAYS[new Date(`${target}T00:00:00Z`).getUTCDay()]} ${Number(d)}/${Number(m)}`;
    const results = [];
    for (const [i, e] of events.entries()) {
      const title = events.length > 1 ? `תזכורת: מחר ${events.length} אירועים 🔥 (${i + 1}/${events.length})` : 'תזכורת: מחר יש אירוע 🔥';
      results.push(await sendToAll({ title, body: `${day} · ${reminderText(e)}`, url: 'admin.html', tag: `reminder-${target}-${i}` }));
    }
    return res.status(200).json({ target, events: events.length, results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
