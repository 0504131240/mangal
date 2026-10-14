// Starting gallery, used until the admin first changes the gallery in settings
// (after that the list lives in Firestore at mangalSettings/gallery).
// group = the section the photo appears under in the site's gallery.
window.DEFAULT_GALLERY = [
  {kind:'image', url:'images/gallery-01.jpg', cap:'שולחן אירוע מלא מהמנגל שלנו', group:'מנות ושולחן פתיחה'},
  {kind:'image', url:'images/gallery-02.jpg', cap:'מגשי עריאס בפיתה טריים', group:'מנות ושולחן פתיחה'},
  {kind:'image', url:'images/gallery-03.jpg', cap:'שולחן פתיחה: חומוס, חציל וסלטים', group:'מנות ושולחן פתיחה'},
  {kind:'image', url:'images/gallery-04.jpg', cap:'אנטריקוט פרוס וצלעות על קרש', group:'בשרים על האש'},
  {kind:'image', url:'images/gallery-05.jpg', cap:'צלעות טלה ישר מהגריל', group:'בשרים על האש'},
  {kind:'image', url:'images/gallery-06.jpg', cap:'פרגיות על האש', group:'בשרים על האש'},
  {kind:'image', url:'images/gallery-07.jpg', cap:'פלטת עוף על האש', group:'בשרים על האש'},
  {kind:'image', url:'images/gallery-08.jpg', cap:'בשרים פרוסים טריים', group:'בשרים על האש'},
  {kind:'image', url:'images/gallery-09.jpg', cap:'גחלים לוהטות, מוכנים לצלייה', group:'בשרים על האש'},
  {kind:'image', url:'images/gallery-10.jpg', cap:'שולחן ערוך באווירה חגיגית', group:'עיצוב ואווירה'},
  {kind:'image', url:'images/gallery-11.jpg', cap:'שולחן מעוצב עם פרחים', group:'עיצוב ואווירה'},
  {kind:'image', url:'images/gallery-12.jpg', cap:'סידור שולחן לאירוע גג', group:'עיצוב ואווירה'},
  {kind:'image', url:'images/gallery-13.jpg', cap:'אולם אירועים גדול, שולחנות ערוכים', group:'עיצוב ואווירה'},
  {kind:'image', url:'images/gallery-14.jpg', cap:'סידור אלגנטי לאירוע', group:'עיצוב ואווירה'},
];

// Only our own repo images, our Vercel Blob store and YouTube videos (stored as
// https://www.youtube.com/watch?v=ID or /shorts/ID) are rendered, so a tampered
// Firestore doc can't inject arbitrary URLs into the page.
const YT_SAVED=/^https:\/\/www\.youtube\.com\/(?:watch\?v=|shorts\/)([\w-]{11})$/;
window.isSafeMediaUrl = function(url){
  return typeof url==='string' && (
    /^images\/[\w.-]+$/.test(url) ||
    /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/[\w.\/-]+$/i.test(url) ||
    YT_SAVED.test(url)
  );
};

// YouTube videos: they play from YouTube, so they don't use the site's own storage or data transfer.
window.YT = {
  // a pasted link (youtu.be/ID, watch?v=ID, /shorts/ID, /embed/ID, /live/ID) → the saved form, or null
  fromLink(link){
    let u; try{ u=new URL(String(link).trim()); }catch(e){ return null; }
    const host=u.hostname.replace(/^(www\.|m\.|music\.)/,'');
    let id=null, shorts=false;
    if(host==='youtu.be') id=u.pathname.slice(1).split('/')[0];
    else if(host==='youtube.com' || host==='youtube-nocookie.com'){
      const m=u.pathname.match(/^\/(shorts|embed|live|v)\/([\w-]{11})/);
      if(m){ id=m[2]; shorts=m[1]==='shorts'; }
      else if(u.pathname==='/watch') id=u.searchParams.get('v');
    }
    if(!id || !/^[\w-]{11}$/.test(id)) return null;
    return shorts ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`;
  },
  id(url){ const m=YT_SAVED.exec(url||''); return m?m[1]:null; },
  vertical(url){ return /\/shorts\//.test(url||''); },
  thumb(url){ return `https://i.ytimg.com/vi/${this.id(url)}/hqdefault.jpg`; },
  embed(url, autoplay){ return `https://www.youtube-nocookie.com/embed/${this.id(url)}?rel=0&playsinline=1${autoplay?'&autoplay=1':''}`; },
};
