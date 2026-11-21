/* SentinelDesk motion layer. Vanilla, no dependencies, never blocks input.
   API
     SDMotion.swap(root, html, info)  replace root.innerHTML and animate the change.
         info = {key, role, ticket, view, pending}
           key     page/step id. Same key + view + ticket = in-page tweak, no motion.
           role    "c" customer, "e" engineer, "t" title/demo. A c<->e change is the handoff.
           ticket  ticket ID that should keep its identity across the change.
           view    sub-view inside a page, e.g. the open ticket in My requests ("" for the list).
           pending true only on the render right after Send or Talk to a person.
     SDMotion.enter(el)               replay the shared entrance on a persistent element.
     SDMotion.say(text)               announce a resolved state politely.
   Markup hooks
     data-sd-ticket="TKT-26887"   the ticket ID anchor (one per ticket per view: row ID or detail heading)
     data-sd-row                  the row that tints once when the ticket lands in it
     data-sd-main                 the content area that takes step-change entrances
     data-sd-status + data-sd-pending-label="Checking past cases"   badge shown while pending
     data-sd-result               result panel that shows skeleton lines while pending */
(function(){
  var RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : {matches:false};
  var EASE = 'cubic-bezier(.2,0,0,1)', STEP = 200, FLY = 320, PENDING = 1100;
  var last = null, rects = {}, ghosts = [], timers = [], liveEl = null, swaps = 0;

  function reduced(){ return RM.matches }
  function esc(v){ return window.CSS && CSS.escape ? CSS.escape(v) : String(v).replace(/"/g,'\\"') }

  function clear(){
    ghosts.forEach(function(g){ if(g.anim) g.anim.cancel(); g.el.remove(); g.dest.removeAttribute('data-sd-flying') });
    ghosts = [];
    timers.forEach(clearTimeout); timers = [];
  }

  function capture(root){
    rects = {};
    var els = root.querySelectorAll('[data-sd-ticket]');
    for(var i=0;i<els.length;i++){
      var id = els[i].getAttribute('data-sd-ticket');
      if(rects[id]) continue;
      var r = els[i].getBoundingClientRect();
      if(r.width && r.height) rects[id] = r;
    }
  }

  // Fly a copy of the destination ID from where the same ID sat before the swap.
  function fly(id, dest){
    var s = rects[id]; if(!s || !dest) return false;
    var d = dest.getBoundingClientRect();
    if(!d.width || !d.height || d.bottom < 0 || d.top > innerHeight) return false;
    var dx = s.left - d.left, dy = s.top - d.top, k = s.height / d.height;
    // Same spot (e.g. customer row -> engineer row): hold the ID solid while the surface changes around it.
    var still = Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(k - 1) < .02;
    var cs = getComputedStyle(dest), g = dest.cloneNode(true);
    g.removeAttribute('data-sd-ticket'); g.removeAttribute('id'); g.setAttribute('aria-hidden','true');
    g.classList.add('sd-ghost');
    ['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color','fontVariantNumeric','textAlign'].forEach(function(p){ g.style[p] = cs[p] });
    g.style.left = d.left + 'px'; g.style.top = d.top + 'px'; g.style.width = d.width + 'px'; g.style.height = d.height + 'px';
    document.body.appendChild(g);
    dest.setAttribute('data-sd-flying','');
    var a = g.animate(still ? [{transform:'none'},{transform:'none'}] : [{transform:'translate('+dx+'px,'+dy+'px) scale('+k+')'},{transform:'none'}],{duration:still ? STEP : FLY,easing:EASE});
    var rec = {el:g, dest:dest, anim:a}; ghosts.push(rec);
    a.onfinish = function(){ g.remove(); dest.removeAttribute('data-sd-flying'); ghosts = ghosts.filter(function(x){ return x !== rec }) };
    return true;
  }

  function enter(el){
    if(!el || reduced()) return;
    el.classList.remove('sd-enter'); void el.offsetWidth; el.classList.add('sd-enter');
  }

  function arrive(row){
    if(!row || reduced()) return;
    row.removeAttribute('data-sd-arrive'); void row.offsetWidth; row.setAttribute('data-sd-arrive','');
    timers.push(setTimeout(function(){ row.removeAttribute('data-sd-arrive') }, 1000));
  }

  function say(text){
    if(!text) return;
    if(!liveEl){ liveEl = document.createElement('div'); liveEl.className = 'sd-sr'; liveEl.setAttribute('role','status'); document.body.appendChild(liveEl) }
    liveEl.textContent = ''; setTimeout(function(){ liveEl.textContent = text }, 30);
  }

  // Simulated latency between submit and outcome. Presenter controls stay live throughout.
  function pend(root){
    var st = root.querySelector('[data-sd-status]'), res = root.querySelector('[data-sd-result]');
    if(!st && !res) return;
    var label = (st && st.getAttribute('data-sd-pending-label')) || 'Sending';
    var finalHTML = st ? st.innerHTML : '', finalText = st ? st.textContent.trim() : '';
    if(st) st.innerHTML = '<span class="badge b-mut">' + label + '</span>';
    if(res){ res.setAttribute('data-sd-pending',''); res.setAttribute('aria-busy','true'); res.setAttribute('data-generating','true') }
    say(label);
    timers.push(setTimeout(function(){
      if(st && st.isConnected){ st.innerHTML = finalHTML; if(st.firstElementChild && !reduced()) st.firstElementChild.classList.add('sd-resolve') }
      if(res && res.isConnected){ res.removeAttribute('data-sd-pending'); res.removeAttribute('aria-busy'); res.removeAttribute('data-generating'); if(!reduced()) res.classList.add('sd-resolve') }
      say(finalText);
    }, PENDING));
  }

  function swap(root, html, info){
    info = info || {};
    capture(root); clear();
    root.innerHTML = html;
    var prev = last; last = info;
    if(info.pending) pend(root);
    if(!prev) return;
    if(prev.key === info.key && (prev.view||'') === (info.view||'') && prev.ticket === info.ticket) return;

    // Measure after the caller's render finishes (banners, presenter strip) but before paint.
    var gen = ++swaps;
    queueMicrotask(function(){
      if(gen !== swaps) return;
      var dest = info.ticket ? root.querySelector('[data-sd-ticket="' + esc(info.ticket) + '"]') : null;
      var flew = !reduced() && fly(info.ticket, dest);
      if(flew) arrive(dest.closest('[data-sd-row]'));
      // Title <-> app and customer <-> engineer swap the whole frame; other steps only the content.
      var framed = prev.role !== info.role;
      enter(framed ? root : (root.querySelector('[data-sd-main]') || root));
    });
  }

  window.SDMotion = {swap:swap, enter:enter, say:say, reduced:reduced};
})();
