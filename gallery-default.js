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

// Only our own repo images and our Vercel Blob store are rendered, so a
// tampered Firestore doc can't inject arbitrary URLs into the page.
window.isSafeMediaUrl = function(url){
  return typeof url==='string' && (
    /^images\/[\w.-]+$/.test(url) ||
    /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/[\w.\/-]+$/i.test(url)
  );
};
