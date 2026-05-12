// App JS: mobile nav, cart, dynamic payment, contact reply
(function(){
  'use strict';

  // Customized Chatbot: Digital Waiter + Receptionist + Assistant
  // All logic is local — no external API required
  // The chatbot is initialized by chatbot.js and exposed via window.CoffeBuckChatbot

  // --- Mobile nav toggle ---
  document.addEventListener('DOMContentLoaded', function(){
    var toggle = document.getElementById('nav-toggle');
    var mobile = document.getElementById('mobile-menu');
    if(toggle && mobile){
      toggle.addEventListener('click', function(){
        mobile.classList.toggle('hidden');
        mobile.classList.toggle('show');
      });
      mobile.addEventListener('click', function(e){ if(e.target.tagName === 'A'){ mobile.classList.add('hidden'); mobile.classList.remove('show'); } });
    }

    // Smooth scroll for in-page anchors
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor){
      anchor.addEventListener('click', function(e){
        var href = anchor.getAttribute('href');
        if(href && href.length > 1){
          var target = document.querySelector(href);
          if(target){ e.preventDefault(); target.scrollIntoView({ behavior:'smooth', block:'start' }); }
        }
      });
    });

    // Initialize cart UI
    updateCartCount();

    // Attach add-to-cart handlers (require login)
    document.querySelectorAll('.add-to-cart').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.preventDefault();
        var isLogged = false;
        try{ isLogged = !!(window.AuthClient && window.AuthClient.getCurrent && window.AuthClient.getCurrent()); }catch(e){}
        if(!isLogged){
          // redirect to auth page and return to current page after
          var ret = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = 'auth.html?mode=login&redirect=' + ret;
          return;
        }
        var id = btn.getAttribute('data-id') || btn.getAttribute('data-name');
        var name = btn.getAttribute('data-name') || 'Item';
        var price = parseFloat(btn.getAttribute('data-price')) || 0;
        addToCart({ id: id, name: name, price: price, qty: 1 });
      });
    });

    // Contact form behavior (immediate acknowledgement + simulated reply)
    var contactForm = document.querySelector('form');
    if(contactForm && contactForm.querySelector('textarea')){
      contactForm.addEventListener('submit', function(e){
        e.preventDefault();
        var success = document.createElement('div');
        success.className = 'form-success mt-4';
        success.innerText = 'Thanks — we received your message and will reply shortly.';
        contactForm.appendChild(success);
        contactForm.reset();

        // Simulated reply after 2s
        setTimeout(function(){
          var reply = document.createElement('div');
          reply.className = 'form-success mt-3';
          reply.style.background = 'var(--muted)';
          reply.innerText = 'Coffebuck Team: Thanks for reaching out — we\'ll get back to you within 48 hours. ☕';
          contactForm.appendChild(reply);
        }, 2000);
      });
    }

    // --- Chatbot widget ---
    (function createChatWidget(){
      // Build DOM
      var btn = document.createElement('button');
      btn.className = 'chat-widget-btn';
      btn.setAttribute('aria-label','Open chat');
      btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      var panel = document.createElement('div');
      panel.className = 'chat-panel hidden';
      panel.innerHTML = '\n        <div class="chat-header">\n          <div>Assistant</div>\n          <button id="chat-close" aria-label="Close chat" style="background:transparent;border:none;color:inherit;font-weight:600;cursor:pointer">✕</button>\n        </div>\n        <div class="chat-messages" id="chat-messages"></div>\n        <div class="chat-input-area">\n          <textarea id="chat-input" rows="2" placeholder="Ask me about the menu, locations, or anything..." ></textarea>\n          <button id="chat-send" class="chat-send-btn">Send</button>\n        </div>\n      ';

      document.body.appendChild(btn);
      document.body.appendChild(panel);

      var closeBtn = panel.querySelector('#chat-close');
      var messagesEl = panel.querySelector('#chat-messages');
      var inputEl = panel.querySelector('#chat-input');
      var sendBtn = panel.querySelector('#chat-send');

      function openPanel(){ panel.classList.remove('hidden'); inputEl.focus(); }
      function closePanel(){ panel.classList.add('hidden'); }
      btn.addEventListener('click', function(){ if(panel.classList.contains('hidden')) openPanel(); else closePanel(); });
      closeBtn.addEventListener('click', function(){ closePanel(); });

      function appendMessage(role, text){
        var wrap = document.createElement('div'); wrap.className = 'chat-message ' + (role==='user'?'user':'bot');
        var b = document.createElement('div'); b.className = 'bubble';
        // Simple markdown support: **bold** and [link](url)
        text = text
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color:#27734F;text-decoration:underline;">$1</a>');
        b.innerHTML = text;
        wrap.appendChild(b);
        messagesEl.appendChild(wrap);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }

      // Use the local customized chatbot (no API calls needed)
      function sendToChatbot(userText){
        // Call the chatbot processor (initialized in chatbot.js)
        if(window.CoffeBuckChatbot && window.CoffeBuckChatbot.processInput){
          var response = window.CoffeBuckChatbot.processInput(userText);
          appendMessage('bot', response);
        } else {
          appendMessage('bot', 'Chatbot not loaded. Please refresh the page.');
        }
      }

      function sendHandler(){
        var text = inputEl.value && inputEl.value.trim();
        if(!text) return;
        appendMessage('user', text);
        inputEl.value = '';
        sendToChatbot(text);
      }

      sendBtn.addEventListener('click', sendHandler);
      inputEl.addEventListener('keydown', function(e){ if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendHandler(); } });

    })();

      // --- Social media floating bubbles (injected on all pages) ---
    (function createSocialBubbles(){
      var container = document.createElement('div');
      container.className = 'social-bubbles';
      // connector line
      var conn = document.createElement('div'); conn.className = 'connector'; container.appendChild(conn);

      // Helper to create anchor with svg and brand color
      function makeLink(href, title, svg, color){
        var a = document.createElement('a');
        a.href = href || '#'; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.title = title || '';
        a.innerHTML = svg;
        if(color) a.style.color = color; // svg uses currentColor
        return a;
      }

      // Instagram (filled glyph)
      var igSvg = '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 6.25a4.25 4.25 0 1 0 0 8.5 4.25 4.25 0 0 0 0-8.5zM18.5 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>';
      var ig = makeLink('https://www.instagram.com/coffebuck_19/', 'Instagram', igSvg, '#E1306C');

      // Facebook (filled 'f')
      var fbSvg = '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2.5v-2.9h2.5V9.3c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6v1.9h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"/></svg>';
      var fb = makeLink('https://www.facebook.com/', 'Facebook', fbSvg, '#1877F2');

      // X / Twitter (filled bird-ish mark)
      var xSvg = '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M21.6 6.5c-.6.3-1.2.5-1.9.6.7-.4 1.2-1 1.4-1.8-.6.4-1.3.7-2 .9-.6-.6-1.4-1-2.3-1-1.7 0-3.1 1.4-3.1 3.1 0 .2 0 .4.1.6-2.6-.1-4.9-1.4-6.5-3.3-.3.5-.4 1-.4 1.6 0 1.1.5 2.1 1.3 2.6-.5 0-1-.1-1.4-.4v.1c0 1.5 1.1 2.8 2.6 3-.3.1-.6.1-.9.1-.2 0-.4 0-.6-.1.4 1.3 1.6 2.3 3 2.3-1.1.9-2.4 1.4-3.9 1.4-.3 0-.6 0-.9-.1 1.4.9 3 1.5 4.8 1.5 5.7 0 8.9-4.8 8.9-9 0-.1 0-.2 0-.3.6-.4 1.1-1 1.5-1.6-.5.2-1 .4-1.6.5z"/></svg>';
      var x = makeLink('https://x.com/klose1905', 'Twitter / X', xSvg, '#1DA1F2');

      container.appendChild(ig);
      container.appendChild(fb);
      container.appendChild(x);
      document.body.appendChild(container);
    })();
  });

  // --- Cart functions (localStorage) ---
  var STORAGE_KEY = 'coffebuck_cart_v1';

  function getCart(){
    try{ var raw = localStorage.getItem(STORAGE_KEY); return raw? JSON.parse(raw): []; }catch(e){ return []; }
  }
  function saveCart(cart){ localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); updateCartCount(); }

  function addToCart(item){
    var cart = getCart();
    var found = cart.find(function(x){ return x.id === item.id; });
    if(found){ found.qty = Math.min(99, found.qty + (item.qty||1)); }
    else{ cart.push({ id:item.id, name:item.name, price: item.price, qty: item.qty||1 }); }
    saveCart(cart);
    flashMessage('Added to cart: ' + item.name);
  }

  function removeFromCart(id){ var cart = getCart().filter(function(x){ return x.id !== id; }); saveCart(cart); }

  function updateQty(id, qty){ var cart = getCart(); var it = cart.find(function(x){ return x.id===id; }); if(it){ it.qty = Math.max(0, Math.min(999, qty)); if(it.qty===0){ cart = cart.filter(function(x){ return x.id!==id; }); } } saveCart(cart); }

  function cartTotals(){
    var cart = getCart();
    var subtotal = cart.reduce(function(s,i){ return s + (i.price * i.qty); }, 0);
    var tax = +(subtotal * 0.08).toFixed(2); // 8% tax
    var total = +(subtotal + tax).toFixed(2);
    return { cart:cart, subtotal: +subtotal.toFixed(2), tax: tax, total: total };
  }

  function clearCart(){ localStorage.removeItem(STORAGE_KEY); updateCartCount(); }

  function updateCartCount(){
    var cart = getCart(); var count = cart.reduce(function(s,i){ return s + i.qty; }, 0);
    var el = document.getElementById('cart-count'); if(el){ el.innerText = count; }
  }

  function flashMessage(text){
    var n = document.createElement('div'); n.className = 'form-success'; n.style.position = 'fixed'; n.style.right='20px'; n.style.top='80px'; n.style.zIndex=9999; n.innerText = text; document.body.appendChild(n);
    setTimeout(function(){ n.remove(); }, 1800);
  }

  // Expose some functions to window for payment page to use
  window.CoffeBuck = {
    getCart:getCart,
    addToCart:addToCart,
    removeFromCart:removeFromCart,
    updateQty:updateQty,
    cartTotals:cartTotals,
    clearCart:clearCart,
    updateCartCount:updateCartCount
  };

})();
