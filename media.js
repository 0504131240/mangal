// Shared by the site and the admin app: which gallery URLs may be shown, and YouTube link helpers.
// The gallery list itself lives in Firestore at mangalSettings/gallery and is managed from the admin settings.

// Only our own repo images, our Firebase Storage and Vercel Blob stores, and YouTube videos (stored as
// https://www.youtube.com/watch?v=ID or /shorts/ID) are rendered, so a tampered
// Firestore doc can't inject arbitrary URLs into the page.
const YT_SAVED=/^https:\/\/www\.youtube\.com\/(?:watch\?v=|shorts\/)([\w-]{11})$/;
window.isSafeMediaUrl = function(url){
  return typeof url==='string' && (
    /^images\/[\w.-]+$/.test(url) ||
    /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/[\w.\/-]+$/i.test(url) ||
    /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/mangal-b11fe\.firebasestorage\.app\/o\/gallery%2F[\w.-]+\?alt=media&token=[\w-]+$/.test(url) ||
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
