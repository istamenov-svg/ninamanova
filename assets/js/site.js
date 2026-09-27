/* ninamanova.com · site behaviour
   CONFIG
   CHAT_API: URL of the nina-chat worker (e.g. 'https://nina-chat.<account>.workers.dev').
   When set, visitors keep chatting in the widget after the questions and Nina replies from Telegram.
   When empty, the chat ends with an email confirmation only. */
var CHAT_API = 'https://nina-chat.istamenov.workers.dev';
var FORM_ENDPOINT = 'https://formspree.io/f/xnjbbked';
var CONVERSION = 'AW-18467051626/zCDyCM_TpYEdEOqw4-VE';
var SERVICE_ZIPS = ['33301','33304','33305','33306','33308','33316','33062','33064'];

(function(){
  /* ---------- nav ---------- */
  var nav=document.querySelector('.nav');
  if(nav)addEventListener('scroll',function(){nav.classList.toggle('scrolled',scrollY>20)},{passive:true});
  var mb=document.querySelector('.menu-btn'),ml=document.querySelector('.nav ul');
  if(mb)mb.addEventListener('click',function(){var o=ml.classList.toggle('open');mb.setAttribute('aria-expanded',o);mb.textContent=o?'Close':'Menu'});


  /* ---------- hero parallax (transform-based, works on iOS Safari) ---------- */
  (function(){
    var pic=document.querySelector('.hero picture'),img=pic&&pic.querySelector('img'),copy=document.querySelector('.hero-copy');
    if(!img||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    var ticking=false;
    function update(){
      ticking=false;
      var h=pic.offsetHeight,y=Math.max(window.pageYOffset||0,0);
      if(y>h*1.2)return;                                  // hero off screen: nothing to do
      var mobile=innerWidth<=760,p=Math.min(y/h,1);
      // image drifts down at a fraction of scroll speed; the space it opens is above the viewport
      img.style.transform='translate3d(0,'+(y*(mobile?0.25:0.35)).toFixed(1)+'px,0)';
      if(copy&&!mobile){copy.style.transform='translate3d(0,'+(-y*0.12).toFixed(1)+'px,0)';copy.style.opacity=String(1-p*0.9)}
    }
    function onScroll(){if(!ticking){ticking=true;requestAnimationFrame(update)}}
    addEventListener('scroll',onScroll,{passive:true});
    addEventListener('resize',onScroll,{passive:true});
    addEventListener('orientationchange',onScroll);
    update();
  })();
  /* ---------- reveal on scroll (content below the fold only) ---------- */
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduce&&'IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.remove('pre');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
    document.querySelectorAll('.rv').forEach(function(el){if(el.getBoundingClientRect().top>innerHeight){el.classList.add('pre');io.observe(el)}});
  }

  /* ---------- journal filters ---------- */
  var fb=document.querySelectorAll('.filters button');
  fb.forEach(function(b){b.addEventListener('click',function(){
    fb.forEach(function(x){x.setAttribute('aria-pressed',x===b)});
    var c=b.dataset.cat;
    document.querySelectorAll('.card[data-cat]').forEach(function(k){k.hidden=!(c==='all'||k.dataset.cat===c)});
  })});

  /* ---------- lead submission + Google Ads conversion ---------- */
  function e164(p){var d=String(p||'').replace(/\D/g,'');if(d.length===10)return '+1'+d;if(d.length===11&&d[0]==='1')return '+'+d;return ''}
  function converted(){try{return sessionStorage.getItem('nm_converted')==='1'}catch(e){return false}}
  function markConverted(){try{sessionStorage.setItem('nm_converted','1')}catch(e){}}
  function fireConversion(email,phone){
    if(typeof gtag!=='function'||converted())return;
    var ud={};var em=String(email||'').trim().toLowerCase();if(em)ud.email=em;var ph=e164(phone);if(ph)ud.phone_number=ph;
    gtag('set','user_data',ud);                         // must come before the conversion event
    gtag('event','conversion',{send_to:CONVERSION});
    markConverted();
  }
  function submitLead(fields){
    var fd=new FormData();Object.keys(fields).forEach(function(k){if(fields[k]!==undefined&&fields[k]!=='')fd.append(k,fields[k])});
    return fetch(FORM_ENDPOINT,{method:'POST',body:fd,headers:{Accept:'application/json'}}).then(function(r){
      if(!r.ok)throw new Error('Form error '+r.status);
      fireConversion(fields.email,fields.phone);          // only after Formspree returns ok
      return r;
    });
  }

  var form=document.querySelector('form.lead');
  if(form)form.addEventListener('submit',function(e){
    e.preventDefault();
    var err=form.querySelector('.form-error');if(err)err.hidden=true;
    var req=['firstName','lastName','email'];
    for(var i=0;i<req.length;i++){var f=form.elements[req[i]];if(!f.value.trim()){f.focus();return}}
    if(!/^\S+@\S+\.\S+$/.test(form.email.value.trim())){form.email.focus();return}
    if(form._gotcha&&form._gotcha.value)return;
    var btn=form.querySelector('button[type=submit]');btn.disabled=true;
    var data={};new FormData(form).forEach(function(v,k){data[k]=v});
    data.nourishment=form.nourishment.checked?'Yes':'No';
    data.smsConsent=form.smsConsent.checked?'Yes':'No';
    submitLead(data).then(function(){
      var d=document.createElement('div');d.className='sent';d.setAttribute('role','status');
      d.textContent='Thank you, '+data.firstName+'. Nina will be in touch within 24 hours.';
      form.replaceChildren(d);
    }).catch(function(){btn.disabled=false;if(err)err.hidden=false});
  });

  /* ---------- concierge chat: scripted questions, then live chat with Nina ---------- */
  var chat=document.getElementById('chat'),cbtn=document.getElementById('chatBtn');
  if(!chat)return;
  var msgs=document.getElementById('msgs'),zf=document.getElementById('zipForm'),zi=document.getElementById('zipInput'),sub=chat.querySelector('header small'),data={};
  var live=null,bg=false,lastId=0,pollT=null,waitT=null,seen={};
  function store(k,v){try{v===null?localStorage.removeItem(k):localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  function load(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}}
  function scroll(){msgs.scrollTop=msgs.scrollHeight}
  function say(t,w){var m=document.createElement('div');m.className='m '+(w||'bot');m.textContent=t;msgs.appendChild(m);scroll();return m}
  function options(list,cb){var o=document.createElement('div');o.className='opts';list.forEach(function(x){var b=document.createElement('button');b.type='button';b.textContent=x;b.onclick=function(){o.remove();say(x,'me');cb(x)};o.appendChild(b)});msgs.appendChild(o);scroll()}
  function start(){msgs.replaceChildren();data={};zf.hidden=false;say('Hi, I’m Nina’s assistant. A few quick questions and I’ll pass you to Nina.');say('What’s your zip code?')}
  function open(){chat.hidden=false;cbtn.setAttribute('aria-expanded','true');markUnread(false);
    if(!msgs.children.length){var saved=CHAT_API&&load('nm_chat');if(saved&&saved.sid)resume(saved);else start()}
    var ta=chat.querySelector('.livebar textarea');(ta||zi).focus();if(live&&!bg)schedule(0)}
  function close(){chat.hidden=true;cbtn.setAttribute('aria-expanded','false')}
  cbtn.onclick=function(){chat.hidden?open():close()};
  var extra=[].slice.call(document.querySelectorAll('[data-chat]'));
  extra.forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();open()})});
  function markUnread(on){[cbtn].concat(extra).forEach(function(b){b.classList.toggle('unread',on)})}
  document.getElementById('chatClose').onclick=close;
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!chat.hidden)close()});

  function api(path,body){return fetch(CHAT_API.replace(/\/$/,'')+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()})}
  function render(m){if(seen[m.id])return;seen[m.id]=1;if(m.id>lastId)lastId=m.id;
    var el=say(m.text,m.sender==='nina'?'bot nina':'me');
    if(m.sender==='nina'){clearTimeout(waitT);store('nm_seen',m.id);if(chat.hidden)markUnread(true)}}
  function schedule(ms){clearTimeout(pollT);pollT=setTimeout(poll,ms)}
  function poll(){if(!live)return;api('poll',{sid:live.sid,after:bg?(load('nm_seen')||0):lastId}).then(function(r){var ms=r.messages||[];
    if(bg){if(ms.some(function(m){return m.sender==='nina'}))markUnread(true);return}ms.forEach(render)}).catch(function(){}).then(function(){schedule(chat.hidden||document.hidden?20000:3000)})}
  function liveBar(){
    zf.hidden=true;sub.textContent='Nina · replies here personally';
    var f=document.createElement('form');f.className='livebar';
    f.innerHTML='<textarea rows="1" maxlength="1000" placeholder="Write a message…" aria-label="Message"></textarea><button class="btn sm solid" type="submit">Send</button>';
    chat.appendChild(f);var ta=f.querySelector('textarea');
    ta.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();f.requestSubmit()}});
    f.addEventListener('submit',function(e){e.preventDefault();var t=ta.value.trim();if(!t)return;ta.value='';
      var pending=say(t,'me');
      api('msg',{sid:live.sid,text:t}).then(function(r){seen[r.id]=1;if(r.id>lastId)lastId=r.id;
        clearTimeout(waitT);waitT=setTimeout(function(){say('Nina may be with a client right now. She’ll answer here, or by email or text if you’ve left the page. For anything urgent, call or text (754) 999-0699.')},120000);
        schedule(1500);
      }).catch(function(){pending.classList.add('failed');say('That didn’t send. Please try again.')});
    });
  }
  function goLive(sid,history){
    bg=false;live={sid:sid};var prev=load('nm_chat');store('nm_chat',{sid:sid,name:data.firstName||(prev&&prev.name)||''});
    (history||[]).forEach(render);liveBar();schedule(3000);
  }
  function resume(saved){
    say('Welcome back'+(saved.name?', '+saved.name:'')+'.');
    api('start',{sid:saved.sid}).then(function(r){if(r.messages&&r.messages.length){goLive(r.sid,r.messages)}else{goLive(r.sid,[]);say('Type a message below and Nina will reply here.')}})
      .catch(function(){store('nm_chat',null);msgs.replaceChildren();start()});
  }
  if(CHAT_API&&load('nm_chat')){bg=true;live={sid:load('nm_chat').sid};schedule(4000)} // returning visitor: quietly check for Nina's replies and show a dot

  function contactStep(){
    say('Last step: how can Nina reach you?');
    var f=document.createElement('form');f.className='lead-mini';f.noValidate=true;
    f.innerHTML='<input type="text" name="firstName" placeholder="First name" autocomplete="given-name" aria-label="First name">'+
      '<input type="text" name="lastName" placeholder="Last name" autocomplete="family-name" aria-label="Last name">'+
      '<input type="email" name="email" placeholder="Email" autocomplete="email" aria-label="Email">'+
      '<input type="tel" name="phone" placeholder="Phone (optional)" autocomplete="tel" aria-label="Phone">'+
      '<label class="check"><input type="checkbox" name="smsConsent"> Nina may contact me by text about my inquiry</label>'+
      '<button class="btn sm solid" type="submit">Send to Nina</button>'+
      '<p style="font-size:12.5px;color:var(--ink-2)">See the <a class="u" href="/privacy/">privacy policy</a>.</p>';
    msgs.appendChild(f);scroll();f.firstName.focus();
    f.addEventListener('submit',function(e){
      e.preventDefault();
      if(!f.firstName.value.trim()){f.firstName.focus();return}
      if(!/^\S+@\S+\.\S+$/.test(f.email.value.trim())){f.email.focus();return}
      var b=f.querySelector('button');b.disabled=true;
      data.firstName=f.firstName.value.trim();data.lastName=f.lastName.value.trim();data.email=f.email.value.trim();data.phone=f.phone.value.trim();
      data.smsConsent=f.smsConsent.checked?'Yes':'No';
      var inArea=SERVICE_ZIPS.indexOf(data.zip)>-1;
      var summary='Zip '+data.zip+(inArea?'':' (confirm area)')+' · '+data.format+' · '+data.where+' · Nourishment: '+data.nourish;
      submitLead({_subject:'Chat inquiry'+(inArea?'':' · confirm area')+' · ninamanova.com',source:'chat',firstName:data.firstName,lastName:data.lastName,email:data.email,phone:data.phone,
        interest:data.format,location:data.where,nourishment:data.nourish,zip:data.zip,areaCheck:inArea?'In service area':'Confirm area',smsConsent:data.smsConsent,message:summary})
      .then(function(){
        f.remove();
        if(!CHAT_API){say('Thank you, '+data.firstName+'. Nina has your details and will reply personally, usually within 24 hours.');return}
        return api('start',{lead:{firstName:data.firstName,lastName:data.lastName,email:data.email,phone:data.phone,zip:data.zip,inArea:inArea,format:data.format,where:data.where,nourish:data.nourish}})
          .then(function(r){say('Thank you, '+data.firstName+'. Nina has your details. If you have a question, write it below and she’ll reply here.');goLive(r.sid,[])})
          .catch(function(){say('Thank you, '+data.firstName+'. Nina has your details and will reply personally, usually within 24 hours.')});
      }).catch(function(){b.disabled=false;say('Sorry, that didn’t send. Please try again, or email manova.nina@gmail.com.')});
    });
  }

  zf.addEventListener('submit',function(e){
    e.preventDefault();var z=zi.value.trim();if(!/^\d{5}$/.test(z)){zi.focus();return}
    say(z,'me');zi.value='';zf.hidden=true;data.zip=z;
    say(SERVICE_ZIPS.indexOf(z)>-1?'Lovely, that’s in Nina’s area.':'Nina will confirm whether she can come to you. Online sessions are always an option.');
    say('Which format interests you?');
    options(['Private','Semi-private','Online','Kids / teens','Not sure'],function(v){data.format=v;
      say('Where would sessions happen?');
      options(['My home','Building gym','Studio','Flexible'],function(v){data.where=v;
        say('Would you like to add Nourishment guidance to your sessions?');
        options(['Yes','Maybe later'],function(v){data.nourish=v;contactStep()});
      });
    });
  });
})();
