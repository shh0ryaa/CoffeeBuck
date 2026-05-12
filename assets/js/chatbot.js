// CoffeBuck Customized Chatbot - Digital Waiter + Receptionist + Assistant
// No external API required — all logic runs locally

(function(){
  'use strict';

  // Menu Database with all items from the website
  var MENU_DB = {
    // Hot Coffees
    espresso: { name: 'Espresso', price: 120, category: 'Hot Coffee', description: 'Pure, bold, intense. A timeless classic.' },
    cappuccino: { name: 'Cappuccino', price: 150, category: 'Hot Coffee', description: 'Rich espresso topped with velvety foam.' },
    hazelnut_latte: { name: 'Hazelnut Latte', price: 160, category: 'Hot Coffee', description: 'Nutty sweetness blended with smooth espresso.' },
    
    // Featured Brews
    caramel_macchiato: { name: 'Caramel Macchiato', price: 210, category: 'Featured', description: 'Smooth. Sweet. Comfort in a cup.' },
    classic_cold_brew: { name: 'Classic Cold Brew', price: 180, category: 'Featured', description: 'Chilled and bold — perfect for any season.' },
    matcha_latte: { name: 'Matcha Latte', price: 190, category: 'Featured', description: 'Earthy, creamy, and revitalizing.' },
    
    // Iced & Cold Brews
    iced_latte: { name: 'Iced Latte', price: 140, category: 'Iced & Cold', description: 'Smooth and refreshing.' },
    vanilla_cold_brew: { name: 'Vanilla Cold Brew', price: 170, category: 'Iced & Cold', description: 'Silky vanilla notes over cold brew.' },
    iced_mocha: { name: 'Iced Mocha', price: 180, category: 'Iced & Cold', description: 'Chocolate and espresso chilled.' },
    
    // Teas & Matcha
    classic_tea: { name: 'Classic Tea', price: 80, category: 'Teas & Matcha', description: 'Warm, comforting, classic.' },
    pure_matcha: { name: 'Pure Matcha', price: 150, category: 'Teas & Matcha', description: 'Traditional preparation, vibrant green.' },
    chai_latte: { name: 'Chai Latte', price: 140, category: 'Teas & Matcha', description: 'Aromatic spices with creamy milk.' }
  };

  // Store info
  var STORE_INFO = {
    name: 'CoffeBuck',
    about: 'Rooted in warmth, crafted with care. At CoffeBuck, every sip tells a story — warm, bold, and unforgettable.',
    locations: [
      { name: 'Connaught Place', city: 'New Delhi, India', hours: '8 AM – 10 PM' },
      { name: 'Bandra', city: 'Mumbai, India', hours: '7 AM – 11 PM' },
      { name: 'Koramangala', city: 'Bengaluru, India', hours: '8 AM – 10 PM' }
    ],
    social: { instagram: 'https://www.instagram.com/coffebuck_19/', twitter: 'https://x.com/klose1905' }
  };

  // Levenshtein distance for fuzzy matching (handles typos)
  function levenshteinDistance(str1, str2){
    var len1 = str1.length, len2 = str2.length;
    var matrix = [];
    for(var i = 0; i <= len2; i++){ matrix[i] = [i]; }
    for(var j = 0; j <= len1; j++){ matrix[0][j] = j; }
    for(i = 1; i <= len2; i++){
      for(j = 1; j <= len1; j++){
        if(str2.charCodeAt(i - 1) === str1.charCodeAt(j - 1)){ matrix[i][j] = matrix[i - 1][j - 1]; }
        else { matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1); }
      }
    }
    return matrix[len2][len1];
  }

  // Fuzzy search: find closest menu item match
  function fuzzyFindMenuItem(query){
    query = query.toLowerCase().trim();
    var bestMatch = null, bestScore = Infinity;
    for(var key in MENU_DB){
      var item = MENU_DB[key];
      var dist = levenshteinDistance(query, item.name.toLowerCase());
      if(dist < bestScore && dist <= 3){ // allow up to 3 character differences
        bestScore = dist;
        bestMatch = { key: key, item: item, distance: dist };
      }
    }
    return bestMatch;
  }

  // Parse user input and generate chatbot response
  function processUserInput(userText){
    userText = userText.toLowerCase().trim();
    var response = '';

    // Get current user for personalization
    var currentUser = null;
    if(window.AuthClient && window.AuthClient.getCurrent){
      currentUser = window.AuthClient.getCurrent();
    }

    // Get time of day for personalized greeting
    function getTimeGreeting(){
      var hour = new Date().getHours();
      if(hour < 12) return 'Good morning';
      if(hour < 17) return 'Good afternoon';
      return 'Good evening';
    }

    // Command patterns (waiter + receptionist + assistant)
    
    // 1. Menu item order: "add [item] to cart", "order [item]", "get me [item]"
    var orderMatch = userText.match(/(?:add|order|get|give|bring|i want|i need|gimme|show me)\s+(?:me\s+)?(?:a\s+)?(.+?)(?:\s+to\s+cart|\s+please|$)/i);
    if(orderMatch){
      var itemQuery = orderMatch[1].trim();
      var match = fuzzyFindMenuItem(itemQuery);
      if(match){
        var item = match.item;
        if(match.distance > 0){
          response = 'Did you mean **' + item.name + '**? (' + match.distance + ' chars off) Adding to cart...\n\n';
        }
        // Add to cart via window.CoffeBuck
        if(window.CoffeBuck){
          window.CoffeBuck.addToCart({ id: match.key, name: item.name, price: item.price, qty: 1 });
        }
        response += '✓ Added **' + item.name + '** (₹' + item.price + ') to your cart.';
        if(currentUser){
          response += ' Great choice, ' + currentUser.username + '! ☕';
        }
        return response;
      } else {
        return 'Hmm, I couldn\'t find "' + itemQuery + '" on our menu. 🤔 Try asking for items like Espresso, Cappuccino, Matcha Latte, or Cold Brew. What can I get you?';
      }
    }

    // 2. Price query: "how much is [item]", "price of [item]", "cost of [item]"
    var priceMatch = userText.match(/(?:how much|price|cost|what.*cost)\s+(?:is|for|of)?\s+(?:the\s+)?(?:a\s+)?(.+?)(?:\s*\?|$)/i);
    if(priceMatch){
      var itemQuery = priceMatch[1].trim();
      var match = fuzzyFindMenuItem(itemQuery);
      if(match){
        var item = match.item;
        return '**' + item.name + '** costs ₹' + item.price + '. ' + item.description;
      } else {
        return 'I couldn\'t find "' + itemQuery + '" on our menu. Try asking about items like Cappuccino, Matcha Latte, or Iced Mocha!';
      }
    }

    // 3. Checkout / Payment: "checkout", "pay", "go to payment", "complete order"
    if(userText.match(/(?:checkout|pay|payment|proceed|complete|finish)\b/i)){
      response = 'Great! Taking you to checkout. 💳';
      setTimeout(function(){
        window.location.href = 'payment.html';
      }, 1000);
      return response;
    }

    // 4. View cart: "show cart", "what's in my cart", "cart"
    if(userText.match(/(?:show|view|what.*in|list).* cart\b/i) || userText === 'cart'){
      if(window.CoffeBuck){
        var cart = window.CoffeBuck.getCart();
        if(cart.length === 0){
          return 'Your cart is empty. 🛒 What can I get for you?';
        }
        var summary = '**Your Cart:**\n';
        var total = 0;
        for(var i = 0; i < cart.length; i++){
          summary += (i + 1) + '. ' + cart[i].name + ' x' + cart[i].qty + ' = ₹' + (cart[i].price * cart[i].qty) + '\n';
          total += cart[i].price * cart[i].qty;
        }
        summary += '\n**Subtotal:** ₹' + total;
        return summary;
      }
    }

    // 5. About CoffeBuck: "who are you", "about", "tell me about", "company"
    if(userText.match(/(?:who are you|what is|about|company|story|background)\b/i)){
      return '☕ **About CoffeBuck**\n\n' + STORE_INFO.about + '\n\nWe partner with ethical farms, prioritize sustainability, and craft every cup with love. Our cafes are warm, welcoming havens — a space to slow down and connect. ❤️';
    }

    // 6. Locations: "locations", "where are you", "where can I find", "stores"
    if(userText.match(/(?:location|store|where|find|near)\b/i)){
      var locRes = '🏪 **Our Locations:**\n\n';
      for(var i = 0; i < STORE_INFO.locations.length; i++){
        var loc = STORE_INFO.locations[i];
        locRes += '**' + loc.name + '** - ' + loc.city + '\n' + 'Hours: ' + loc.hours + '\n\n';
      }
      locRes += 'Visit our [Store Locator](store-locator.html) for more details!';
      return locRes;
    }

    // 7. Menu: "show menu", "what do you have", "menu"
    if(userText.match(/(?:show|view|what.*have|list|menu)\b/i) && userText.length < 30){
      var menuRes = '📋 **CoffeBuck Menu:**\n\n**Hot Coffees:** Espresso (₹120), Cappuccino (₹150), Hazelnut Latte (₹160)\n\n**Featured:** Caramel Macchiato (₹210), Classic Cold Brew (₹180), Matcha Latte (₹190)\n\n**Iced & Cold:** Iced Latte (₹140), Vanilla Cold Brew (₹170), Iced Mocha (₹180)\n\n**Teas:** Classic Tea (₹80), Pure Matcha (₹150), Chai Latte (₹140)\n\nView our full [Menu](menu.html) for more!';
      return menuRes;
    }

    // 8. How the website works: "how to", "guide", "how do I", "help"
    if(userText.match(/(?:how to|guide|help|how do i|how.*work|tutorial)\b/i)){
      return '🎯 **How to Use CoffeBuck:**\n\n1. **Browse** our [Menu](menu.html) or ask me about items.\n2. **Order** by saying "add Espresso to cart" or "I want a Cappuccino".\n3. **Review** your cart — just ask "show me my cart".\n4. **Checkout** — say "checkout" or visit [Payment](payment.html).\n5. **Connect** via our [Contact](contact.html) page if you have questions.\n\nI\'m here as your digital waiter, receptionist, and assistant! 👋';
    }

    // 9. Remove from cart / Clear cart: "remove [item]", "clear cart"
    if(userText.match(/clear.*cart|remove all|empty cart\b/i)){
      if(window.CoffeBuck){
        window.CoffeBuck.clearCart();
        return 'Your cart has been cleared. 🗑️ Ready to order again?';
      }
    }

    // 10. General greeting / help
    if(userText.match(/^(?:hi|hello|hey|greetings|what can you|help me)\b/i)){
      var greeting = getTimeGreeting();
      var personalGreeting = greeting + '! 👋 ';
      if(currentUser){
        personalGreeting += 'Welcome back, **' + currentUser.username + '**! ';
      }
      personalGreeting += 'I\'m your **CoffeBuck Digital Assistant**. I can:\n\n✓ Help you **order** items from our menu\n✓ Tell you about **pricing** and our coffee brews\n✓ Answer questions about **CoffeBuck** and its story\n✓ Show you **locations** and hours';
      if(currentUser){
        personalGreeting += '\n✓ View your **order history** from your profile\n✓ Help you **reorder** your favorites';
      }
      personalGreeting += '\n✓ Guide you through the **checkout** process\n✓ Manage your **cart**\n\nWhat can I get for you today? ☕';
      return personalGreeting;
    }

    // 11. Social media / Contact: "instagram", "facebook", "contact"
    if(userText.match(/(?:instagram|facebook|twitter|social|contact|reach|follow)\b/i)){
      return '📱 **Connect With Us:**\n\n🔷 [Instagram](https://www.instagram.com/coffebuck_19/) - @coffebuck_19\n🐦 [Twitter/X](https://x.com/klose1905)\n\nOr visit our [Contact](contact.html) page to send us a message! We\'d love to hear from you. ❤️';

        // 12. Personalized recommendations / Favorites
        if(userText.match(/(?:recommend|suggest|favorite|what should i|what do you suggest|suggestion)\b/i)){
          if(currentUser && currentUser.orders && currentUser.orders.length > 0){
            var allItems = [];
            currentUser.orders.forEach(function(order){
              if(order.items){
                order.items.forEach(function(item){
                  allItems.push(item.name);
                });
              }
            });
            if(allItems.length > 0){
              var mostOrdered = allItems[0];
              return '🎯 **Personalized for You:**\n\nBased on your order history, you\'ve loved **' + mostOrdered + '** in the past! Why not try it again? Or we have some **new seasonal flavors** you might enjoy. What sounds good?';
            }
          }
          return '☕ **Our Popular Picks:**\n\n✨ **Caramel Macchiato** - Smooth and sweet comfort\n✨ **Classic Cold Brew** - Perfect all year round\n✨ **Matcha Latte** - Earthy and revitalizing\n\nOr ask me about any item to learn more!';
        }

        // 13. Profile / Account info
        if(userText.match(/(?:profile|account|my account|my orders|order history)\b/i)){
          if(currentUser){
            var orderCount = (currentUser.orders && currentUser.orders.length) ? currentUser.orders.length : 0;
            return '👤 **Your Profile:**\n\n📧 Email: ' + currentUser.email + '\n📋 Total Orders: ' + orderCount + '\n\nVisit your [Profile](profile.html) to see your complete order history and account details!';
          } else {
            return 'Please [login](auth.html) to view your profile and order history!';
          }
        }
    }

    // Default: polite fallback
    return 'I\'m not sure I caught that! 🤔 Try asking me about:\n\n• **Items:** "Add Cappuccino to cart" or "How much is Matcha Latte?"\n• **Info:** "About CoffeBuck", "Where are you?", "Show me the menu"\n• **Help:** "How do I order?" or "Show my cart"\n\nWhat can I help you with?';
  }

  // Expose the chatbot processor to window so main.js can use it
  window.CoffeBuckChatbot = {
    processInput: processUserInput,
    menuDb: MENU_DB,
    storeInfo: STORE_INFO
  };

})();
